import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useStore from '../store/useStore'
import StarRating from '../components/StarRating'
import SegmentTag from '../components/SegmentTag'
import DescriptionImporter from '../components/DescriptionImporter'
import Recommendations from '../components/Recommendations'
import { parseTime, formatTime, formatDate } from '../utils/time'

const SEGMENT_TYPES = ['alapana', 'song', 'RTP', 'swaram', 'thani']

const emptySegment = () => ({
  startTime: '',
  endTime: '',
  segmentType: 'song',
  raga: '',
  name: '',
})

function SegmentForm({ concertId, onSave, initial = null, onCancel }) {
  const [form, setForm] = useState(initial ?? emptySegment())
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.startTime.trim()) e.startTime = 'Required'
    if (!form.endTime.trim()) e.endTime = 'Required'
    if (!form.raga.trim()) e.raga = 'Required'
    if (!form.name.trim()) e.name = 'Required'
    const s = parseTime(form.startTime)
    const en = parseTime(form.endTime)
    if (s >= en) e.endTime = 'End must be after start'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    onSave({
      concertId,
      startTime: parseTime(form.startTime),
      endTime: parseTime(form.endTime),
      segmentType: form.segmentType,
      raga: form.raga,
      name: form.name,
    })
    setForm(emptySegment())
    setErrors({})
  }

  const f = (key) => ({
    value: form[key],
    onChange: (ev) => {
      setForm(x => ({ ...x, [key]: ev.target.value }))
      setErrors(x => ({ ...x, [key]: undefined }))
    },
  })

  return (
    <form onSubmit={handleSubmit} className="bg-ivory-50 border border-ivory-300 rounded-xl p-5 space-y-4 animate-slide-up">
      <div className="grid grid-cols-2 gap-3">
        {/* Start time */}
        <div>
          <label className="label">Start (m:ss)</label>
          <input type="text" placeholder="0:00" className={`input-field ${errors.startTime ? 'border-rose-400' : ''}`} {...f('startTime')} />
          {errors.startTime && <p className="text-rose-500 text-xs mt-0.5">{errors.startTime}</p>}
        </div>
        {/* End time */}
        <div>
          <label className="label">End (m:ss)</label>
          <input type="text" placeholder="5:30" className={`input-field ${errors.endTime ? 'border-rose-400' : ''}`} {...f('endTime')} />
          {errors.endTime && <p className="text-rose-500 text-xs mt-0.5">{errors.endTime}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Type */}
        <div>
          <label className="label">Type</label>
          <select className="select-field" {...f('segmentType')}>
            {SEGMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {/* Raga */}
        <div>
          <label className="label">Raga *</label>
          <input type="text" placeholder="e.g. Bhairavi" className={`input-field ${errors.raga ? 'border-rose-400' : ''}`} {...f('raga')} />
          {errors.raga && <p className="text-rose-500 text-xs mt-0.5">{errors.raga}</p>}
        </div>
        {/* Name */}
        <div>
          <label className="label">Name *</label>
          <input type="text" placeholder="e.g. Kaliyugavaradan" className={`input-field ${errors.name ? 'border-rose-400' : ''}`} {...f('name')} />
          {errors.name && <p className="text-rose-500 text-xs mt-0.5">{errors.name}</p>}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary text-sm px-4 py-2">
          {initial ? 'Update Segment' : 'Add Segment'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost text-sm px-3 py-2">Cancel</button>
        )}
      </div>
    </form>
  )
}

