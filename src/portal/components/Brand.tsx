import { memo } from 'react'

export const Brand = memo(function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src="/images/logos/logo.png" alt="SmartSlate" className="h-8 w-auto select-none" />
    </div>
  )
})
