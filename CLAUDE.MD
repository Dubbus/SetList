# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

SetList is a platform for cataloging and sharing live Carnatic music performances. Users upload concerts, segment them into named sections (alapana, song, RTP, swaram, thani), rate segments, and eventually power a collaborative filtering recommendation system.

**Current state:** Frontend-only MVP with localStorage persistence. Backend scaffold (FastAPI) exists but is not yet wired up.

## Commands

### Frontend (primary)
```bash
cd frontend
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend (scaffold only)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload   # Dev server at http://localhost:8000
```

## Architecture

### Frontend (`frontend/src/`)

**State — `store/useStore.js`**
Single Zustand store persisted to `localStorage` under the key `setlist-storage`. All data (users, concerts, segments, ratings) lives here. Key patterns:
- `register` / `login` / `logout` — sets `currentUser`
- `addConcert` / `updateConcert` / `deleteConcert` — `deleteConcert` cascades to segments + ratings
- `addSegment` / `updateSegment` / `deleteSegment` — `deleteSegment` cascades to ratings
- `upsertRating` — creates or updates a user's rating for a segment
- `getSegmentsForConcert(id)` — sorted by startTime
- `getRecentActivity()` — joins ratings → segments → concerts for the current user

**Pages**
- `/` Home — hero banner + feature cards + recent concerts
- `/login`, `/register` — localStorage auth (passwords stored in plain text — dev only)
- `/browse` — searchable/sortable concert grid
- `/concert/:id` — concert detail + inline segmentation tool (`SegmentForm` + `SegmentRow`)
- `/upload` — concert creation form
- `/profile` — user stats, favorite artists (editable), recent ratings

**Components**
- `Navbar` — sticky, shows auth state + mobile nav
- `ConcertCard` — links to `/concert/:id`, shows segment count
- `StarRating` — interactive or readonly; calls `upsertRating` inline
- `SegmentTag` — color-coded pill per segment type
- `SegmentForm` — reused for add and edit; validates mm:ss format via `utils/time.js`

**Routing** — React Router v6 with a `<RequireAuth>` wrapper for `/upload` and `/profile`.

**Styling** — Tailwind CSS v3 with a custom theme (maroon, gold, ivory color scales). Reusable utility classes are defined in `index.css` under `@layer components` (`.card`, `.btn-primary`, `.input-field`, etc.).

### Backend (`backend/app/`)

Minimal FastAPI skeleton — just `/` and `/health` endpoints. Intended stack when built out: FastAPI + SQLAlchemy + PostgreSQL. `requirements.txt` lists the dependencies; `venv/` is gitignored.

## Data Schema (localStorage)

```
users      { id, username, email, password, favoriteArtists[], createdAt }
concerts   { id, title, artist, sourceUrl, date, venue, description, uploadedBy, createdAt }
segments   { id, concertId, startTime (seconds), endTime (seconds), segmentType, raga, name, createdBy, createdAt }
ratings    { id, userId, segmentId, rating (1-5), createdAt }
```

Segment types: `alapana | song | RTP | swaram | thani`

## Future Work (don't implement yet)
- Wire frontend to FastAPI + PostgreSQL
- Collaborative filtering recommendation engine using the user-segment rating graph
- Network visualization of user taste communities

## Recommendation Eval Subproject (`eval/`)

Parallel track to benchmark multiple recommendation models on the same curated Carnatic playlist data. Independent of the frontend/backend; lives in `eval/`.

### Layout

```
eval/
  playlists.json      # 13 curated playlists, 162 song entries; keyed on (title, composer)
  load_playlists.py   # Resolves playlists.json against Kenneth's songs_metadata.json catalog
  harness.py          # Plugin-based eval harness with 4 recommenders
```

External dependencies (not in this repo):
- `~/Downloads/OneDrive_1_4-15-2026/` — Kenneth's recommender (`network.py`, `data_types.py`, `songs_metadata.json`)
- `../music_recommendation/` — Cebb's recommender (`music_recommender.py`, `songs_metadata.json`, `song_embeddings.npz`), cloned from `https://github.com/crrr9/music_recommendation.git`

Both catalogs contain the same 389 songs; Cebb additionally ships 128-dim VGGish embeddings. `songs_metadata.json` is byte-identical between the two.

### Harness architecture (`eval/harness.py`)

- **Universal song key** = `(title, composer)` tuple. Kenneth's and Cebb's `Song` classes are incompatible, so the harness converts everything to tuple keys at the boundary.
- **Recommender plugin interface**: each class exposes `.name` and `.recommend(query_keys, training_playlists_keys, k) -> list[(title, composer)]`. Adding a new model is ~30 lines.
- **Holdout protocol**: for each playlist `p`, build the graph from the *other 12* playlists only, so the algorithm can't follow `p`'s own playlist-edge to the held-out song. Leave-one-out for size<8, three random 50/50 splits otherwise.
- **Metrics**: MAP@k and NDCG@k for k ∈ {10, 20, 50}, per-playlist and mean.

### Recommenders currently implemented

