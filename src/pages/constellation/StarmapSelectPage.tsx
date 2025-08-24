import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { constellationService } from '@/services/constellationService'
import type { Starmap } from '@/types/constellation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PolarisStarmapEmbed } from '@/components/PolarisStarmapEmbed'

export function StarmapSelectPage() {
  const navigate = useNavigate()
  const [starmaps, setStarmaps] = useState<Starmap[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStarmap, setSelectedStarmap] = useState<Starmap | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  
  useDocumentTitle('Select a Starmap')

  useEffect(() => {
    loadStarmaps()
    // realtime subscription
    const unsubscribe = constellationService.subscribeToUserStarmaps((_evt) => {
      loadStarmaps()
    })
    return () => unsubscribe()
  }, [])

  async function loadStarmaps() {
    try {
      setLoading(true)
      // Fetch only this user's starmaps created in Polaris
      const data = await constellationService.fetchUserStarmaps()
      setStarmaps(data)
    } catch (error) {
      console.error('Failed to load starmaps:', error)
      setStarmaps([])
    } finally {
      setLoading(false)
    }
  }

  function handleSelectStarmap(starmap: Starmap) {
    setSelectedStarmap(starmap)
  }

  async function handleProceedWithStarmap() {
    if (!selectedStarmap) return
    
    try {
      // Create constellation with selected starmap
      const constellation = await constellationService.createConstellation(
        selectedStarmap.title,
        selectedStarmap.description,
        selectedStarmap.id,
        { starmap_metadata: selectedStarmap.metadata }
      )
      
      navigate(`/constellations/${constellation.id}/edit`)
    } catch (error) {
      console.error('Failed to create constellation:', error)
      // For demo, navigate anyway
      navigate(`${paths.constellationCreate}/new?starmap=${selectedStarmap.id}`)
    }
  }

  const filteredStarmaps = starmaps.filter(starmap => {
    const matchesSearch = starmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         starmap.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterCategory === 'all' || starmap.metadata?.category === filterCategory
    return matchesSearch && matchesFilter
  })

  const categories = ['all', 'corporate', 'sales', 'technical', 'leadership', 'service', 'compliance']

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Select a Starmap</h2>
          <p className="mt-1 text-white/70">Choose a template from the Polaris collection</p>
        </div>
        <button
          onClick={() => navigate(paths.constellationCreate)}
          className="px-3 py-2 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-colors"
        >
          Back
        </button>
      </div>

      {selectedStarmap?.html && (
        <div className="mb-8">
          <PolarisStarmapEmbed html={selectedStarmap.html} title={selectedStarmap.title} />
        </div>
      )}

      <div>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search starmaps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 backdrop-blur-xl"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    filterCategory === category
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Starmaps Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white/80" />
            </div>
          ) : filteredStarmaps.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-white/60">No starmaps found. Create one in Polaris and it will appear here.</p>
              <a
                href="https://polaris.smartslate.io"
                className="inline-block mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                Open Polaris
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStarmaps.map((starmap) => (
                <div
                  key={starmap.id}
                  onClick={() => handleSelectStarmap(starmap)}
                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                    selectedStarmap?.id === starmap.id
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-white/10 bg-white/5 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 p-6">
                    {/* Starmap Icon */}
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-2">{starmap.title}</h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-3">{starmap.description}</p>
                    
                    {/* Metadata badges */}
                    <div className="flex flex-wrap gap-2">
                      {starmap.metadata?.duration && (
                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/70">
                          {starmap.metadata.duration}
                        </span>
                      )}
                      {starmap.metadata?.difficulty && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          starmap.metadata.difficulty === 'beginner' 
                            ? 'bg-green-500/20 text-green-400'
                            : starmap.metadata.difficulty === 'intermediate'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {starmap.metadata.difficulty}
                        </span>
                      )}
                      {starmap.metadata?.category && (
                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                          {starmap.metadata.category}
                        </span>
                      )}
                    </div>
                    
                    {selectedStarmap?.id === starmap.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Starmap Actions */}
          {selectedStarmap && (
            <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-6 animate-slide-up">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Selected Starmap</p>
                  <h3 className="text-xl font-semibold text-white">{selectedStarmap.title}</h3>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedStarmap(null)}
                    className="px-6 py-3 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedWithStarmap}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105"
                  >
                    Continue with this Starmap
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </section>
  )
}
