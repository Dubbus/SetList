import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'

export default function Upload() {
  const addConcert = useStore(s => s.addConcert)
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    artist: '',
    sourceUrl: '',
    date: '',
    venue: '',
    description: '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.artist.trim()) e.artist = 'Artist is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) return setErrors(e2)
    const concert = addConcert(form)
    navigate(`/concert/${concert.id}`)
  }

  const field = (key) => ({
    value: form[key],
    onChange: (ev) => {
      setForm(f => ({ ...f, [key]: ev.target.value }))
      setErrors(er => ({ ...er, [key]: undefined }))
    },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <h1 className="page-title">Add a Concert</h1>
      <p className="page-subtitle">Fill in the details — you can add segments after saving.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="label">Concert Title *</label>
          <input
            type="text"
            placeholder="e.g. MSS Live at Music Academy 1984"
            className={`input-field ${errors.title ? 'border-rose-400 ring-2 ring-rose-200' : ''}`}
            {...field('title')}
          />
          {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Artist */}
        <div>
          <label className="label">Artist *</label>
          <input
            type="text"
            placeholder="e.g. M.S. Subbulakshmi"
            className={`input-field ${errors.artist ? 'border-rose-400 ring-2 ring-rose-200' : ''}`}
            {...field('artist')}
          />
          {errors.artist && <p className="text-rose-500 text-xs mt-1">{errors.artist}</p>}
        </div>

        {/* Source URL */}
        <div>
          <label className="label">YouTube / SoundCloud URL</label>
          <input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            className="input-field"
            {...field('sourceUrl')}
          />
          <p className="text-stone-400 text-xs mt-1">Optional — paste the link to the recording</p>
        </div>

        {/* Date & Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Concert Date</label>
            <input type="date" className="input-field" {...field('date')} />
          </div>
          <div>
            <label className="label">Venue</label>
            <input type="text" placeholder="e.g. Music Academy, Chennai" className="input-field" {...field('venue')} />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            rows={3}
            placeholder="Notes about this concert, special moments, context..."
            className="input-field resize-none"
            {...field('description')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">Save Concert</button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  )
}
