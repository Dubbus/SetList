import { Link } from 'react-router-dom'
import { formatDate } from '../utils/time'
import useStore from '../store/useStore'

export default function ConcertCard({ concert }) {
  const allSegments = useStore(s => s.segments)
  const segments = allSegments.filter(sg => sg.concertId === concert.id)
  const users = useStore(s => s.users)
  const uploader = users.find(u => u.id === concert.uploadedBy)

  return (
    <Link to={`/concert/${concert.id}`} className="card block p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-semibold text-maroon-700 truncate leading-tight">
            {concert.title}
          </h3>
          <p className="text-gold-700 font-medium text-sm mt-0.5">{concert.artist}</p>
        </div>
        {concert.sourceUrl && (
          <span className="shrink-0 text-xs bg-ivory-200 text-stone-500 px-2 py-0.5 rounded">
            {concert.sourceUrl.includes('youtube') ? 'YouTube' :
             concert.sourceUrl.includes('soundcloud') ? 'SoundCloud' : 'Link'}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
        {concert.venue && <span>📍 {concert.venue}</span>}
        {concert.date && <span>🗓 {concert.date}</span>}
        {uploader && <span>by {uploader.username}</span>}
      </div>

      {concert.description && (
        <p className="mt-2 text-sm text-stone-600 line-clamp-2">{concert.description}</p>
      )}

      <div className="mt-3 pt-3 border-t border-ivory-200 flex items-center gap-2 text-xs text-stone-400">
        <span>{segments.length} segment{segments.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{formatDate(concert.createdAt)}</span>
      </div>
    </Link>
  )
}
