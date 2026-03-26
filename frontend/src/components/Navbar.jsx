import { Link, useNavigate, useLocation } from 'react-router-dom'
import useStore from '../store/useStore'

export default function Navbar() {
  const currentUser = useStore(s => s.currentUser)
  const logout = useStore(s => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to, label) => {
    const active = location.pathname === to
    return (
      <Link
        to={to}
        className={`text-sm font-medium transition-colors duration-150 ${
          active ? 'text-gold-600 border-b-2 border-gold-500 pb-0.5' : 'text-stone-600 hover:text-maroon-600'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-ivory-300 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl font-heading text-maroon-600 group-hover:text-maroon-700 transition-colors">
            ♪ SetList
          </span>
          <span className="hidden sm:block text-xs text-gold-600 font-medium tracking-widest uppercase">
            Carnatic
          </span>
        </Link>

        {/* Nav links */}
        {currentUser && (
          <nav className="hidden sm:flex items-center gap-6">
            {navLink('/browse', 'Browse')}
            {navLink('/upload', 'Add Concert')}
            {navLink('/profile', 'Profile')}
          </nav>
        )}

        {/* Auth */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <span className="hidden sm:block text-sm text-stone-500">
                {currentUser.username}
              </span>
              <button onClick={handleLogout} className="btn-ghost text-sm px-3 py-1.5">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm px-3 py-1.5">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-1.5">Join</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {currentUser && (
        <div className="sm:hidden border-t border-ivory-200 px-4 py-2 flex gap-4">
          {navLink('/browse', 'Browse')}
          {navLink('/upload', 'Add Concert')}
          {navLink('/profile', 'Profile')}
        </div>
      )}
    </header>
  )
}
