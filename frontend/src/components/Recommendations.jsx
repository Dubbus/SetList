import { useEffect, useState } from 'react'
import { loadRecommendations, modelLabel } from '../utils/recommendations'

function SongCard({ song }) {
  if (!song) return null
  return (
    <div className="flex items-center gap-3 bg-white border border-ivory-200 rounded-xl p-3 hover:border-gold-300 hover:shadow-sm transition-all">
      {song.audioUrl ? (
        <a
          href={song.audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 w-9 h-9 rounded-full bg-maroon-50 hover:bg-maroon-100 text-maroon-700 flex items-center justify-center text-sm font-semibold transition-colors"
          title="Open audio"
        >
          ▶
        </a>
      ) : (
        <div className="shrink-0 w-9 h-9 rounded-full bg-ivory-100 text-stone-300 flex items-center justify-center text-sm">
          ♪
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-stone-800 truncate">{song.title}</div>
        <div className="text-xs text-stone-500 truncate">
          {song.composer}
          {song.ragam && <span className="text-gold-700"> · {song.ragam}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Recommendations({ concertId }) {
  const [data, setData] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    loadRecommendations().then(d => {
      if (alive) {
        setData(d)
        setLoaded(true)
      }
    })
    return () => { alive = false }
  }, [])

  if (!loaded) return null
  if (!data) return null

  const entry = data.concerts?.[concertId]
  if (!entry) return null

  const songsMap = data.songs || {}
  const primaryKeys = entry[entry.chosen] || []
  const fallbackKeys = entry.fallback || []
  const primarySongs = primaryKeys.map(k => songsMap[k]).filter(Boolean).slice(0, 8)
  // Exclude songs already shown in primary from the fallback strip
  const primarySet = new Set(primarySongs.map(s => `${s.title}||${s.composer}`))
  const fallbackSongs = fallbackKeys
    .map(k => songsMap[k])
    .filter(s => s && !primarySet.has(`${s.title}||${s.composer}`))
    .slice(0, 5)

  if (primarySongs.length === 0 && fallbackSongs.length === 0) return null

  return (
    <div className="mt-12 animate-fade-in">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-heading text-xl font-semibold text-stone-700">
          Recommended Next
        </h2>
        <span className="text-xs text-stone-400">
          via {modelLabel(entry.chosen)}
        </span>
      </div>
      <p className="text-sm text-stone-500 mb-4">{entry.reason}</p>

      {primarySongs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {primarySongs.map((s, i) => (
            <SongCard key={`${s.title}-${s.composer}-${i}`} song={s} />
          ))}
        </div>
      )}

      {fallbackSongs.length > 0 && (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wide text-stone-400 mb-2">
            More like this — safe picks
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fallbackSongs.map((s, i) => (
              <SongCard key={`fb-${s.title}-${s.composer}-${i}`} song={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
