import { Link } from 'react-router-dom'
import useStore from '../store/useStore'
import ConcertCard from '../components/ConcertCard'

export default function Home() {
  const currentUser = useStore(s => s.currentUser)
  const concerts = useStore(s => s.concerts)

  const recent = concerts.slice(0, 3)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon-800 via-maroon-700 to-maroon-900 text-white">
        {/* Decorative kolam overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='1'%3E%3Cpath d='M40 0l11.55 20H28.45L40 0zm0 80L28.45 60h23.1L40 80zM0 40l20-11.55v23.1L0 40zm80 0L60 51.55V28.45L80 40zM40 20a20 20 0 110 40 20 20 0 010-40zm0 5a15 15 0 100 30 15 15 0 000-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="font-heading text-5xl sm:text-6xl font-semibold text-ivory-100 mb-4 leading-tight">
            Every Raga, <br className="sm:hidden" />
            <span className="text-gold-400">Remembered</span>
          </h1>
          <p className="text-ivory-300 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Catalog and share Carnatic music concerts. Segment performances, discover ragas, and build your musical archive.
          </p>
          {currentUser ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/upload" className="btn-primary bg-gold-500 hover:bg-gold-600 text-maroon-900 font-semibold">
                + Add Concert
              </Link>
              <Link to="/browse" className="btn-secondary border-ivory-300 text-ivory-200 hover:bg-white/10">
                Browse Concerts
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="btn-primary bg-gold-500 hover:bg-gold-600 text-maroon-900 font-semibold">
                Get Started
              </Link>
              <Link to="/login" className="btn-secondary border-ivory-300 text-ivory-200 hover:bg-white/10">
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40L1440 40L1440 15C1200 40 720 0 0 20L0 40Z" fill="#faf8f0"/>
          </svg>
        </div>
      </section>

      {/* Features strip */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: '🎵', title: 'Segment Concerts', desc: 'Mark alapanas, songs, RTPs, swarams, and thanis with precise timestamps.' },
            { icon: '⭐', title: 'Rate Segments', desc: 'Rate individual segments to build your personal Carnatic taste profile.' },
            { icon: '🔍', title: 'Browse & Discover', desc: 'Explore concerts added by the community, filter by artist or raga.' },
          ].map(f => (
            <div key={f.title} className="card p-6 text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-heading text-maroon-700 font-semibold mb-2">{f.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent concerts */}
      {recent.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-2xl text-maroon-700 font-semibold">Recent Concerts</h2>
            <Link to="/browse" className="text-sm text-gold-600 hover:text-gold-700 font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map(c => <ConcertCard key={c.id} concert={c} />)}
          </div>
        </section>
      )}
    </div>
  )
}
