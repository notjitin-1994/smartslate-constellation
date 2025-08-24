import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function CreateConstellationPage() {
  const navigate = useNavigate()
  const [selectedOption, setSelectedOption] = useState<'starmap' | 'scratch' | null>(null)
  
  useDocumentTitle('Create New Constellation')

  function handleStarmapSelection() {
    navigate(paths.starmapSelect)
  }

  function handleStartFromScratch() {
    navigate(`${paths.constellationCreate}/new`)
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Create New Constellation</h2>
          <p className="mt-1 text-white/70">Choose how to begin your instructional design journey</p>
        </div>
        <button
          onClick={() => navigate(paths.dashboard)}
          className="px-3 py-2 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-colors"
        >
          Back to Portal
        </button>
      </div>
      <div>
          {/* Introduction */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              How would you like to begin?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Start with a pre-designed Starmap template or create your own unique constellation from scratch
            </p>
          </div>

          {/* Option Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Begin with Starmap */}
            <div 
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                selectedOption === 'starmap' 
                  ? 'border-purple-500 bg-purple-500/20' 
                  : 'border-white/10 bg-white/5 hover:border-purple-500/50'
              }`}
              onClick={() => setSelectedOption('starmap')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 p-8">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 text-center">Begin with a Starmap</h3>
                <p className="text-white/70 text-center mb-6">
                  Start with expertly crafted templates from Polaris. These Starmaps provide structured frameworks for various learning scenarios.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white/80 text-sm">Pre-designed course structures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white/80 text-sm">Industry best practices built-in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white/80 text-sm">Faster time to completion</span>
                  </li>
                </ul>
                {selectedOption === 'starmap' && (
                  <button
                    onClick={handleStarmapSelection}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
                  >
                    Browse Starmaps
                  </button>
                )}
              </div>
            </div>

            {/* Begin from Scratch */}
            <div 
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                selectedOption === 'scratch' 
                  ? 'border-pink-500 bg-pink-500/20' 
                  : 'border-white/10 bg-white/5 hover:border-pink-500/50'
              }`}
              onClick={() => setSelectedOption('scratch')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 p-8">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 text-center">Begin from Scratch</h3>
                <p className="text-white/70 text-center mb-6">
                  Create a completely custom constellation tailored to your unique needs. Full creative control over every aspect.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white/80 text-sm">Complete creative freedom</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white/80 text-sm">Unique to your requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white/80 text-sm">AI assists at every step</span>
                  </li>
                </ul>
                {selectedOption === 'scratch' && (
                  <button
                    onClick={handleStartFromScratch}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-orange-600 transition-all"
                  >
                    Start Creating
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Not sure which to choose?</h4>
                <p className="text-white/70 text-sm">
                  If you're new to instructional design or want to save time, we recommend starting with a Starmap. 
                  You can always customize it later. For unique or specialized content, starting from scratch gives you complete control.
                </p>
              </div>
            </div>
          </div>
      </div>
    </section>
  )
}
