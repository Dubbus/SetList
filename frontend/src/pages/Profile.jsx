import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import useStore from '../store/useStore'
import StarRating from '../components/StarRating'
import SegmentTag from '../components/SegmentTag'
import { formatDate, formatTime } from '../utils/time'

export default function Profile() {
  const currentUser = useStore(s => s.currentUser)
  const updateProfile = useStore(s => s.updateProfile)
  const concerts = useStore(s => s.concerts)
  const allRatings = useStore(s => s.ratings)
  const allSegments = useStore(s => s.segments)
  const recentActivity = useMemo(() => {
    if (!currentUser) return []
    return allRatings
      .filter(r => r.userId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(r => {
        const segment = allSegments.find(sg => sg.id === r.segmentId)
        const concert = concerts.find(c => c.id === segment?.concertId)
        return { rating: r, segment, concert }
      })
      .filter(x => x.segment && x.concert)
  }, [allRatings, allSegments, concerts, currentUser])

  const [editingArtists, setEditingArtists] = useState(false)
  const [artistInput, setArtistInput] = useState('')

  if (!currentUser) return null

  const myConcerts = concerts.filter(c => c.uploadedBy === currentUser.id)

  const addArtist = () => {
    const a = artistInput.trim()
    if (!a) return
    if (!currentUser.favoriteArtists.includes(a)) {
      updateProfile({ favoriteArtists: [...currentUser.favoriteArtists, a] })
    }
    setArtistInput('')
  }

  const removeArtist = (artist) => {
    updateProfile({ favoriteArtists: currentUser.favoriteArtists.filter(a => a !== artist) })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="card p-6 mb-7 flex flex-col sm:flex-row items-start gap-5">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-maroon-500 to-gold-500 flex items-center justify-center text-2xl font-heading text-white shrink-0">
          {currentUser.username[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-semibold text-maroon-700">{currentUser.username}</h1>
          <p className="text-stone-500 text-sm mt-0.5">{currentUser.email}</p>
          <p className="text-stone-400 text-xs mt-1">Member since {formatDate(currentUser.createdAt)}</p>

          <div className="flex gap-6 mt-3 text-sm">
            <div className="text-center">
              <div className="font-semibold text-maroon-700 text-lg">{myConcerts.length}</div>
              <div className="text-stone-400 text-xs">Concerts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-maroon-700 text-lg">{recentActivity.length}</div>
              <div className="text-stone-400 text-xs">Ratings</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Left column */}
        <div className="space-y-6">
          {/* Favorite Artists */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-base font-semibold text-maroon-700">Favorite Artists</h2>
              <button
                onClick={() => setEditingArtists(v => !v)}
                className="text-xs text-stone-400 hover:text-gold-600 transition-colors"
              >
                {editingArtists ? 'Done' : 'Edit'}
              </button>
            </div>

            {currentUser.favoriteArtists.length === 0 && !editingArtists && (
              <p className="text-stone-400 text-sm">No favorites yet.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {currentUser.favoriteArtists.map(a => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 bg-maroon-50 text-maroon-700 text-sm px-2.5 py-1 rounded-full"
                >
                  {a}
                  {editingArtists && (
                    <button onClick={() => removeArtist(a)} className="text-maroon-400 hover:text-maroon-700 ml-0.5">×</button>
                  )}
                </span>
              ))}
            </div>

            {editingArtists && (
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={artistInput}
                  onChange={e => setArtistInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArtist())}
                  placeholder="Add artist name"
                  className="input-field text-sm flex-1"
                />
                <button onClick={addArtist} className="btn-primary text-sm px-3 py-2">Add</button>
              </div>
            )}
          </div>

          {/* My Concerts */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-base font-semibold text-maroon-700">My Concerts</h2>
              <Link to="/upload" className="text-xs text-gold-600 hover:text-gold-700 font-medium">+ New</Link>
            </div>
            {myConcerts.length === 0 ? (
              <p className="text-stone-400 text-sm">No concerts uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {myConcerts.slice(0, 5).map(c => (
                  <Link key={c.id} to={`/concert/${c.id}`} className="block group">
                    <p className="text-sm font-medium text-stone-700 group-hover:text-maroon-600 truncate transition-colors">{c.title}</p>
                    <p className="text-xs text-stone-400">{c.artist}</p>
                  </Link>
                ))}
                {myConcerts.length > 5 && (
                  <Link to="/browse" className="text-xs text-gold-600 hover:text-gold-700">View all {myConcerts.length} →</Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column — recent activity */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="font-heading text-base font-semibold text-maroon-700 mb-4">Recent Ratings</h2>

            {recentActivity.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">⭐</div>
                <p className="text-stone-400 text-sm">You haven't rated any segments yet.</p>
                <Link to="/browse" className="btn-primary text-sm mt-3 inline-block">Browse Concerts</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map(({ rating, segment, concert }) => (
                  <Link
                    key={rating.id}
                    to={`/concert/${concert.id}`}
                    className="flex items-start gap-3 group hover:bg-ivory-50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="shrink-0 bg-ivory-100 rounded-lg px-2.5 py-1.5 text-center min-w-[56px]">
                      <div className="text-xs font-mono text-stone-500">{formatTime(segment.startTime)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 group-hover:text-maroon-600 transition-colors truncate">
                        {segment.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <SegmentTag type={segment.segmentType} />
                        <span className="text-xs text-gold-700">{segment.raga}</span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5 truncate">{concert.title}</p>
                    </div>
                    <StarRating value={rating.rating} readonly size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
