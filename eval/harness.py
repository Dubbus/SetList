"""
Evaluation harness comparing multiple recommender implementations on the same
curated playlists.

Protocol: for each curated playlist, hold out some songs, feed the rest as a
query, and measure whether the held-out songs appear in the top-k
recommendations. Reports MAP@k and NDCG@k per playlist and overall.

When evaluating playlist p, the graph is built from the OTHER 12 playlists so
the algorithm can't cheat by following p's own playlist-edge to the held-out
songs. This is a proper holdout — closer to the paper's protocol than
Kenneth's `generate_random_playlist()` flow.

Recommenders share a uniform interface keyed on (title, composer) tuples, so
Kenneth's and Cebb's different Song classes can be compared directly.

Usage:
    python3 harness.py
"""

import math
import os
import random
import sys
from statistics import mean

from load_playlists import load_catalog, load_playlists

KENNETH_DIR = os.path.expanduser("~/Downloads/OneDrive_1_4-15-2026")
CEBB_DIR = os.path.join(os.path.dirname(__file__), "..", "music_recommendation")
PLAYLISTS_PATH = os.path.join(os.path.dirname(__file__), "playlists.json")

K_VALUES = [10, 20, 50]
MAX_K = max(K_VALUES)
RANDOM_SEED = 42
N_TRIALS_LARGE = 3   # random 50/50 splits for playlists of size >= 8
SIZE_THRESHOLD = 8   # below this, use leave-one-out

random.seed(RANDOM_SEED)


# ---------------------------------------------------------------------------
# Canonical song identity
# ---------------------------------------------------------------------------


def song_key(song):
    """Universal (title, composer) identity used across all recommenders."""
    return (song.title, song.composer)


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------


def average_precision(ranked_ids, relevant_set, k):
    if not relevant_set:
        return 0.0
    hits = 0
    score = 0.0
    for i, sid in enumerate(ranked_ids[:k], start=1):
        if sid in relevant_set:
            hits += 1
            score += hits / i
    denom = min(len(relevant_set), k)
    return score / denom if denom > 0 else 0.0


def ndcg_at_k(ranked_ids, relevant_set, k):
    if not relevant_set:
        return 0.0
    dcg = 0.0
    for i, sid in enumerate(ranked_ids[:k], start=1):
        if sid in relevant_set:
            dcg += 1.0 / math.log2(i + 1)
    ideal_hits = min(len(relevant_set), k)
    idcg = sum(1.0 / math.log2(i + 1) for i in range(1, ideal_hits + 1))
    return dcg / idcg if idcg > 0 else 0.0


# ---------------------------------------------------------------------------
# Splits
# ---------------------------------------------------------------------------


def split_query_holdout(playlist_keys, mode, trial_seed=None):
    """Yield (query_keys, held_keys) pairs. mode='loo' or 'random'."""
    keys = list(playlist_keys)
    if mode == "loo":
        for i in range(len(keys)):
            held = {keys[i]}
            query = [k for j, k in enumerate(keys) if j != i]
            yield query, held
    elif mode == "random":
        rng = random.Random(trial_seed)
        shuffled = keys[:]
        rng.shuffle(shuffled)
        half = len(shuffled) // 2
        yield shuffled[half:], set(shuffled[:half])


def build_splits(playlist_keys):
    size = len(playlist_keys)
    if size < 2:
        return []
    if size < SIZE_THRESHOLD:
        return list(split_query_holdout(playlist_keys, "loo"))
    splits = []
    for t in range(N_TRIALS_LARGE):
        splits.extend(split_query_holdout(playlist_keys, "random",
                                          trial_seed=RANDOM_SEED + t))
    return splits


# ---------------------------------------------------------------------------
# Recommender plugins
#
# Each recommender is an object exposing:
#   .name     -> str
#   .recommend(query_keys, training_playlists_keys, k) -> list[(title, composer)]
# ---------------------------------------------------------------------------


