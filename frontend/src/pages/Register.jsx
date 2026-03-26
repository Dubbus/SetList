import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const register = useStore(s => s.register)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    const result = register({ username: form.username, email: form.email, password: form.password })
    if (result.error) return setError(result.error)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-ivory-100">
      <div className="w-full max-w-sm">
        <div className="h-1 bg-gradient-to-r from-maroon-600 via-gold-500 to-maroon-600 rounded-t-xl" />

        <div className="card rounded-t-none p-8 animate-slide-up">
          <div className="text-center mb-6">
            <span className="text-3xl font-heading text-maroon-600">♪</span>
            <h1 className="font-heading text-2xl text-maroon-700 font-semibold mt-1">Join SetList</h1>
            <p className="text-stone-500 text-sm mt-1">Start cataloging your concerts</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2.5 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="mssubbalakshmi"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-2">
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-maroon-600 hover:text-maroon-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
