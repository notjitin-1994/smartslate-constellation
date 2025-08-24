import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { constellationPath, paths } from '@/routes/paths'
import { constellationService } from '@/services/constellationService'
import type { Constellation } from '@/types/constellation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function ConstellationsPage() {
  const navigate = useNavigate()
  const [constellations, setConstellations] = useState<Constellation[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useDocumentTitle('Constellations')

  useEffect(() => {
    let isMounted = true
    async function loadAll() {
      try {
        setLoading(true)
        const all = await constellationService.getUserConstellations()
        if (!isMounted) return
        setConstellations(all)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadAll()
    return () => { isMounted = false }
  }, [])

  const stats = useMemo(() => {
    const total = constellations.length
    const completed = constellations.filter(c => c.status === 'completed').length
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { total, completed, percent }
  }, [constellations])

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Constellations</h1>
        <p className="text-white/60 text-sm">View and manage all your Constellations.</p>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-white/90 font-semibold">Your Constellations</div>
          <button
            type="button"
            onClick={() => navigate(paths.constellationCreate)}
            className="px-3 py-1.5 rounded-lg bg-primary-600/25 border border-primary-600/40 text-primary-100 text-sm hover:bg-primary-600/35 transition pressable"
          >
            New Constellation
          </button>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
        <div className="mt-2 text-right text-[11px] text-white/50">
          Completed {stats.completed}/{stats.total}
        </div>
      </div>

      {/* Grid */}
      <div className="mb-2 text-white/70 text-sm">Your Constellations</div>
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white/80" />
        </div>
      ) : constellations.length === 0 ? (
        <div className="text-center py-24 rounded-xl border border-white/10 bg-white/5">
          <p className="text-white/60">You have not created any constellations yet.</p>
          <button
            type="button"
            onClick={() => navigate(paths.constellationCreate)}
            className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Create Constellation
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {constellations.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/7.5 transition-colors cursor-pointer shadow-sm"
              onClick={() => navigate(constellationPath(c.id))}
            >
              <div className="text-white font-medium">{c.title || 'Untitled'}</div>
              <div className="text-[11px] text-white/50 mt-1">
                {new Date(c.created_at).toLocaleString()}
              </div>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                  Media Items: <span className="text-white/90">{c.media_items?.length || 0}</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                  Artifacts: <span className="text-white/90">{c.artifacts?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => navigate(paths.constellationCreate)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary-600 text-white text-2xl leading-none border border-primary-400/40 shadow-lg hover:bg-primary-500 transition pressable"
        title="Create Constellation"
        aria-label="Create Constellation"
      >
        +
      </button>
    </section>
  )
}

export default ConstellationsPage


