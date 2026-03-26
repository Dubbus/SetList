import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import useStore from '../store/useStore'
import ConcertCard from '../components/ConcertCard'

export default function Browse() {
  const concerts = useStore(s => s.concerts)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const filtered = useMemo(() => {
    let list = [...concerts]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.artist.toLowerCase().includes(q) ||
        (c.venue || '').toLowerCase().includes(q)
      )
    }
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (sortBy === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    if (sortBy === 'artist') list.sort((a, b) => a.artist.localeCompare(b.artist))
    return list
  }, [concerts, search, sortBy])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="page-title">Browse Concerts</h1>
          <p className="page-subtitle">{concerts.length} concert{concerts.length !== 1 ? 's' : ''} in the archive</p>
        </div>
        <Link to="/upload" className="btn-primary self-start sm:self-auto shrink-0">
          + Add Concert
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by title, artist, venue..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="select-field sm:w-44"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="artist">By artist</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          {concerts.length === 0 ? (
            <>
              <div className="text-5xl mb-4">🎵</div>
              <p className="text-stone-500 mb-4">No concerts yet. Be the first to add one!</p>
              <Link to="/upload" className="btn-primary">Add Concert</Link>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-stone-500">No concerts match your search.</p>
              <button onClick={() => setSearch('')} className="btn-ghost mt-2">Clear search</button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => <ConcertCard key={c.id} concert={c} />)}
        </div>
      )}
    </div>
  )
}
