import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

export type ScatterSwirlsProps = {
  imageSrc: string
  count?: number
  minSize?: number
  maxSize?: number
  opacityMin?: number
  opacityMax?: number
  areaPadding?: number
  seed?: number
  className?: string
  style?: CSSProperties
}

type Swirl = {
  x: number
  y: number
  size: number
  rotation: number
  opacity: number
  flip: boolean
}

function createSeededRng(seed: number) {
  let t = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0
  return function rng() {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function ScatterSwirls({
  imageSrc,
  count = 28,
  minSize = 14,
  maxSize = 24,
  opacityMin = 0.06,
  opacityMax = 0.10,
  areaPadding = 8,
  seed = 42,
  className = 'absolute inset-0 pointer-events-none',
  style,
}: ScatterSwirlsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      const cr = entry.contentRect
      setSize({ width: Math.round(cr.width), height: Math.round(cr.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const swirls = useMemo<Swirl[]>(() => {
    const { width, height } = size
    if (!width || !height) return []

    const rng = createSeededRng(seed)
    const results: Swirl[] = []
    const spacing = 6
    const maxAttempts = count * 12

    for (let i = 0; i < maxAttempts && results.length < count; i++) {
      const proposedSize = minSize + rng() * (maxSize - minSize)
      const x = areaPadding + rng() * Math.max(0, width - areaPadding * 2)
      const y = areaPadding + rng() * Math.max(0, height - areaPadding * 2)
      const rotation = rng() * 360
      const opacity = opacityMin + rng() * (opacityMax - opacityMin)
      const flip = rng() > 0.5

      // avoid obvious overlaps
      let overlaps = false
      const r = proposedSize / 2
      for (const existing of results) {
        const dx = x - existing.x
        const dy = y - existing.y
        const minDist = r + existing.size / 2 + spacing
        if (dx * dx + dy * dy < minDist * minDist) { overlaps = true; break }
      }
      if (!overlaps) {
        results.push({ x, y, size: proposedSize, rotation, opacity, flip })
      }
    }
    return results
  }, [size, count, minSize, maxSize, opacityMin, opacityMax, areaPadding, seed])

  return (
    <div ref={containerRef} className={className} style={style}>
      {swirls.map((swirl, idx) => (
        <img
          key={idx}
          src={imageSrc}
          alt=""
          className="absolute select-none swirl-item"
          style={{
            left: swirl.x,
            top: swirl.y,
            width: Math.round(swirl.size),
            height: Math.round(swirl.size),
            opacity: swirl.opacity,
            transform: `translate(-50%, -50%) rotate(${swirl.rotation}deg) scaleX(${swirl.flip ? -1 : 1})`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}


