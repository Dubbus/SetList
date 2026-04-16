"""
Load curated playlists from playlists.json and resolve them against Kenneth's
songs_metadata.json catalog, producing frozenset[Song] objects compatible with
network.py.

Usage:
    from load_playlists import load_catalog, load_playlists
    songs = load_catalog(KENNETH_DIR)
    playlists, unresolved = load_playlists("playlists.json", songs)
"""

import json
import os
import sys
from difflib import get_close_matches


def load_catalog(kenneth_dir):
    """Load Kenneth's songs into Song objects by running his read_data()."""
    if kenneth_dir not in sys.path:
        sys.path.insert(0, kenneth_dir)
    cwd = os.getcwd()
    try:
        os.chdir(kenneth_dir)
        from network import read_data
        songs = read_data()
    finally:
        os.chdir(cwd)
    return songs


def _normalize(s):
    return (s or "").strip().lower()


def load_playlists(path, songs):
    """
    Parse playlists.json and map each entry to a frozenset[Song].

    Returns (playlists, unresolved) where:
      - playlists is a list of dicts: {"name", "intent", "songs": frozenset[Song]}
      - unresolved is a list of (playlist_name, {title, composer}, suggestion)
        for entries that didn't match the catalog.
    """
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    by_title = {}
    for song in songs:
        by_title.setdefault(_normalize(song.title), []).append(song)

    all_titles = list(by_title.keys())
    playlists = []
    unresolved = []

    for entry in raw:
        name = entry["name"]
        intent = entry.get("intent", "")
        resolved = []
        for song_ref in entry["songs"]:
            title_key = _normalize(song_ref["title"])
            candidates = by_title.get(title_key, [])

            if len(candidates) == 1:
                resolved.append(candidates[0])
            elif len(candidates) > 1:
                # Disambiguate by composer when multiple songs share a title.
                composer_key = _normalize(song_ref.get("composer", ""))
                match = next(
                    (c for c in candidates
                     if _normalize(c.composer).startswith(composer_key[:15])),
                    candidates[0],
                )
                resolved.append(match)
            else:
                close = get_close_matches(title_key, all_titles, n=1, cutoff=0.85)
                suggestion = close[0] if close else None
                unresolved.append((name, song_ref, suggestion))

        playlists.append({
            "name": name,
            "intent": intent,
            "songs": frozenset(resolved),
        })

    return playlists, unresolved


if __name__ == "__main__":
    # Quick smoke test
    KENNETH_DIR = os.path.expanduser("~/Downloads/OneDrive_1_4-15-2026")
    PLAYLISTS = os.path.join(os.path.dirname(__file__), "playlists.json")

    songs = load_catalog(KENNETH_DIR)
    print(f"catalog: {len(songs)} songs")

    playlists, unresolved = load_playlists(PLAYLISTS, songs)
    print(f"playlists: {len(playlists)}")
    for p in playlists:
        print(f"  {len(p['songs']):3d}  {p['name']}")

    if unresolved:
        print(f"\nunresolved entries: {len(unresolved)}")
        for plname, ref, suggestion in unresolved[:10]:
            s = f"    [{plname}] {ref['title']} / {ref.get('composer', '?')}"
            if suggestion:
                s += f"  (did you mean: {suggestion!r}?)"
            print(s)
    else:
        print("\nall entries resolved cleanly")
