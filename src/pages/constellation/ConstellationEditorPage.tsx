import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { paths, constellationPath } from '@/routes/paths'
import { constellationService } from '@/services/constellationService'
import { llmService } from '@/services/llmService'
import type { 
  Constellation, 
  MediaItem, 
  LearningArtifact,
  ConstellationMetadata 
} from '@/types/constellation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

interface MediaUpload {
  file?: File
  type: MediaItem['type']
  content?: string
  userContext: string
  isProcessing: boolean
  id?: string
}

export function ConstellationEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [constellation, setConstellation] = useState<Constellation | null>(null)
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([])
  const [currentUpload, setCurrentUpload] = useState<MediaUpload>({
    type: 'document',
    userContext: '',
    isProcessing: false
  })
  const [isGeneratingArtifacts, setIsGeneratingArtifacts] = useState(false)
  const [artifacts, setArtifacts] = useState<LearningArtifact[]>([])
  const [metadata, setMetadata] = useState<ConstellationMetadata>({
    target_audience: '',
    duration: '',
    modality: [],
    learning_style: [],
    prerequisites: [],
    tags: [],
    constraints: []
  })
  
  const isNewConstellation = id === 'new'
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  
  useDocumentTitle(isNewConstellation ? 'Create Constellation' : 'Edit Constellation')

  useEffect(() => {
    if (!isNewConstellation && id) {
      loadConstellation(id)
    }
  }, [id, isNewConstellation])

  async function loadConstellation(constellationId: string) {
    try {
      const data = await constellationService.getConstellation(constellationId)
      if (data) {
        setConstellation(data)
        setTitle(data.title)
        setDescription(data.description)
        setMetadata(data.metadata || {})
        if (data.media_items) {
          setMediaUploads(data.media_items.map(item => ({
            type: item.type,
            content: item.content,
            userContext: item.user_context || '',
            isProcessing: false,
            id: item.id
          })))
        }
        if (data.artifacts) {
          setArtifacts(data.artifacts)
        }
      }
    } catch (error) {
      console.error('Failed to load constellation:', error)
    }
  }

  async function handleCreateConstellation() {
    if (!title || !description) {
      alert('Please provide a title and description')
      return
    }
    
    try {
      const newConstellation = await constellationService.createConstellation(
        title,
        description,
        undefined,
        metadata
      )
      setConstellation(newConstellation)
      navigate(`/constellations/${newConstellation.id}/edit`, { replace: true })
    } catch (error) {
      console.error('Failed to create constellation:', error)
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      setCurrentUpload(prev => ({
        ...prev,
        file,
        type: getFileType(file)
      }))
    }
  }

  function getFileType(file: File): MediaItem['type'] {
    const mimeType = file.type
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document'
    return 'other'
  }

  async function handleAddMedia() {
    if (!currentUpload.file && !currentUpload.content) {
      alert('Please upload a file or provide content')
      return
    }
    
    if (!currentUpload.userContext) {
      alert('Please provide context about this content')
      return
    }
    
    // Add to uploads list
    const newUpload = { ...currentUpload, isProcessing: true }
    setMediaUploads(prev => [...prev, newUpload])
    
    // Process with AI
    try {
      if (constellation?.id) {
        let fileUrl = ''
        if (currentUpload.file) {
          const uploadResult = await constellationService.uploadFile(
            constellation.id,
            currentUpload.file
          )
          fileUrl = uploadResult.url
        }
        
        const mediaItem = await constellationService.addMediaItem(constellation.id, {
          constellation_id: constellation.id,
          type: currentUpload.type,
          file_url: fileUrl,
          file_name: currentUpload.file?.name,
          file_size: currentUpload.file?.size,
          content: currentUpload.content,
          user_context: currentUpload.userContext,
          order: mediaUploads.length
        })
        
        // Analyze with LLM
        const analysis = await llmService.analyzeMediaItem(mediaItem, currentUpload.userContext)
        await constellationService.updateMediaAnalysis(mediaItem.id, analysis)
        
        // Update local state
        setMediaUploads(prev => prev.map(upload => 
          upload === newUpload 
            ? { ...upload, isProcessing: false, id: mediaItem.id }
            : upload
        ))
      }
    } catch (error) {
      console.error('Failed to process media:', error)
      setMediaUploads(prev => prev.map(upload => 
        upload === newUpload 
          ? { ...upload, isProcessing: false }
          : upload
      ))
    }
    
    // Reset current upload
    setCurrentUpload({
      type: 'document',
      userContext: '',
      isProcessing: false
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleGenerateArtifacts() {
    if (!constellation?.id) {
      alert('Please save the constellation first')
      return
    }
    
    if (mediaUploads.length === 0) {
      alert('Please add some content first')
      return
    }
    
    setIsGeneratingArtifacts(true)
    
    try {
      // Get all media items
      const mediaItems = await Promise.all(
        mediaUploads.filter(u => u.id).map(async (upload) => {
          const result = await constellationService.getConstellation(constellation.id)
          return result?.media_items?.find(m => m.id === upload.id)
        })
      ).then(items => items.filter(Boolean) as MediaItem[])
      
      // Generate artifacts
      const generatedArtifacts = await llmService.generateAllArtifacts(mediaItems, metadata)
      
      // Save artifacts
      for (const artifact of generatedArtifacts) {
        const saved = await constellationService.addArtifact(constellation.id, artifact)
        setArtifacts(prev => [...prev, saved])
      }
      
      // Update constellation status
      await constellationService.updateConstellation(constellation.id, {
        status: 'completed'
      })
      
      alert('Artifacts generated successfully!')
    } catch (error) {
      console.error('Failed to generate artifacts:', error)
      alert('Failed to generate artifacts. Please try again.')
    } finally {
      setIsGeneratingArtifacts(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {isNewConstellation ? 'Create New Constellation' : 'Edit Constellation'}
          </h2>
          {constellation && (
            <p className="text-white/60 text-sm mt-1">{constellation.title}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(paths.dashboard)}
            className="px-3 py-2 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-colors"
          >
            Back to Portal
          </button>
          {constellation && (
            <button
              onClick={() => navigate(constellationPath(constellation.id))}
              className="px-3 py-2 bg-white/10 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              View Constellation
            </button>
          )}
        </div>
      </div>
      <div>
          {/* Constellation Details */}
          {(isNewConstellation || !constellation) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Constellation Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="Enter constellation title"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-2">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="Describe your constellation"
                  />
                </div>
              </div>
              
              {/* Metadata */}
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={metadata.target_audience || ''}
                    onChange={(e) => setMetadata(prev => ({ ...prev, target_audience: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="e.g., New employees, Sales team"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-2">Duration</label>
                  <input
                    type="text"
                    value={metadata.duration || ''}
                    onChange={(e) => setMetadata(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="e.g., 2 hours, 3 weeks"
                  />
                </div>
              </div>
              
              {!constellation && (
                <button
                  onClick={handleCreateConstellation}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Create Constellation
                </button>
              )}
            </div>
          )}

          {/* Media Upload Section */}
          {constellation && (
            <>
              <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Add Content</h2>
                
                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-white/80 text-sm mb-2">Upload File</label>
                  <div className="flex gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                      accept="*"
                    />
                    <select
                      value={currentUpload.type}
                      onChange={(e) => setCurrentUpload(prev => ({ ...prev, type: e.target.value as MediaItem['type'] }))}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    >
                      <option value="document">Document</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="image">Image</option>
                      <option value="link">Link</option>
                      <option value="text">Text</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                {/* Text Content */}
                {(currentUpload.type === 'text' || currentUpload.type === 'link') && (
                  <div className="mb-4">
                    <label className="block text-white/80 text-sm mb-2">
                      {currentUpload.type === 'link' ? 'URL' : 'Text Content'}
                    </label>
                    <textarea
                      value={currentUpload.content || ''}
                      onChange={(e) => setCurrentUpload(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                      rows={3}
                      placeholder={currentUpload.type === 'link' ? 'Enter URL' : 'Enter text content'}
                    />
                  </div>
                )}
                
                {/* Context */}
                <div className="mb-4">
                  <label className="block text-white/80 text-sm mb-2">Context (Required)</label>
                  <textarea
                    value={currentUpload.userContext}
                    onChange={(e) => setCurrentUpload(prev => ({ ...prev, userContext: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    rows={3}
                    placeholder="Describe this content and how it should be used in the course..."
                  />
                </div>
                
                <button
                  onClick={handleAddMedia}
                  disabled={!currentUpload.userContext || (!currentUpload.file && !currentUpload.content)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Content
                </button>
              </div>

              {/* Media Items List */}
              {mediaUploads.length > 0 && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Content Library ({mediaUploads.length} items)
                  </h2>
                  <div className="space-y-3">
                    {mediaUploads.map((upload, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                          {upload.type === 'document' && (
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {upload.type === 'video' && (
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                          {upload.type === 'audio' && (
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          )}
                          {(upload.type === 'text' || upload.type === 'link') && (
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">
                              {upload.file?.name || upload.content?.substring(0, 30) || `${upload.type} content`}
                            </span>
                            {upload.isProcessing && (
                              <span className="text-xs text-yellow-400">Processing...</span>
                            )}
                            {upload.id && !upload.isProcessing && (
                              <span className="text-xs text-green-400">✓ Analyzed</span>
                            )}
                          </div>
                          <p className="text-white/60 text-sm line-clamp-2">{upload.userContext}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Artifacts */}
              {mediaUploads.length > 0 && (
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Generate Learning Artifacts</h2>
                  <p className="text-white/70 mb-6">
                    AI will analyze your content and generate comprehensive instructional design artifacts including 
                    storyboards, scripts, color palettes, and more.
                  </p>
                  <button
                    onClick={handleGenerateArtifacts}
                    disabled={isGeneratingArtifacts || mediaUploads.some(u => u.isProcessing)}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isGeneratingArtifacts ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating Artifacts...
                      </span>
                    ) : (
                      'Generate Artifacts with AI'
                    )}
                  </button>
                  
                  {/* Artifacts List */}
                  {artifacts.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-lg font-semibold text-white">Generated Artifacts</h3>
                      {artifacts.map((artifact) => (
                        <div
                          key={artifact.id}
                          className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
                        >
                          <span className="text-white">{artifact.title}</span>
                          <button
                            onClick={() => navigate(`${constellationPath(constellation.id)}/artifacts/${artifact.id}`)}
                            className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
      </div>
    </section>
  )
}