class KennethPPR:
    name = "Kenneth-PPR"

    def __init__(self):
        if KENNETH_DIR not in sys.path:
            sys.path.insert(0, KENNETH_DIR)
        cwd = os.getcwd()
        try:
            os.chdir(KENNETH_DIR)
            from network import build_graph, sol_extraction, biased_ppr
        finally:
            os.chdir(cwd)
        self._build_graph = build_graph
        self._sol_extraction = sol_extraction
        self._biased_ppr = biased_ppr
        # Loaded fresh so we don't share Song objects with other models
        self.songs = load_catalog(KENNETH_DIR)
        self._key_to_song = {song_key(s): s for s in self.songs}

    def _resolve(self, keys):
        out = []
        for k in keys:
            s = self._key_to_song.get(k)
            if s is not None:
                out.append(s)
        return out

    def recommend(self, query_keys, training_playlists_keys, k):
        query_songs = self._resolve(query_keys)
        if not query_songs:
            return []
        training_playlists = [
            frozenset(self._resolve(pl)) for pl in training_playlists_keys
        ]
        query_set = frozenset(query_songs)
        G = self._build_graph(self.songs, training_playlists)
        Q = self._sol_extraction(query_set, G)
        if len(Q) == 0:
            return []
        recs = self._biased_ppr(Q, query_set, self.songs, training_playlists, k)
        return [song_key(s) for s in recs]


class CebbPPR:
    name = "Cebb-PPR"

    def __init__(self):
        cebb_dir = os.path.abspath(CEBB_DIR)
        if cebb_dir not in sys.path:
            sys.path.insert(0, cebb_dir)
        cwd = os.getcwd()
        try:
            os.chdir(cebb_dir)
            from music_recommender import (
                MusicIndex,
                build_graph_index,
                recommend_from_history_graph,
                UnresolvableTitleError,
                AmbiguousQueryError,
            )
            self.index = MusicIndex()
            self._base_graph_index = build_graph_index(self.index)
        finally:
            os.chdir(cwd)
        self._build_graph_index = build_graph_index
        self._recommend = recommend_from_history_graph
        self._UnresolvableTitleError = UnresolvableTitleError
        self._AmbiguousQueryError = AmbiguousQueryError
        # (title, composer) -> music_idx for direct resolution
        self._key_to_music_idx = {
            (s.title, s.composer): s.idx for s in self.index.songs
        }

    def _resolve_indices(self, keys):
        out = []
        for k in keys:
            idx = self._key_to_music_idx.get(k)
            if idx is not None:
                out.append(idx)
        return out

    def recommend(self, query_keys, training_playlists_keys, k):
        query_indices = self._resolve_indices(query_keys)
        if not query_indices:
            return []
        # Build a fresh graph each call so playlist edges reflect the training set
        graph_index = self._build_graph_index(self.index)
        for i, pl_keys in enumerate(training_playlists_keys):
            pl_indices = self._resolve_indices(pl_keys)
            if pl_indices:
                graph_index.add_playlist(f"train_{i}", pl_indices)

        # Use unique titles for query (Cebb's API is title-based). Fall back
        # gracefully if a title is ambiguous across composers.
        query_titles = [self.index.songs[i].title for i in query_indices]
        try:
            recs = self._recommend(
                recent_songs=query_titles,
                index=self.index,
                graph_index=graph_index,
                top_k=k,
            )
        except (self._UnresolvableTitleError,
                self._AmbiguousQueryError,
                ValueError):
            return []
        return [(r.title, r.composer) for r in recs]


class HybridRRF:
    """
    Reciprocal Rank Fusion of multiple base recommenders.
    score(d) = sum_{base} 1 / (rrf_k + rank_in_base(d))
    Parameter-free (rrf_k=60 is the standard default from Cormack et al. 2009).
    """

    def __init__(self, bases, rrf_k=60):
        self.bases = bases
        self.rrf_k = rrf_k
        self.name = "Hybrid-RRF(" + "+".join(b.name for b in bases) + ")"

    def recommend(self, query_keys, training_playlists_keys, k):
        fetch_k = max(k, 50)
        scores = {}
        for base in self.bases:
            ranked = base.recommend(query_keys, training_playlists_keys, fetch_k)
            for rank, key in enumerate(ranked, start=1):
                scores[key] = scores.get(key, 0.0) + 1.0 / (self.rrf_k + rank)
        ordered = sorted(scores.items(), key=lambda kv: -kv[1])
        return [key for key, _ in ordered[:k]]


