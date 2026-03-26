/** Convert "mm:ss" string to total seconds */
export function parseTime(str) {
  if (!str) return 0
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return Number(str) || 0
}

/** Convert total seconds to "m:ss" display string */
export function formatTime(secs) {
  const s = Math.floor(secs)
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m}:${ss.toString().padStart(2, '0')}`
}

/** Format ISO timestamp to readable date */
export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}
