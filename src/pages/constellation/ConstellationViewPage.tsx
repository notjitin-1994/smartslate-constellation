import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { paths, constellationEditPath } from '@/routes/paths'
import { constellationService } from '@/services/constellationService'
import type { Constellation, LearningArtifact } from '@/types/constellation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function ConstellationViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [constellation, setConstellation] = useState<Constellation | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedArtifact, setSelectedArtifact] = useState<LearningArtifact | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'artifacts'>('overview')
  
  useDocumentTitle(constellation?.title ? `Constellation - ${constellation.title}` : 'View Constellation')

  useEffect(() => {
    if (id) {
      loadConstellation(id)
    }
  }, [id])

  async function loadConstellation(constellationId: string) {
    try {
      setLoading(true)
      const data = await constellationService.getConstellation(constellationId)
      setConstellation(data)
      if (data?.artifacts && data.artifacts.length > 0) {
        setSelectedArtifact(data.artifacts[0])
      }
    } catch (error) {
      console.error('Failed to load constellation:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!constellation || !confirm('Are you sure you want to delete this constellation?')) return
    
    try {
      await constellationService.deleteConstellation(constellation.id)
      navigate(paths.portal)
    } catch (error) {
      console.error('Failed to delete constellation:', error)
      alert('Failed to delete constellation')
    }
  }

  function renderArtifactContent(artifact: LearningArtifact) {
    switch (artifact.type) {
      case 'storyboard':
        return (
          <div className="space-y-4">
            {Array.isArray(artifact.content) && artifact.content.map((slide: any, index: number) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">
                    Slide {slide.slide_number || index + 1}: {slide.title}
                  </h4>
                  {slide.duration_seconds && (
                    <span className="text-sm text-white/60">{slide.duration_seconds}s</span>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Visual Description</p>
                    <p className="text-white/80">{slide.visual_description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60 mb-1">Narration</p>
                    <p className="text-white/80">{slide.narration_text}</p>
                  </div>
                </div>
                {slide.interactions && slide.interactions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-white/60 mb-1">Interactions</p>
                    <ul className="list-disc list-inside text-white/80">
                      {slide.interactions.map((interaction: string, i: number) => (
                        <li key={i}>{interaction}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      
      case 'voiceover_script':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/60 mb-2">Tone: {artifact.content.tone}</p>
              <p className="text-white/60 mb-4">Pace: {artifact.content.pace}</p>
              {artifact.content.sections?.map((section: any, index: number) => (
                <div key={index} className="mb-4 pb-4 border-b border-white/10 last:border-0">
                  <h4 className="text-lg font-semibold text-white mb-2">{section.title}</h4>
                  <p className="text-white/80 whitespace-pre-wrap">{section.text}</p>
                  {section.notes && (
                    <p className="text-sm text-white/60 mt-2 italic">Note: {section.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'color_palette':
        return (
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(artifact.content).map(([name, color]) => {
                if (typeof color !== 'string') return null
                return (
                  <div key={name} className="text-center">
                    <div 
                      className="w-full h-24 rounded-lg mb-2 border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-white font-medium capitalize">{name}</p>
                    <p className="text-white/60 text-sm">{color}</p>
                  </div>
                )
              })}
            </div>
            {artifact.content.rationale && (
              <p className="mt-4 text-white/70">{artifact.content.rationale}</p>
            )}
          </div>
        )
      
      case 'sound_inspiration':
        return (
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm">Mood</p>
                <p className="text-white mb-3">{artifact.content.mood}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Genre</p>
                <p className="text-white mb-3">{artifact.content.genre}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Tempo</p>
                <p className="text-white mb-3">{artifact.content.tempo}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Description</p>
                <p className="text-white mb-3">{artifact.content.description}</p>
              </div>
            </div>
            {artifact.content.instruments && artifact.content.instruments.length > 0 && (
              <div className="mt-4">
                <p className="text-white/60 text-sm mb-2">Instruments</p>
                <div className="flex flex-wrap gap-2">
                  {artifact.content.instruments.map((instrument: string) => (
                    <span key={instrument} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80">
                      {instrument}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      
      default:
        return (
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <pre className="text-white/80 whitespace-pre-wrap">
              {JSON.stringify(artifact.content, null, 2)}
            </pre>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white/80" />
        </div>
      </section>
    )
  }

  if (!constellation) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center py-24">
          <p className="text-white/60 mb-4">Constellation not found</p>
          <button
            onClick={() => navigate(paths.portal)}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Back to Portal
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{constellation.title}</h2>
          <p className="text-white/60 text-sm mt-1">{constellation.description}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(paths.portal)}
            className="px-3 py-2 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-colors"
          >
            Portal
          </button>
          <button
            onClick={() => navigate(constellationEditPath(constellation.id))}
            className="px-3 py-2 bg-white/10 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-6">
          {(['overview', 'media', 'artifacts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-2 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              {tab}
              {tab === 'media' && constellation.media_items && (
                <span className="ml-2 text-sm">({constellation.media_items.length})</span>
              )}
              {tab === 'artifacts' && constellation.artifacts && (
                <span className="ml-2 text-sm">({constellation.artifacts.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Status Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Status</h2>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    constellation.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : constellation.status === 'processing'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {constellation.status}
                  </span>
                  <span className="text-white/60">
                    Created {new Date(constellation.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Metadata */}
              {constellation.metadata && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {constellation.metadata.target_audience && (
                      <div>
                        <p className="text-white/60 text-sm">Target Audience</p>
                        <p className="text-white">{constellation.metadata.target_audience}</p>
                      </div>
                    )}
                    {constellation.metadata.duration && (
                      <div>
                        <p className="text-white/60 text-sm">Duration</p>
                        <p className="text-white">{constellation.metadata.duration}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 p-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white mb-2">
                    {constellation.media_items?.length || 0}
                  </p>
                  <p className="text-white/60">Media Items</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30 p-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white mb-2">
                    {constellation.artifacts?.length || 0}
                  </p>
                  <p className="text-white/60">Artifacts Generated</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-4">
            {constellation.media_items && constellation.media_items.length > 0 ? (
              constellation.media_items.map((item) => (
                <div key={item.id} className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {item.file_name || item.type}
                      </h3>
                      {item.user_context && (
                        <div className="mb-3">
                          <p className="text-sm text-white/60 mb-1">User Context</p>
                          <p className="text-white/80">{item.user_context}</p>
                        </div>
                      )}
                      {item.ai_analysis && (
                        <div className="p-3 bg-white/5 rounded-lg">
                          <p className="text-sm text-white/60 mb-1">AI Analysis</p>
                          <p className="text-white/80 mb-2">{item.ai_analysis.summary}</p>
                          {item.ai_analysis.key_concepts && item.ai_analysis.key_concepts.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {item.ai_analysis.key_concepts.map((concept) => (
                                <span key={concept} className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-400">
                                  {concept}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60">No media items added yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'artifacts' && (
          <div className="grid md:grid-cols-4 gap-6">
            {/* Artifact List */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white mb-4">Artifacts</h3>
              {constellation.artifacts && constellation.artifacts.length > 0 ? (
                constellation.artifacts.map((artifact) => (
                  <button
                    key={artifact.id}
                    onClick={() => setSelectedArtifact(artifact)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedArtifact?.id === artifact.id
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-white font-medium">{artifact.title}</p>
                    <p className="text-white/60 text-sm capitalize">{artifact.type.replace(/_/g, ' ')}</p>
                  </button>
                ))
              ) : (
                <p className="text-white/60">No artifacts generated yet</p>
              )}
            </div>

            {/* Artifact Content */}
            {selectedArtifact && (
              <div className="md:col-span-3">
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h2 className="text-2xl font-semibold text-white mb-4">{selectedArtifact.title}</h2>
                  <div className="text-sm text-white/60 mb-6">
                    Type: <span className="capitalize">{selectedArtifact.type.replace(/_/g, ' ')}</span>
                  </div>
                  {renderArtifactContent(selectedArtifact)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