class CebbEmbedding:
    name = "Cebb-Embed"

    def __init__(self):
        cebb_dir = os.path.abspath(CEBB_DIR)
        if cebb_dir not in sys.path:
            sys.path.insert(0, cebb_dir)
        cwd = os.getcwd()
        try:
            os.chdir(cebb_dir)
            from music_recommender import (
                MusicIndex,
                recommend_from_history,
                UnresolvableTitleError,
                AmbiguousQueryError,
            )
            self.index = MusicIndex()
        finally:
            os.chdir(cwd)
        self._recommend = recommend_from_history
        self._UnresolvableTitleError = UnresolvableTitleError
        self._AmbiguousQueryError = AmbiguousQueryError
        self._key_to_music_idx = {
            (s.title, s.composer): s.idx for s in self.index.songs
        }

    def recommend(self, query_keys, training_playlists_keys, k):
        # Pure content model — training playlists are ignored.
        query_indices = [
            self._key_to_music_idx[q] for q in query_keys
            if q in self._key_to_music_idx
        ]
        if len(query_indices) < 2:
            return []
        query_titles = [self.index.songs[i].title for i in query_indices]
        try:
            recs = self._recommend(
                recent_songs=query_titles,
                index=self.index,
                per_song_top_k=50,
                final_top_k=k,
                scoring="recency_weighted",
            )
        except (self._UnresolvableTitleError,
                self._AmbiguousQueryError,
                ValueError):
            return []
        return [(r.title, r.composer) for r in recs]


# ---------------------------------------------------------------------------
# Evaluation loop
# ---------------------------------------------------------------------------


def evaluate_playlist(playlist_keys, other_playlists_keys, recommender):
    splits = build_splits(playlist_keys)
    if not splits:
        return None

    aps = {k: [] for k in K_VALUES}
    ndcgs = {k: [] for k in K_VALUES}
    n_used = 0

    for query, held in splits:
        if not query or not held:
            continue
        ranked = recommender.recommend(query, other_playlists_keys, MAX_K)
        if not ranked:
            # Empty recs still count as a trial — zero score
            for k in K_VALUES:
                aps[k].append(0.0)
                ndcgs[k].append(0.0)
            n_used += 1
            continue
        for k in K_VALUES:
            aps[k].append(average_precision(ranked, held, k))
            ndcgs[k].append(ndcg_at_k(ranked, held, k))
        n_used += 1

    return {
        "size": len(playlist_keys),
        "n_splits": n_used,
        "MAP": {k: mean(aps[k]) if aps[k] else 0.0 for k in K_VALUES},
        "NDCG": {k: mean(ndcgs[k]) if ndcgs[k] else 0.0 for k in K_VALUES},
    }


def run_recommender(recommender, playlist_keys_list, playlist_names):
    print(f"\n=== {recommender.name} ===")
    results = []
    for i, pl_keys in enumerate(playlist_keys_list):
        others = [p for j, p in enumerate(playlist_keys_list) if j != i]
        metrics = evaluate_playlist(pl_keys, others, recommender)
        results.append({"name": playlist_names[i], "metrics": metrics})
        if metrics:
            print(f"  [{i+1}/{len(playlist_keys_list)}] {playlist_names[i]}: "
                  f"MAP@10={metrics['MAP'][10]:.4f}, "
                  f"NDCG@10={metrics['NDCG'][10]:.4f}")
    return results


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def print_per_playlist(results, name_w):
    header = f"{'Playlist':<{name_w}} {'n':>4} {'splits':>7}"
    for k in K_VALUES:
        header += f" {'MAP@'+str(k):>8}"
    for k in K_VALUES:
        header += f" {'NDCG@'+str(k):>9}"
    print(header)
    print("-" * len(header))
    for r in results:
        if r["metrics"] is None:
            continue
        line = f"{r['name']:<{name_w}} {r['metrics']['size']:>4} {r['metrics']['n_splits']:>7}"
        for k in K_VALUES:
            line += f" {r['metrics']['MAP'][k]:>8.4f}"
        for k in K_VALUES:
            line += f" {r['metrics']['NDCG'][k]:>9.4f}"
        print(line)
    print("-" * len(header))
    mean_line = f"{'MEAN':<{name_w}} {'':>4} {'':>7}"
    for k in K_VALUES:
        vals = [r["metrics"]["MAP"][k] for r in results if r["metrics"]]
        mean_line += f" {mean(vals):>8.4f}"
    for k in K_VALUES:
        vals = [r["metrics"]["NDCG"][k] for r in results if r["metrics"]]
        mean_line += f" {mean(vals):>9.4f}"
    print(mean_line)


