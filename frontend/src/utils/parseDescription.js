/**
 * Parse a YouTube-style Carnatic concert description into segments.
 *
 * Expected format (one entry per line or run-on):
 *   HH:MM:SS (https://youtube.com/...&t=Xs) - Raga - Song Name - Tala - Composer
 *
 * Special cases detected automatically:
 *   - "Raga - Alapana"           → type: alapana
 *   - "Raga - Ragam/Thanam/Pallavi ..." → type: RTP
 *   - "Tani Avarthanam - ..."    → type: thani
 *   - "Raga - Swaram/Kalpanaswaram" → type: swaram
 *   - everything else            → type: song  (raga=first part, name=second part)
 */

function toSeconds(timestamp) {
  const parts = timestamp.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return parts[0] * 60 + parts[1]
}

function inferSegment(parts, startTime, endTime) {
  if (!parts.length) return { startTime, endTime, segmentType: 'song', raga: '', name: 'Unknown' }

  const first = parts[0].trim()
  const second = (parts[1] || '').trim()
  const secondLow = second.toLowerCase()

  // Tani Avarthanam
  if (first.toLowerCase().includes('tani avarthanam') || first.toLowerCase() === 'tani') {
    return { startTime, endTime, segmentType: 'thani', raga: '', name: parts.join(' - ') }
  }

  // Alapana: "Raga - Alapana"
  if (secondLow === 'alapana') {
    return { startTime, endTime, segmentType: 'alapana', raga: first, name: `${first} Alapana` }
  }

  // RTP: "Raga - Ragam / Thanam / Pallavi ..."
  if (['ragam', 'thanam', 'pallavi'].includes(secondLow)) {
    return { startTime, endTime, segmentType: 'RTP', raga: first, name: parts.slice(1).join(' - ') }
  }

  // Swaram
  if (secondLow === 'swaram' || secondLow === 'kalpanaswaram') {
    return { startTime, endTime, segmentType: 'swaram', raga: first, name: parts.slice(1).join(' - ') }
  }

  // Default: song — raga = first part, name = second part (ignore tala/composer here)
  return {
    startTime,
    endTime,
    segmentType: 'song',
    raga: first,
    name: second || first,
  }
}

export function parseYouTubeDescription(text) {
  // Find every HH:MM:SS or H:MM:SS occurrence and its position
  const tsRegex = /(\d{1,2}:\d{2}:\d{2})/g
  const hits = []
  let m
  while ((m = tsRegex.exec(text)) !== null) {
    hits.push({ index: m.index, ts: m[1], seconds: toSeconds(m[1]) })
  }
  if (!hits.length) return []

  return hits.map((hit, i) => {
    const nextHit = hits[i + 1]
    const endTime = nextHit ? nextHit.seconds : hit.seconds + 300

    // Grab the text chunk between this timestamp and the next
    const chunkStart = hit.index + hit.ts.length
    const chunkEnd = nextHit ? nextHit.index : text.length
    const chunk = text.slice(chunkStart, chunkEnd)

    // Strip URL in parens: (https://...)
    const withoutUrl = chunk.replace(/\([^)]*\)/g, '').trim()

    // Strip leading dash
    const cleaned = withoutUrl.replace(/^[\s-]+/, '').trim()

    // Split on " - " separators
    const parts = cleaned.split(/\s+-\s+/).map(p => p.trim()).filter(Boolean)

    return inferSegment(parts, hit.seconds, endTime)
  })
}
