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
