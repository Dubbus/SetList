import { useState } from 'react'
import { parseYouTubeDescription } from '../utils/parseDescription'
import SegmentTag from './SegmentTag'
import { formatTime } from '../utils/time'

export default function DescriptionImporter({ concertId, onImport }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [done, setDone] = useState(false)

  const handleParse = () => {
    const results = parseYouTubeDescription(text)
    setParsed(results)
    setSelected(new Set(results.map((_, i) => i)))
    setDone(false)
  }

  const toggleAll = (checked) => {
    setSelected(checked ? new Set(parsed.map((_, i) => i)) : new Set())
  }

  const toggleOne = (i) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleImport = () => {
    const toImport = parsed.filter((_, i) => selected.has(i))
    toImport.forEach(seg => onImport({ concertId, ...seg }))
    setDone(true)
    setParsed(null)
    setText('')
    setSelected(new Set())
    setTimeout(() => setOpen(false), 1200)
  }

  const handleClose = () => {
    setOpen(false)
    setParsed(null)
    setText('')
    setSelected(new Set())
    setDone(false)
  }

  return (
    <div className="mb-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gold-300 rounded-xl text-gold-700 hover:border-gold-500 hover:bg-gold-50 transition-all duration-200 text-sm font-medium"
        >
          <span className="text-lg">⬇</span>
          Import from YouTube description
        </button>
      ) : (
        <div className="border border-ivory-300 rounded-xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between bg-ivory-100 px-4 py-3 border-b border-ivory-300">
            <span className="font-medium text-stone-700 text-sm">Import from YouTube description</span>
            <button onClick={handleClose} className="text-stone-400 hover:text-stone-600 text-lg leading-none">×</button>
          </div>

          <div className="p-4 space-y-4 bg-white">
            {/* Instructions */}
            <p className="text-xs text-stone-400 leading-relaxed">
              Paste the concert description from YouTube — the timestamp-based segment list.
              The parser will detect ragas, segment types, and timings automatically.
            </p>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setParsed(null) }}
              placeholder={"00:00:00 (https://youtube.com/...) - Arabhi - Sadinchane O Manasa - Adi - Tyagaraja\n00:07:23 (https://youtube.com/...&t=443s) - Mayamalavagowla - Deva Deva Kalayamide..."}
              rows={6}
              className="input-field resize-none font-mono text-xs"
            />

            {!parsed && (
              <button
                onClick={handleParse}
                disabled={!text.trim()}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Parse Description
              </button>
            )}

            {/* Parsed preview */}
            {parsed && parsed.length === 0 && (
              <div className="text-center py-6 text-stone-400 text-sm">
                No timestamped segments found. Make sure the description uses HH:MM:SS format.
              </div>
            )}

            {parsed && parsed.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">
                    {parsed.length} segments found
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.size === parsed.length}
                      onChange={e => toggleAll(e.target.checked)}
                      className="rounded"
                    />
                    Select all
                  </label>
                </div>

                {/* Segment list */}
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                  {parsed.map((seg, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                        selected.has(i) ? 'bg-ivory-100' : 'bg-white hover:bg-ivory-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleOne(i)}
                        className="rounded shrink-0"
                      />
                      <span className="text-xs font-mono text-stone-400 w-10 shrink-0">
                        {formatTime(seg.startTime)}
                      </span>
                      <SegmentTag type={seg.segmentType} />
                      <span className="text-xs font-medium text-stone-700 truncate">{seg.name}</span>
                      {seg.raga && (
                        <span className="text-xs text-gold-700 shrink-0 ml-auto">{seg.raga}</span>
                      )}
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleImport}
                    disabled={selected.size === 0}
                    className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import {selected.size} segment{selected.size !== 1 ? 's' : ''}
                  </button>
                  <button
                    onClick={() => { setParsed(null); setText('') }}
                    className="btn-ghost text-sm"
                  >
                    Re-paste
                  </button>
                </div>
              </div>
            )}

            {done && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm">
                <span>✓</span> Segments imported successfully!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
