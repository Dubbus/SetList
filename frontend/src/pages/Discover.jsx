import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { loadRecommendations, modelLabel } from '../utils/recommendations'

function StatCard({ value, label, sub }) {
  return (
    <div className="card p-5 text-center">
      <div className="font-heading text-3xl font-semibold text-maroon-700">{value}</div>
      <div className="text-sm font-medium text-stone-600 mt-1">{label}</div>
      {sub && <div className="text-xs text-stone-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function MiniBar({ label, count, total, color }) {
  const pct = Math.min(100, Math.round((count / total) * 100))
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
        <span>{label}</span>
        <span>{count}/{total}</span>
      </div>
      <div className="h-1.5 bg-ivory-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PlaylistRow({ slug, entry, songsMap }) {
  const overlapCount = useMemo(() => {
    const kSet = new Set((entry.kenneth || []).slice(0, 10))
    return (entry.cebbEmbed || []).slice(0, 10).filter(k => kSet.has(k)).length
  }, [entry])

  const fallbackSet = new Set(entry.fallback || [])
  const chosenTop10 = (entry[entry.chosen] || []).slice(0, 10)
  const fallbackAgreement = chosenTop10.filter(k => fallbackSet.has(k)).length

  const chosenColor = {
    hybrid: 'bg-emerald-100 text-emerald-700',
    kenneth: 'bg-violet-100 text-violet-700',
    cebbEmbed: 'bg-teal-100 text-teal-700',
    fallback: 'bg-gold-100 text-gold-700',
  }[entry.chosen] || 'bg-stone-100 text-stone-700'

  const chosenLabel = {
    hybrid: 'Hybrid',
    kenneth: 'Graph',
    cebbEmbed: 'Audio',
    fallback: 'Fallback',
  }[entry.chosen] || entry.chosen

  const topRecs = chosenTop10
    .slice(0, 3)
    .map(k => ({ song: songsMap[k], inFallback: fallbackSet.has(k) }))
    .filter(r => r.song)

  const modelBarColor = overlapCount >= 3 ? 'bg-emerald-400' : overlapCount >= 1 ? 'bg-gold-400' : 'bg-stone-300'
  const fallbackBarColor = fallbackAgreement >= 4 ? 'bg-emerald-400' : fallbackAgreement >= 1 ? 'bg-gold-400' : 'bg-stone-300'

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
        <span className={`shrink-0 tag ${chosenColor}`}>
          {chosenLabel}
        </span>
      </div>

      {/* Agreement bars */}
      <div className="space-y-1.5 mb-3">
        <MiniBar label="Graph vs Audio" count={overlapCount} total={10} color={modelBarColor} />
        <MiniBar label="Model vs Fallback" count={fallbackAgreement} total={10} color={fallbackBarColor} />
      </div>

      {/* Top 3 recs preview */}
      {topRecs.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-stone-400">Top picks</div>
          {topRecs.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-stone-300 text-xs font-mono w-4 text-right">{i + 1}.</span>
              <span className="text-stone-700 truncate">{r.song.title}</span>
              {r.inFallback && (
                <span className="shrink-0 text-[9px] font-bold uppercase bg-gold-100 text-gold-600 px-1 py-0.5 rounded">
                  fallback
                </span>
              )}
              {r.song.ragam && <span className="text-xs text-gold-600 shrink-0">({r.song.ragam})</span>}
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
    const byChosen = {}
    let totalFbAgree = 0
    entries.forEach(e => {
      byChosen[e.chosen] = (byChosen[e.chosen] || 0) + 1
      const fbSet = new Set(e.fallback || [])
      totalFbAgree += (e[e.chosen] || []).slice(0, 10).filter(k => fbSet.has(k)).length
    })
    const totalSongs = Object.keys(data.songs || {}).length
    const avgFbAgree = entries.length ? (totalFbAgree / entries.length).toFixed(1) : 0
    return { total: entries.length, byChosen, totalSongs, avgFbAgree }
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
        How our recommendation engine works: two independent models (graph-based PageRank and audio embeddings)
        analyze each playlist, and a confidence-gated cascade picks the best output.
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        <StatCard value={stats.total} label="Playlists Analyzed" />
        <StatCard value={stats.totalSongs} label="Songs in Catalog" />
        <StatCard
          value={stats.byChosen.hybrid || 0}
          label="Hybrid Picks"
          sub="Models agreed"
        />
        <StatCard
          value={(stats.byChosen.kenneth || 0) + (stats.byChosen.cebbEmbed || 0)}
          label="Single-Model Picks"
          sub="One model more confident"
        />
        <StatCard
          value={stats.avgFbAgree}
          label="Avg Fallback Match"
          sub="Out of top 10 per playlist"
        />
      </div>

      {/* How it works */}
      <div className="card p-6 mb-10">
        <h2 className="font-heading text-lg font-semibold text-maroon-700 mb-4">How the Cascade Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-violet-50 rounded-xl p-4">
            <div className="text-violet-700 font-semibold text-sm mb-1">1. Graph Model (PPR)</div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Builds a tripartite graph of songs, playlists, and properties (ragam, composer, talam, mela).
              Personalized PageRank walks the graph to find songs connected to the query.
              Strong on property-homogeneous playlists.
            </p>
          </div>
          <div className="bg-teal-50 rounded-xl p-4">
            <div className="text-teal-700 font-semibold text-sm mb-1">2. Audio Model (Embedding)</div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Uses VGGish audio embeddings to find songs that sound similar.
              Recency-weighted cosine similarity with consensus bonus.
              Strong on canonical cycles and cross-property collections.
            </p>
          </div>
          <div className="bg-maroon-50 rounded-xl p-4">
            <div className="text-maroon-700 font-semibold text-sm mb-1">3. Cascade Decision</div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Compare the top-10 from each model. If they overlap, fuse with Reciprocal Rank Fusion.
              If they disagree, use the more confident model.
              Composer/ragam fallback guarantees a result is always shown.
            </p>
          </div>
        </div>
      </div>

      {/* Playlist grid */}
      <h2 className="font-heading text-xl font-semibold text-stone-700 mb-4">
        Per-Playlist Results
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(([slug, entry]) => (
          <PlaylistRow key={slug} slug={slug} entry={entry} songsMap={data.songs || {}} />
        ))}
      </div>
    </div>
  )
}
