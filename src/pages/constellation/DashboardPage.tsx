import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { paths, constellationPath } from '@/routes/paths'
import { constellationService } from '@/services/constellationService'
import type { Constellation } from '@/types/constellation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function DashboardPage() {
  const navigate = useNavigate()
  const [constellations, setConstellations] = useState<Constellation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useDocumentTitle('Constellation - Dashboard')

  useEffect(() => {
    loadConstellations()
  }, [])

  async function loadConstellations() {
    try {
      setLoading(true)
      const data = await constellationService.getUserConstellations()
      setConstellations(data)
    } catch (err) {
      setError('Failed to load constellations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleCreateNew() {
    navigate(paths.constellationCreate)
  }

  function handleViewConstellation(id: string) {
    navigate(constellationPath(id))
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl md:text-4xl">✨</span>
          Constellation
        </h2>
        <p className="mt-1 text-white/70">Instructional Design Intelligence</p>
      </div>
      <div>
          {/* Welcome Section */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-white mb-4">
              Welcome to Your Design Universe
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Transform your content into world-class instructional experiences with AI-powered design intelligence
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Existing Constellations */}
            <div 
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              onClick={() => setActiveView('existing')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Existing Constellations</h3>
                <p className="text-white/70 mb-4">
                  View and manage your created instructional designs
                </p>
                <div className="flex items-center text-blue-400 group-hover:text-blue-300">
                  <span className="mr-2">View Collection</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Create New Constellation */}
            <div 
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              onClick={handleCreateNew}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Create New Constellation</h3>
                <p className="text-white/70 mb-4">
                  Start a new instructional design project with AI assistance
                </p>
                <div className="flex items-center text-purple-400 group-hover:text-purple-300">
                  <span className="mr-2">Begin Creation</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Constellations List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white/80" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={loadConstellations}
                className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : constellations.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Constellations Yet</h3>
              <p className="text-white/60 mb-6">Create your first constellation to get started</p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
              >
                Create Your First Constellation
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Your Constellations</h3>
              <div className="grid gap-4">
                {constellations.map((constellation) => (
                  <div
                    key={constellation.id}
                    onClick={() => handleViewConstellation(constellation.id)}
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                          {constellation.title}
                        </h4>
                        <p className="text-white/60 mb-3 line-clamp-2">
                          {constellation.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-3 py-1 rounded-full ${
                            constellation.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : constellation.status === 'processing'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {constellation.status}
                          </span>
                          <span className="text-white/50">
                            {constellation.media_items?.length || 0} media items
                          </span>
                          <span className="text-white/50">
                            {constellation.artifacts?.length || 0} artifacts
                          </span>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-white/40 group-hover:text-white/80 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Multi-Media Support</h4>
              <p className="text-white/60 text-sm">Upload documents, videos, audio, and more for comprehensive analysis</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">AI-Powered Design</h4>
              <p className="text-white/60 text-sm">Get intelligent suggestions for storyboards, scripts, and visual designs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Complete Artifacts</h4>
              <p className="text-white/60 text-sm">Generate storyboards, scripts, palettes, and learning materials automatically</p>
            </div>
          </div>
      </div>
    </section>
  )
}

function setActiveView(view: string) {
  // This would be implemented to switch views
  console.log('Switching to view:', view)
}
