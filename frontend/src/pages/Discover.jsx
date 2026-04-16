import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { loadRecommendations } from '../utils/recommendations'

function StatCard({ value, label, sub }) {
  return (
    <div className="card p-5 text-center">
      <div className="font-heading text-3xl font-semibold text-maroon-700">{value}</div>
      <div className="text-sm font-medium text-stone-600 mt-1">{label}</div>
      {sub && <div className="text-xs text-stone-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function PlaylistCard({ slug, entry, songsMap }) {
  const fallbackSet = new Set(entry.fallback || [])
  const chosenTop = (entry[entry.chosen] || []).slice(0, 10)
  const confirmed = chosenTop.filter(k => fallbackSet.has(k)).length
  const discovered = chosenTop.length - confirmed

  const modelLabel = {
    hybrid: 'Combined',
    kenneth: 'Graph',
    cebbEmbed: 'Audio',
    fallback: 'Baseline',
  }[entry.chosen] || entry.chosen

  const topRecs = chosenTop
    .slice(0, 3)
    .map(k => ({ song: songsMap[k], inFallback: fallbackSet.has(k) }))
    .filter(r => r.song)

  return (
    <Link
      to={`/concert/${slug}`}
      className="card block p-5 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-semibold text-maroon-700 group-hover:text-maroon-800 truncate leading-tight">
            {entry.name}
          </h3>
          {entry.intent && (
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{entry.intent}</p>
          )}
        </div>
        <span className="shrink-0 tag bg-emerald-100 text-emerald-700">
          {modelLabel}
        </span>
      </div>

      {/* Win summary */}
      <div className="flex gap-3 mb-3">
        {confirmed > 0 && (
          <div className="flex-1 bg-gold-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-gold-700">{confirmed}</div>
            <div className="text-[10px] uppercase tracking-wide text-gold-600">confirmed</div>
          </div>
        )}
        {discovered > 0 && (
          <div className="flex-1 bg-maroon-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-maroon-700">{discovered}</div>
            <div className="text-[10px] uppercase tracking-wide text-maroon-600">discovered</div>
          </div>
        )}
        <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-emerald-700">{(entry.fallback || []).length}</div>
          <div className="text-[10px] uppercase tracking-wide text-emerald-600">baseline</div>
        </div>
      </div>

      {/* Top picks */}
      {topRecs.length > 0 && (
        <div className="space-y-1">
          {topRecs.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-stone-300 text-xs font-mono w-4 text-right">{i + 1}.</span>
              <span className="text-stone-700 truncate">{r.song.title}</span>
              {r.inFallback && (
                <span className="shrink-0 text-[9px] font-bold uppercase px-1 py-0.5 rounded bg-gold-100 text-gold-600">
                  confirmed
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Link>
  )
}

export default function Discover() {
  const [data, setData] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    loadRecommendations().then(d => {
      if (alive) { setData(d); setLoaded(true) }
    })
    return () => { alive = false }
  }, [])

  const stats = useMemo(() => {
    if (!data?.concerts) return null
    const entries = Object.values(data.concerts)
    let totalConfirmed = 0
    let totalDiscovered = 0
    let totalBaseline = 0
    entries.forEach(e => {
      const fbSet = new Set(e.fallback || [])
      const top = (e[e.chosen] || []).slice(0, 10)
      const conf = top.filter(k => fbSet.has(k)).length
      totalConfirmed += conf
      totalDiscovered += top.length - conf
      totalBaseline += (e.fallback || []).length
    })
    const totalSongs = Object.keys(data.songs || {}).length
    return { total: entries.length, totalSongs, totalConfirmed, totalDiscovered, totalBaseline }
  }, [data])

  if (!loaded) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="text-stone-400">Loading recommendations...</div>
      </div>
    )
  }

  if (!data || !stats) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-stone-500">No recommendation data available.</p>
      </div>
    )
  }

  const entries = Object.entries(data.concerts)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <h1 className="page-title">Discover</h1>
      <p className="page-subtitle">
        Every playlist gets recommendations from three sources: a smart composer/ragam baseline that always delivers,
        plus graph and audio models that find connections humans might miss.
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        <StatCard value={stats.total} label="Playlists" sub="Analyzed" />
        <StatCard value={stats.totalSongs} label="Songs" sub="In catalog" />
        <StatCard value={stats.totalBaseline} label="Baseline Picks" sub="Always reliable" />
        <StatCard value={stats.totalConfirmed} label="Model Confirmed" sub="Matches baseline" />
        <StatCard value={stats.totalDiscovered} label="New Discoveries" sub="Beyond baseline" />
      </div>

      {/* How it works */}
      <div className="card p-6 mb-10">
        <h2 className="font-heading text-lg font-semibold text-maroon-700 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gold-50 rounded-xl p-4">
            <div className="text-gold-700 font-semibold text-sm mb-1">Smart Baseline</div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Matches songs by the same composer with ragam diversity.
              Simple, reliable, and always returns relevant results.
              This is your guaranteed floor — every playlist gets good picks.
            </p>
          </div>
          <div className="bg-violet-50 rounded-xl p-4">
            <div className="text-violet-700 font-semibold text-sm mb-1">Graph Model (PPR)</div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Walks a network of songs, playlists, ragams, composers, and talam
              using Personalized PageRank. Finds connections through shared musical DNA
              that simple matching can't see.
            </p>
          </div>
          <div className="bg-teal-50 rounded-xl p-4">
            <div className="text-teal-700 font-semibold text-sm mb-1">Audio Model</div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Compares VGGish audio embeddings to find songs that actually sound similar,
              regardless of metadata. Catches stylistic connections across different
              composers and ragams.
            </p>
          </div>
        </div>

        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
          <strong>The result:</strong> baseline picks are always solid. When the models confirm them, you know they're great.
          When the models find songs the baseline missed — that's a genuine discovery the engine surfaced for you.
        </div>
      </div>

      {/* Playlist grid */}
      <h2 className="font-heading text-xl font-semibold text-stone-700 mb-4">
        Per-Playlist Results
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(([slug, entry]) => (
          <PlaylistCard key={slug} slug={slug} entry={entry} songsMap={data.songs || {}} />
        ))}
      </div>
    </div>
  )
}
