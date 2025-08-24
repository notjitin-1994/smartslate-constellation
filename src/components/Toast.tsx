import { useEffect, memo } from 'react'

export interface ToastData {
  id: number
  kind: 'success' | 'error' | 'info'
  message: string
}

interface ToastProps {
  toast: ToastData | null
  onClose: () => void
  duration?: number
}

export const Toast = memo(function Toast({ toast, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [toast, onClose, duration])

  if (!toast) return null

  const bgColor = toast.kind === 'success' 
    ? 'bg-green-500/90' 
    : toast.kind === 'error' 
    ? 'bg-red-500/90' 
    : 'bg-blue-500/90'

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 animate-slide-up ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}
    >
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
})