function SegmentRow({ segment, concertId }) {
  const currentUser = useStore(s => s.currentUser)
  const updateSegment = useStore(s => s.updateSegment)
  const deleteSegment = useStore(s => s.deleteSegment)
  const upsertRating = useStore(s => s.upsertRating)
  const myRating = useStore(s => s.getRatingForSegment(segment.id))
  const avgRating = useStore(s => s.getAvgRating(segment.id))
  const [editing, setEditing] = useState(false)

  const handleSave = (data) => {
    updateSegment(segment.id, data)
    setEditing(false)
  }

  const isOwner = currentUser?.id === segment.createdBy

  if (editing) {
    return (
      <SegmentForm
        concertId={concertId}
        initial={{
          startTime: formatTime(segment.startTime),
          endTime: formatTime(segment.endTime),
          segmentType: segment.segmentType,
          raga: segment.raga,
          name: segment.name,
        }}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="bg-white border border-ivory-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in">
      {/* Time badge */}
      <div className="shrink-0 text-center bg-ivory-100 rounded-lg px-3 py-2 min-w-[72px]">
        <div className="text-xs text-stone-400 font-medium">start</div>
        <div className="text-sm font-mono font-semibold text-maroon-700">{formatTime(segment.startTime)}</div>
        <div className="text-xs text-stone-400 font-medium">end</div>
        <div className="text-sm font-mono font-semibold text-stone-600">{formatTime(segment.endTime)}</div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <SegmentTag type={segment.segmentType} />
          <span className="font-medium text-stone-800 truncate">{segment.name}</span>
        </div>
        <p className="text-sm text-gold-700 font-medium">{segment.raga}</p>
      </div>

      {/* Rating */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <StarRating value={myRating} onChange={r => upsertRating(segment.id, r)} size="sm" />
        {avgRating > 0 && (
          <span className="text-xs text-stone-400">avg {avgRating.toFixed(1)} ★</span>
        )}
      </div>

      {/* Actions (owner only) */}
      {isOwner && (
        <div className="shrink-0 flex gap-1">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-stone-400 hover:text-gold-600 px-2 py-1 rounded hover:bg-ivory-100 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => { if (confirm('Delete this segment?')) deleteSegment(segment.id) }}
            className="text-xs text-stone-400 hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function Concert() {
  const { id } = useParams()
  const navigate = useNavigate()
  const concert = useStore(s => s.concerts.find(c => c.id === id))
  const allSegments = useStore(s => s.segments)
  const segments = useMemo(
    () => allSegments.filter(sg => sg.concertId === id).sort((a, b) => a.startTime - b.startTime),
    [allSegments, id]
  )
  const addSegment = useStore(s => s.addSegment)
  const updateConcert = useStore(s => s.updateConcert)
  const deleteConcert = useStore(s => s.deleteConcert)
  const currentUser = useStore(s => s.currentUser)
  const users = useStore(s => s.users)
  const [showForm, setShowForm] = useState(false)
  const [editingConcert, setEditingConcert] = useState(false)
  const [editForm, setEditForm] = useState({})

  if (!concert) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-stone-500 mb-4">Concert not found.</p>
        <Link to="/browse" className="btn-primary">Back to Browse</Link>
      </div>
    )
  }

  const uploader = users.find(u => u.id === concert.uploadedBy)
  const isOwner = currentUser?.id === concert.uploadedBy

  const handleAddSegment = (data) => {
    addSegment(data)
    setShowForm(false)
  }

  const handleEditOpen = () => {
    setEditForm({
      title: concert.title,
      artist: concert.artist,
      sourceUrl: concert.sourceUrl || '',
      date: concert.date || '',
      venue: concert.venue || '',
      description: concert.description || '',
    })
    setEditingConcert(true)
  }

  const handleEditSave = (e) => {
    e.preventDefault()
    updateConcert(id, editForm)
    setEditingConcert(false)
  }

  const handleDelete = () => {
    if (confirm('Delete this concert and all its segments?')) {
      deleteConcert(id)
      navigate('/browse')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-5">
        <Link to="/browse" className="hover:text-maroon-600 transition-colors">Browse</Link>
        <span>/</span>
        <span className="text-stone-600 truncate">{concert.title}</span>
      </div>

      {/* Concert header */}
      <div className="card p-6 mb-8">
        {editingConcert ? (
          <form onSubmit={handleEditSave} className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Title *</label>
                <input required className="input-field" value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Artist *</label>
                <input required className="input-field" value={editForm.artist}
                  onChange={e => setEditForm(f => ({ ...f, artist: e.target.value }))} />
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input-field" value={editForm.date}
                  onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Venue</label>
                <input className="input-field" value={editForm.venue}
                  onChange={e => setEditForm(f => ({ ...f, venue: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Source URL</label>
              <input type="url" className="input-field" value={editForm.sourceUrl}
                onChange={e => setEditForm(f => ({ ...f, sourceUrl: e.target.value }))} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea rows={3} className="input-field resize-none" value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary text-sm">Save Changes</button>
              <button type="button" onClick={() => setEditingConcert(false)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-heading text-3xl font-semibold text-maroon-700 leading-tight">{concert.title}</h1>
              <p className="text-gold-700 font-medium text-lg mt-1">{concert.artist}</p>

              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-stone-500">
                {concert.venue && <span>📍 {concert.venue}</span>}
                {concert.date && <span>🗓 {concert.date}</span>}
                {uploader && <span>Added by {uploader.username}</span>}
              </div>

              {concert.description && (
                <p className="mt-3 text-stone-600 leading-relaxed">{concert.description}</p>
              )}

              {concert.sourceUrl && (
                <a
                  href={concert.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-maroon-600 hover:text-maroon-700 font-medium"
                >
                  ▶ Open recording ↗
                </a>
              )}
            </div>

            {isOwner && (
              <div className="flex gap-2 shrink-0">
                <button onClick={handleEditOpen} className="btn-ghost text-sm px-3 py-1.5">Edit</button>
                <button onClick={handleDelete} className="text-sm text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Segments section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-stone-700">
          Segments
          <span className="ml-2 text-sm font-normal text-stone-400">({segments.length})</span>
        </h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-primary text-sm px-4 py-2"
        >
          {showForm ? '− Cancel' : '+ Add Segment'}
        </button>
      </div>

      {/* Import from description */}
      <DescriptionImporter concertId={id} onImport={addSegment} />

      {/* Add segment form */}
      {showForm && (
        <div className="mb-4">
          <SegmentForm concertId={id} onSave={handleAddSegment} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Segments list */}
      {segments.length === 0 ? (
        <div className="text-center py-14 bg-ivory-50 rounded-xl border border-dashed border-ivory-300">
          <div className="text-4xl mb-3">🎼</div>
          <p className="text-stone-500 mb-1">No segments yet</p>
          <p className="text-sm text-stone-400">Add segments to break this concert into its individual pieces.</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
              Add First Segment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {segments.map(sg => (
            <SegmentRow key={sg.id} segment={sg} concertId={id} />
          ))}
        </div>
      )}

      <Recommendations concertId={id} />
    </div>
  )
}
