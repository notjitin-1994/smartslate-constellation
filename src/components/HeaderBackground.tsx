import type { CSSProperties } from 'react'
import { ScatterSwirls } from '@/components/ScatterSwirls'

type HeaderBackgroundProps = {
  showGradient?: boolean
  showSwirls?: boolean
  gradientClassName?: string
  swirlClassName?: string
  style?: CSSProperties
  mode?: 'pattern' | 'scatter'
  fullWidth?: boolean
}

export function HeaderBackground({
  showGradient = true,
  showSwirls = true,
  gradientClassName = 'pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-br from-primary-400/10 via-fuchsia-400/5 to-transparent blur-2xl',
  swirlClassName = 'pointer-events-none swirl-pattern',
  style,
  mode = 'pattern',
  fullWidth = true,
}: HeaderBackgroundProps) {
  return (
    <>
      {showGradient && (
        <div aria-hidden="true" className={gradientClassName + (fullWidth ? ' left-0 right-0' : '')} style={style} />
      )}
      {showSwirls && (
        mode === 'pattern' ? (
          <div aria-hidden="true" className={swirlClassName + (fullWidth ? ' left-0 right-0' : '')} />
        ) : (
          <ScatterSwirls
            imageSrc="/images/logos/logo-swirl.png"
            count={32}
            minSize={30}
            maxSize={51}
            opacityMin={0.18}
            opacityMax={0.33}
            className={`absolute ${fullWidth ? 'inset-x-0' : ''} inset-y-0 pointer-events-none`}
            style={{
              mixBlendMode: 'soft-light',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 6%, rgba(0,0,0,0.6) 22%, rgba(0,0,0,1) 100%)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 6%, rgba(0,0,0,0.6) 22%, rgba(0,0,0,1) 100%)',
            }}
          />
        )
      )}
    </>
  )
}


