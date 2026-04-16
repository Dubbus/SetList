import { useEffect, useState, useMemo } from 'react'
import { loadRecommendations } from '../utils/recommendations'

function SongCard({ song, badge }) {
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-stone-800 truncate">{song.title}</span>
          {badge && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
              {badge}
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

export default function Recommendations({ concertId }) {
  const [data, setData] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    loadRecommendations().then(d => {
      if (alive) { setData(d); setLoaded(true) }
    })
    return () => { alive = false }
  }, [])

  const entry = data?.concerts?.[concertId]

  const { fallbackSet, chosenKeys, modelSongs, fallbackSongs, fallbackAgreement } = useMemo(() => {
    if (!entry || !data) return { fallbackSet: new Set(), chosenKeys: new Set(), modelSongs: [], fallbackSongs: [], fallbackAgreement: 0 }
    const sm = data.songs || {}
    const fbSet = new Set(entry.fallback || [])
    const cKeys = new Set((entry[entry.chosen] || []).slice(0, 10))
    const fbAgree = [...cKeys].filter(k => fbSet.has(k)).length
    const mSongs = [...cKeys].map(k => ({ key: k, song: sm[k] })).filter(s => s.song)
    const fbSongs = (entry.fallback || []).map(k => ({ key: k, song: sm[k] })).filter(s => s.song).slice(0, 8)
    return { fallbackSet: fbSet, chosenKeys: cKeys, modelSongs: mSongs, fallbackSongs: fbSongs, fallbackAgreement: fbAgree }
  }, [entry, data])

  if (!loaded || !data || !entry) return null

  const modelName = entry.chosen === 'hybrid' ? 'Combined Model' : entry.chosen === 'kenneth' ? 'Graph Model' : 'Audio Model'

  return (
    <div className="mt-12 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold text-maroon-700 mb-2">
          Recommended For You
        </h2>
        <p className="text-sm text-stone-500">
          Our engine analyzed this playlist with two independent models and a smart composer-based baseline.
        </p>
      </div>

      {/* Smart Baseline — always first, always a win */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 text-sm font-bold">
            ✓
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-stone-800">Smart Baseline</h3>
            <p className="text-xs text-stone-500">
              Matched by composer and ragam — always delivers relevant results
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {fallbackSongs.map(({ key, song }, i) => (
            <SongCard
              key={`fb-${key}-${i}`}
              song={song}
              badge={chosenKeys.has(key) ? 'model confirmed' : null}
            />
          ))}
        </div>
        {fallbackSongs.length === 0 && (
          <p className="text-sm text-stone-400 italic">Composers in this playlist are unique to this collection.</p>
        )}
      </div>

      {/* Model recommendations */}
      {modelSongs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700 text-sm font-bold">
              ★
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-stone-800">{modelName} Picks</h3>
              <p className="text-xs text-stone-500">
                {entry.chosen === 'hybrid'
                  ? 'Graph and audio models agreed — fused for the strongest ranking'
                  : entry.chosen === 'kenneth'
                    ? 'Graph model found strong connections through ragam, composer, and playlist patterns'
                    : 'Audio model detected similarity in musical features and timbre'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {modelSongs.map(({ key, song }, i) => (
              <SongCard
                key={`m-${key}-${i}`}
                song={song}
                badge={fallbackSet.has(key) ? 'baseline agrees' : null}
              />
            ))}
          </div>

          {/* Summary callout */}
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-emerald-600 text-lg mt-0.5">✓</span>
            <div className="text-sm text-emerald-800">
              {fallbackAgreement > 0 ? (
                <>
                  <strong>{fallbackAgreement} of {modelSongs.length}</strong> model picks are confirmed by the smart baseline
                  {modelSongs.length - fallbackAgreement > 0 && (
                    <>, and <strong>{modelSongs.length - fallbackAgreement}</strong> are new discoveries the baseline couldn't find</>
                  )}
                  .
                </>
              ) : (
                <>
                  The model surfaced <strong>{modelSongs.length} new discoveries</strong> beyond what composer/ragam matching alone would find — that's the value of graph and audio analysis.
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
