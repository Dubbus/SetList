"""
Build the two static JSON files the frontend demo needs:

  frontend/public/seed.json             — concerts + segments hydrated from the
                                          13 curated playlists, plus a demo user
  frontend/public/recommendations.json  — per-concert top-k from Kenneth-PPR,
                                          Cebb-Embed, Hybrid-RRF, and a
                                          composer/ragam fallback, with a
                                          cascade pick per concert

The frontend loads both on first app-mount. recommendations.json is keyed on
the same slug used as concert.id in seed.json, so joining is trivial.

Run: python3 eval/build_demo_data.py
"""

import json
import os
import re
from collections import Counter

from harness import KennethPPR, CebbEmbedding, song_key
from load_playlists import load_catalog, load_playlists

KENNETH_DIR = os.path.expanduser("~/Downloads/OneDrive_1_4-15-2026")
PLAYLISTS_PATH = os.path.join(os.path.dirname(__file__), "playlists.json")
OUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "public")
)
TOP_K = 20
FETCH_K = 50  # pull deeper lists from each base so RRF has signal


def slugify(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def key_str(k):
    return f"{k[0]}||{k[1]}"


def song_metadata(song):
    def g(attr):
        val = getattr(song, attr, None)
        return val if val else ""
    return {
        "title": song.title,
        "composer": song.composer,
        "ragam": g("ragam"),
        "talam": g("talam"),
        "mela": g("mela"),
        "artist": g("artist"),
        "audioUrl": g("audio_url"),
        "cat": g("cat"),
    }


def rrf_fuse(ranked_lists, k_out, rrf_k=60):
    scores = {}
    for ranked in ranked_lists:
        for rank, key in enumerate(ranked, start=1):
            scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
    ordered = sorted(scores.items(), key=lambda kv: -kv[1])
    return [key for key, _ in ordered[:k_out]]


def composer_fallback(playlist_songs, all_songs, k=TOP_K):
    """
    Composer-weighted fallback that prefers ragam diversity. Always returns
    a non-empty list as long as the catalog has any other songs by one of the
    playlist's composers (true for all 13 curated playlists).
    """
    playlist_keys = {song_key(s) for s in playlist_songs}
    composers = Counter(s.composer for s in playlist_songs if s.composer)
    top_composer = composers.most_common(1)[0][0] if composers else None
    pl_ragams = {getattr(s, "ragam", None) for s in playlist_songs}

    scored = []
    for s in all_songs:
        k2 = song_key(s)
        if k2 in playlist_keys:
            continue
        score = 0.0
        if s.composer and s.composer in composers:
            score += 3.0 if s.composer == top_composer else 1.0
        if score == 0.0:
            continue
        s_ragam = getattr(s, "ragam", None)
        if s_ragam and s_ragam not in pl_ragams:
            score += 0.5
        scored.append((score, s.title, s))  # title for stable tiebreak
    scored.sort(key=lambda x: (-x[0], x[1]))
    return [song_key(s) for _, _, s in scored[:k]]


def cascade_pick(kenneth_top, cebb_top, hybrid_recs, fallback):
    """
    Decide which ranking we actually show. Confidence signal: how many songs
    appear in both Kenneth's and Cebb-Embed's top-10. High overlap means graph
    and audio agree — we trust the fused list. No overlap means they disagree,
    so we fall back to the composer/ragam strip which is always defensible.
    """
    k_top = set(kenneth_top[:10])
    c_top = set(cebb_top[:10])
    overlap = len(k_top & c_top)
    if overlap >= 2 and hybrid_recs:
        return "hybrid", f"{overlap} songs agreed between graph and audio models"
    if overlap >= 1 and hybrid_recs:
        return "hybrid", "Graph and audio models found one song in common"
    if kenneth_top:
        return "kenneth", "Models disagreed; using graph-only ranking with composer fallback"
    return "fallback", "No model signal — using composer and ragam match"


def main():
    print(f"Loading catalog from {KENNETH_DIR}...")
    songs = load_catalog(KENNETH_DIR)
    print(f"  {len(songs)} songs")
    key_to_song = {song_key(s): s for s in songs}

    print(f"Loading playlists from {PLAYLISTS_PATH}...")
    playlists, unresolved = load_playlists(PLAYLISTS_PATH, songs)
    if unresolved:
        print(f"  WARNING: {len(unresolved)} unresolved entries skipped")
    print(f"  {len(playlists)} playlists")

    playlist_keys_list = [
        [song_key(s) for s in p["songs"]] for p in playlists
    ]

    print("Instantiating recommenders (this loads Kenneth + Cebb)...")
    kenneth = KennethPPR()
    cebb_embed = CebbEmbedding()

    concerts_out = {}
    referenced = set()

    for i, p in enumerate(playlists):
        pl_keys = playlist_keys_list[i]
        others = [pk for j, pk in enumerate(playlist_keys_list) if j != i]
        name = p["name"]
        print(f"  [{i+1}/{len(playlists)}] {name} ({len(pl_keys)} songs)")

        kenneth_recs = kenneth.recommend(pl_keys, others, FETCH_K)
        cebb_recs = cebb_embed.recommend(pl_keys, others, FETCH_K)
        hybrid_recs = rrf_fuse([kenneth_recs, cebb_recs], TOP_K) if (kenneth_recs or cebb_recs) else []
        fallback = composer_fallback(list(p["songs"]), songs, TOP_K)

        chosen, reason = cascade_pick(kenneth_recs, cebb_recs, hybrid_recs, fallback)
        print(f"      kenneth={len(kenneth_recs)} cebb={len(cebb_recs)} "
              f"hybrid={len(hybrid_recs)} fallback={len(fallback)} → {chosen}")

        slug = slugify(name)
        concerts_out[slug] = {
            "name": name,
            "intent": p.get("intent", ""),
            "kenneth": [key_str(k) for k in kenneth_recs[:TOP_K]],
            "cebbEmbed": [key_str(k) for k in cebb_recs[:TOP_K]],
            "hybrid": [key_str(k) for k in hybrid_recs],
            "fallback": [key_str(k) for k in fallback],
            "chosen": chosen,
            "reason": reason,
        }

        for k in kenneth_recs[:TOP_K] + cebb_recs[:TOP_K] + hybrid_recs + fallback + pl_keys:
            referenced.add(k)

    songs_out = {}
    for k in referenced:
        s = key_to_song.get(k)
        if s is None:
            continue
        songs_out[key_str(k)] = song_metadata(s)

    recommendations = {"songs": songs_out, "concerts": concerts_out}

    # --------------------------------------------------------------------- seed
    demo_user = {
        "id": "demo-user",
        "username": "demo",
        "email": "demo@setlist.local",
        "password": "demo",
        "favoriteArtists": [],
        "createdAt": "2026-04-15T00:00:00.000Z",
    }
    seed_concerts = []
    seed_segments = []
    now_iso = "2026-04-15T00:00:00.000Z"

    for i, p in enumerate(playlists):
        slug = slugify(p["name"])
        pl_songs = [key_to_song[k] for k in playlist_keys_list[i] if k in key_to_song]
        composers = Counter(s.composer for s in pl_songs if s.composer)
        main_composer = composers.most_common(1)[0][0] if composers else "Various"

        seed_concerts.append({
            "id": slug,
            "title": p["name"],
            "artist": main_composer,
            "sourceUrl": "",
            "date": "2026-04-15",
            "venue": "Curated Playlist",
            "description": p.get("intent", ""),
            "uploadedBy": demo_user["id"],
            "createdAt": now_iso,
            "recommendationKey": slug,
        })

        for j, s in enumerate(pl_songs):
            seed_segments.append({
                "id": f"{slug}-seg-{j}",
                "concertId": slug,
                "startTime": j * 300,
                "endTime": (j + 1) * 300,
                "segmentType": "song",
                "raga": getattr(s, "ragam", "") or "",
                "name": s.title,
                "createdBy": demo_user["id"],
                "createdAt": now_iso,
                "songKey": key_str(song_key(s)),
            })

    seed = {
        "defaultUser": demo_user,
        "concerts": seed_concerts,
        "segments": seed_segments,
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    recs_path = os.path.join(OUT_DIR, "recommendations.json")
    seed_path = os.path.join(OUT_DIR, "seed.json")
    with open(recs_path, "w", encoding="utf-8") as f:
        json.dump(recommendations, f, indent=2, ensure_ascii=False)
    with open(seed_path, "w", encoding="utf-8") as f:
        json.dump(seed, f, indent=2, ensure_ascii=False)

    print()
    print(f"Wrote {recs_path}")
    print(f"  {len(concerts_out)} concerts, {len(songs_out)} song entries")
    print(f"Wrote {seed_path}")
    print(f"  {len(seed_concerts)} concerts, {len(seed_segments)} segments")


if __name__ == "__main__":
    main()
