import { useEffect, useState, useMemo } from 'react'
import { loadRecommendations, modelLabel } from '../utils/recommendations'

const MODEL_TABS = [
  { key: 'hybrid', label: 'Combined (Hybrid)', color: 'maroon' },
  { key: 'kenneth', label: 'Graph Model', color: 'violet' },
  { key: 'cebbEmbed', label: 'Audio Model', color: 'teal' },
  { key: 'fallback', label: 'Composer Match', color: 'gold' },
]

function SongCard({ song, isOverlap }) {
  if (!song) return null
  return (
    <div className={`flex items-center gap-3 bg-white border rounded-xl p-3 transition-all ${
      isOverlap
        ? 'border-gold-400 ring-1 ring-gold-200 shadow-sm'
        : 'border-ivory-200 hover:border-gold-300 hover:shadow-sm'
    }`}>
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-800 truncate">{song.title}</span>
          {isOverlap && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded">
              both models agree
            </span>
          )}
        </div>
        <div className="text-xs text-stone-500 truncate">
          {song.composer}
          {song.ragam && <span className="text-gold-700"> · {song.ragam}</span>}
        </div>
      </div>
    </div>
  )
}

function ConfidenceMeter({ overlap, total }) {
  const pct = Math.min(100, Math.round((overlap / total) * 100))
  const level = overlap >= 3 ? 'High' : overlap >= 1 ? 'Moderate' : 'Low'
  const barColor = overlap >= 3 ? 'bg-emerald-500' : overlap >= 1 ? 'bg-gold-500' : 'bg-stone-300'
  const textColor = overlap >= 3 ? 'text-emerald-700' : overlap >= 1 ? 'text-gold-700' : 'text-stone-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-stone-600">Model Agreement</span>
          <span className={`text-xs font-semibold ${textColor}`}>
            {level} ({overlap}/{total} songs overlap)
          </span>
        </div>
        <div className="h-2 bg-ivory-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function CascadeExplainer({ entry }) {
  const steps = [
    { done: true, text: 'Ran graph-based PageRank model (song properties + playlist co-occurrence)' },
    { done: true, text: 'Ran audio embedding model (VGGish cosine similarity)' },
    { done: true, text: `Checked top-10 overlap between models` },
    {
      done: true,
      text: entry.chosen === 'hybrid'
        ? 'Models agreed — fusing with Reciprocal Rank Fusion'
        : entry.chosen === 'kenneth'
          ? 'Models disagreed — using graph ranking (stronger on property-based playlists)'
          : 'No model signal — falling back to composer/ragam matching'
    },
  ]

  return (
    <div className="bg-ivory-50 border border-ivory-200 rounded-xl p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">
        How we chose these recommendations
      </div>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i === steps.length - 1
                ? 'bg-maroon-500 text-white'
                : 'bg-ivory-300 text-stone-500'
            }`}>
              {i + 1}
            </span>
            <span className={`${i === steps.length - 1 ? 'text-maroon-700 font-medium' : 'text-stone-600'}`}>
              {step.text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function Recommendations({ concertId }) {
  const [data, setData] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState(null)

  useEffect(() => {
    let alive = true
    loadRecommendations().then(d => {
      if (alive) { setData(d); setLoaded(true) }
    })
    return () => { alive = false }
  }, [])

  const entry = data?.concerts?.[concertId]

  useEffect(() => {
    if (entry) setActiveTab(entry.chosen)
  }, [entry])

  const overlapSet = useMemo(() => {
    if (!entry) return new Set()
    const kSet = new Set((entry.kenneth || []).slice(0, 10))
    return new Set((entry.cebbEmbed || []).slice(0, 10).filter(k => kSet.has(k)))
  }, [entry])

  if (!loaded || !data || !entry) return null

  const songsMap = data.songs || {}
  const activeKeys = entry[activeTab] || []
  const activeSongs = activeKeys.map(k => ({ key: k, song: songsMap[k] })).filter(s => s.song)

  return (
    <div className="mt-12 animate-fade-in">
      <div className="mb-5">
        <h2 className="font-heading text-2xl font-semibold text-maroon-700 mb-1">
          Recommendation Engine
        </h2>
        <p className="text-sm text-stone-500">
          Two models analyzed this playlist independently. Here's what they found.
        </p>
      </div>

      <ConfidenceMeter overlap={overlapSet.size} total={10} />

      <div className="mt-5">
        <CascadeExplainer entry={entry} />
      </div>

      {/* Model tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {MODEL_TABS.map(tab => {
          const isActive = activeTab === tab.key
          const isChosen = entry.chosen === tab.key
          const count = (entry[tab.key] || []).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-maroon-500 text-white shadow-sm'
                  : 'bg-white border border-ivory-300 text-stone-600 hover:border-maroon-300 hover:text-maroon-600'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${isActive ? 'text-ivory-300' : 'text-stone-400'}`}>
                ({count})
              </span>
              {isChosen && (
                <span className={`absolute -top-2 -right-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-gold-400 text-maroon-900' : 'bg-gold-100 text-gold-700'
                }`}>
                  chosen
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active model results */}
      <div className="mt-4">
        {activeSongs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeSongs.slice(0, 10).map(({ key, song }, i) => (
              <SongCard
                key={`${key}-${i}`}
                song={song}
                isOverlap={overlapSet.has(key)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-ivory-50 rounded-xl border border-dashed border-ivory-300">
            <p className="text-stone-500 text-sm">This model returned no results for this playlist.</p>
            <p className="text-stone-400 text-xs mt-1">Try another tab to see what other models found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
