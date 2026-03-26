const TYPE_STYLES = {
  alapana: 'bg-amber-100 text-amber-800',
  song:    'bg-rose-100 text-rose-800',
  RTP:     'bg-violet-100 text-violet-800',
  swaram:  'bg-teal-100 text-teal-800',
  thani:   'bg-orange-100 text-orange-800',
}

export default function SegmentTag({ type }) {
  const cls = TYPE_STYLES[type] || 'bg-stone-100 text-stone-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${cls}`}>
      {type}
    </span>
  )
}
