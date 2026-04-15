let cache = null

export function loadRecommendations() {
  if (!cache) {
    cache = fetch('/recommendations.json')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
  }
  return cache
}

const MODEL_LABELS = {
  hybrid: 'Hybrid (graph + audio)',
  kenneth: 'Graph model',
  cebbEmbed: 'Audio embedding',
  fallback: 'Composer match',
}

export function modelLabel(key) {
  return MODEL_LABELS[key] ?? key
}