def print_leaderboard(all_results):
    print("\n" + "=" * 70)
    print("LEADERBOARD — mean across all playlists")
    print("=" * 70)
    model_w = max(len(name) for name in all_results) + 2
    header = f"{'Model':<{model_w}}"
    for k in K_VALUES:
        header += f" {'MAP@'+str(k):>9}"
    for k in K_VALUES:
        header += f" {'NDCG@'+str(k):>10}"
    print(header)
    print("-" * len(header))
    for name, results in all_results.items():
        line = f"{name:<{model_w}}"
        for k in K_VALUES:
            vals = [r["metrics"]["MAP"][k] for r in results if r["metrics"]]
            line += f" {mean(vals) if vals else 0.0:>9.4f}"
        for k in K_VALUES:
            vals = [r["metrics"]["NDCG"][k] for r in results if r["metrics"]]
            line += f" {mean(vals) if vals else 0.0:>10.4f}"
        print(line)


def print_per_playlist_comparison(all_results, playlist_names):
    print("\n" + "=" * 70)
    print("PER-PLAYLIST COMPARISON — MAP@10")
    print("=" * 70)
    name_w = max(len(n) for n in playlist_names) + 2
    header = f"{'Playlist':<{name_w}} {'n':>4}"
    for model_name in all_results:
        header += f" {model_name:>12}"
    print(header)
    print("-" * len(header))
    for i, pname in enumerate(playlist_names):
        any_metrics = next(
            (all_results[m][i]["metrics"] for m in all_results
             if all_results[m][i]["metrics"]),
            None,
        )
        if any_metrics is None:
            continue
        line = f"{pname:<{name_w}} {any_metrics['size']:>4}"
        for model_name in all_results:
            r = all_results[model_name][i]["metrics"]
            score = r["MAP"][10] if r else 0.0
            line += f" {score:>12.4f}"
        print(line)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    print(f"Loading catalog from {KENNETH_DIR}...")
    all_songs = load_catalog(KENNETH_DIR)
    print(f"  {len(all_songs)} songs")

    print(f"Loading playlists from {PLAYLISTS_PATH}...")
    playlists, unresolved = load_playlists(PLAYLISTS_PATH, all_songs)
    if unresolved:
        print(f"  WARNING: {len(unresolved)} unresolved entries (will be skipped)")
    print(f"  {len(playlists)} playlists, "
          f"{sum(len(p['songs']) for p in playlists)} song entries")

    # Convert playlists to (title, composer) key lists — the universal currency
    playlist_keys_list = [
        [song_key(s) for s in p["songs"]] for p in playlists
    ]
    playlist_names = [p["name"] for p in playlists]

    print(f"\nInstantiating recommenders...")
    kenneth_ppr = KennethPPR()
    cebb_ppr = CebbPPR()
    cebb_embed = CebbEmbedding()
    hybrid = HybridRRF([kenneth_ppr, cebb_embed])
    recommenders = [kenneth_ppr, cebb_ppr, cebb_embed, hybrid]
    for r in recommenders:
        print(f"  - {r.name}")

    print(f"\nRunning leave-some-out eval "
          f"(random 50/50 x{N_TRIALS_LARGE} for size>={SIZE_THRESHOLD}, "
          f"leave-one-out otherwise)...")

    all_results = {}
    for r in recommenders:
        all_results[r.name] = run_recommender(r, playlist_keys_list, playlist_names)

    name_w = max(len(n) for n in playlist_names) + 2
    for model_name, results in all_results.items():
        print(f"\n--- {model_name} per-playlist ---")
        print_per_playlist(results, name_w)

    print_leaderboard(all_results)
    print_per_playlist_comparison(all_results, playlist_names)


if __name__ == "__main__":
    main()
