import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const now = () => new Date().toISOString()

// ── store ─────────────────────────────────────────────────────────────────────
const useStore = create(
  persist(
    (set, get) => ({
      // ── auth ────────────────────────────────────────────────────────────────
      currentUser: null,
      users: [],

      register: ({ username, email, password }) => {
        const { users } = get()
        if (users.find(u => u.email === email)) return { error: 'Email already registered' }
        const user = { id: uid(), username, email, password, favoriteArtists: [], createdAt: now() }
        set({ users: [...users, user], currentUser: user })
        return { success: true }
      },

      login: ({ email, password }) => {
        const user = get().users.find(u => u.email === email && u.password === password)
        if (!user) return { error: 'Invalid email or password' }
        set({ currentUser: user })
        return { success: true }
      },

      logout: () => set({ currentUser: null }),

      updateProfile: (updates) => {
        const { currentUser, users } = get()
        const updated = { ...currentUser, ...updates }
        set({
          currentUser: updated,
          users: users.map(u => u.id === updated.id ? updated : u),
        })
      },

      // ── concerts ────────────────────────────────────────────────────────────
      concerts: [],

      addConcert: (data) => {
        const { currentUser } = get()
        const concert = { id: uid(), ...data, uploadedBy: currentUser.id, createdAt: now() }
        set(s => ({ concerts: [concert, ...s.concerts] }))
        return concert
      },

      updateConcert: (id, updates) =>
        set(s => ({ concerts: s.concerts.map(c => c.id === id ? { ...c, ...updates } : c) })),

      deleteConcert: (id) =>
        set(s => ({
          concerts: s.concerts.filter(c => c.id !== id),
          segments: s.segments.filter(sg => sg.concertId !== id),
          ratings: s.ratings.filter(r => {
            const seg = s.segments.find(sg => sg.id === r.segmentId)
            return seg?.concertId !== id
          }),
        })),

      getConcert: (id) => get().concerts.find(c => c.id === id),

      // ── segments ────────────────────────────────────────────────────────────
      segments: [],

      addSegment: (data) => {
        const { currentUser } = get()
        const segment = { id: uid(), ...data, createdBy: currentUser.id, createdAt: now() }
        set(s => ({ segments: [segment, ...s.segments] }))
        return segment
      },

      updateSegment: (id, updates) =>
        set(s => ({ segments: s.segments.map(sg => sg.id === id ? { ...sg, ...updates } : sg) })),

      deleteSegment: (id) =>
        set(s => ({
          segments: s.segments.filter(sg => sg.id !== id),
          ratings: s.ratings.filter(r => r.segmentId !== id),
        })),

      getSegmentsForConcert: (concertId) =>
        get().segments.filter(sg => sg.concertId === concertId).sort((a, b) => a.startTime - b.startTime),

      // ── ratings ─────────────────────────────────────────────────────────────
      ratings: [],

      upsertRating: (segmentId, rating) => {
        const { currentUser, ratings } = get()
        const existing = ratings.find(r => r.segmentId === segmentId && r.userId === currentUser.id)
        if (existing) {
          set(s => ({ ratings: s.ratings.map(r => r.id === existing.id ? { ...r, rating } : r) }))
        } else {
          set(s => ({ ratings: [...s.ratings, { id: uid(), userId: currentUser.id, segmentId, rating, createdAt: now() }] }))
        }
      },

      getRatingForSegment: (segmentId) => {
        const { currentUser, ratings } = get()
        return ratings.find(r => r.segmentId === segmentId && r.userId === currentUser?.id)?.rating ?? 0
      },

      getAvgRating: (segmentId) => {
        const { ratings } = get()
        const rs = ratings.filter(r => r.segmentId === segmentId)
        if (!rs.length) return 0
        return rs.reduce((s, r) => s + r.rating, 0) / rs.length
      },

      // ── derived helpers ─────────────────────────────────────────────────────
      getRecentActivity: (limit = 10) => {
        const { currentUser, ratings, segments, concerts } = get()
        if (!currentUser) return []
        return ratings
          .filter(r => r.userId === currentUser.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit)
          .map(r => {
            const segment = segments.find(sg => sg.id === r.segmentId)
            const concert = concerts.find(c => c.id === segment?.concertId)
            return { rating: r, segment, concert }
          })
          .filter(x => x.segment && x.concert)
      },
    }),
    { name: 'setlist-storage' }
  )
)

export default useStore
