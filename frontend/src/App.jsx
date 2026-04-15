import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useStore from './store/useStore'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Upload from './pages/Upload'
import Browse from './pages/Browse'
import Concert from './pages/Concert'
import Profile from './pages/Profile'

function RequireAuth({ children }) {
  const currentUser = useStore(s => s.currentUser)
  return currentUser ? children : <Navigate to="/login" replace />
}

export default function App() {
  useEffect(() => {
    fetch('/seed.json')
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) useStore.getState().seedIfEmpty(data) })
      .catch(() => {})
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/concert/:id" element={<Concert />} />
            <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-ivory-300 bg-white/50 py-4 text-center text-xs text-stone-400">
          <span className="font-heading text-maroon-500">♪ SetList</span>
          <span className="mx-2">·</span>
          <span>Carnatic Music Archive</span>
        </footer>
      </div>
    </BrowserRouter>
  )
}