1. **KennethPPR** — wraps `network.build_graph` + `sol_extraction` + `biased_ppr`. Tripartite graph (songs / playlists / properties), 2-hop SoI, biased PPR with α=0.4. Property fields include `mela` (giving it raga-family connectivity Cebb's default lacks).
2. **CebbPPR** — wraps `music_recommender.build_graph_index` + `recommend_from_history_graph`. Same paper algorithm as Kenneth with cleaner typing (NodeType/EdgeType enums, scipy sparse column-stochastic W, explicit power iteration). Property fields default `[composer, ragam, talam, artist]` — no mela. Critically, we call `add_playlist()` per training playlist on a fresh `GraphIndex` for each eval call so the graph actually has CF signal (Cebb's demo never does this).
3. **CebbEmbedding** — wraps `recommend_from_history`. Pure content-based: recency-weighted aggregation (λ=0.7) of per-seed top-k cosine similarity, with a small consensus bonus. Ignores `training_playlists_keys`.
4. **HybridRRF** — Reciprocal Rank Fusion of KennethPPR + CebbEmbedding. `score(d) = Σ 1/(60 + rank_in_base(d))`. Parameter-free.

### Current leaderboard (13 playlists)

```
Model         MAP@10   MAP@20   NDCG@10   NDCG@20
Kenneth-PPR   0.106    0.122    0.163     0.213
Cebb-PPR      0.081    0.096    0.133     0.182
Cebb-Embed    0.079    0.085    0.114     0.139
Hybrid-RRF    0.103    0.130    0.192     0.246   ← best on NDCG and MAP@20+
```

### Key findings (drive the extension plan)

- **Graph and embedding are complementary, not competing.** Graph PPR nails property-homogeneous playlists (Tyagaraja-heavy-ragas 0.40, Thodi 0.53) but scores 0.00 on canonical cycles that span many properties (Thiruppavai, Pancharatna, Navavarnam). The embedding does the exact opposite — 0.30 on Thiruppavai, 0.50 on Pancharatna, 0.00 on ragam controls.
- **Unweighted RRF lifts the zeros but dilutes the strong graph wins.** Thiruppavai 1-15 goes 0.00→0.30; Tyagaraja heavy ragas goes 0.40→0.07. Net positive on NDCG, slight MAP@10 regression vs pure Kenneth.
- **Kenneth ≈ Cebb on the graph side.** The `mela` property is the main divergence source; otherwise their PPR implementations produce near-identical rankings.
- **With only 13 playlists the CF signal is weak.** The reason graph PPR scores 0 on canonical cycles isn't the algorithm — it's that no training playlist shares songs with the held-out one via a playlist edge, so PPR degenerates to property-only ranking.

### Extension plan — strongest possible model

Ordered by expected impact. Each step is independently shippable against the harness.

**Phase 1: better fusion (cheap wins, ~1 day)**
1. **Weighted RRF** — replace uniform `1/(60+rank)` with `w_graph / (60+r_g) + w_embed / (60+r_e)`. Sweep weights on the 13 playlists; validate on held-out playlists once the catalog grows.
2. **Query-type gating** — classify each query by property entropy (how diverse are the ragams/composers in the seed set?). High entropy → lean on embedding. Low entropy → lean on graph. Implement as a continuous blend coefficient derived from the query, not a hard switch.
3. **Reciprocal gating** — compute both rankings; take the model whose top-1 candidate has higher self-consistency (e.g., max agreement between its top-10 and the query's properties or embedding centroid).

**Phase 2: stronger single models (~3 days)**
4. **Embedding-weighted graph edges** — in the tripartite graph, replace uniform SONG–PROPERTY edge weights with audio-similarity-weighted edges. Songs that are both in ragam Thodi *and* sound similar share a stronger edge. Requires modifying `biased_ppr` to pass edge weights to `nx.pagerank`. Expected to unify Kenneth's and Cebb's strengths into a single model.
5. **Embedding nodes as a fourth node type** — add per-song audio-cluster nodes (K-means on VGGish embeddings, k≈20) as a new property type. The 2-hop SoI traversal automatically picks them up. Simpler than weighted edges, and composable with playlist nodes.
6. **Personalized PageRank over a bipartite user-segment graph** — once SetList has real rating data, replace curated playlists with user listening graphs. This is the paper's actual setting and where CF signal will finally dominate.

**Phase 3: data scale (~ongoing)**
7. **Grow the curated playlist corpus from 13 to 50+.** More overlap between playlists is the single biggest lever — canonical cycles score 0 because no *other* playlist shares their songs. Candidates: every well-known kutcheri setlist on Vaak, historical AIR programs, artist-specific concert sets. Target: each song appears in ≥3 playlists on average.
8. **Bring in a second audio embedding model.** VGGish was trained on YouTube audio events, not music; CLAP or MERT would give a content signal calibrated for music. Run it as a 5th recommender and fuse.
9. **Segment-level embeddings.** SetList's whole premise is that a concert isn't atomic — alapana and krithi should be embedded separately. Once the backend is wired up, extract VGGish/CLAP features per segment and rebuild the embedding index at segment granularity.

**Phase 4: learning-to-rank (when data exists)**
10. **LambdaMART over base model scores.** Features: Kenneth-PPR rank, Cebb-PPR rank, Cebb-Embed rank, property overlap counts, embedding cosine to query centroid. Labels: held-out-song relevance. Train on 80% of playlists, evaluate on 20%. Requires ≥ ~100 playlists for the gradient-boosted ranker to generalize.
11. **Two-tower neural retriever.** Song tower encodes `(audio embedding, property multi-hot)`; query tower encodes `(mean audio embedding, property histogram)`. Train with in-batch negatives on playlist co-occurrence pairs. Only worth trying once the playlist corpus is in the hundreds.

### Running the harness

```bash
cd eval
python3 harness.py   # ~30-60s; prints per-playlist and leaderboard tables
```

No tests yet; the per-playlist printouts are the regression signal. When changing a recommender, eyeball the mean row against the numbers in this file.
