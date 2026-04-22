'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type Tier = 'mobile' | 'tablet' | 'desktop' | 'ultra';

type Swirl = {
  id: number;
  x: number;
  y: number;
  sizeVw: number;
  opacity: number;
  rotate: number;
  z: number;
};

type SwirlBackgroundProps = {
  className?: string;
};

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

const SwirlBackground = memo(({ className = '' }: SwirlBackgroundProps) => {
  const [tier, setTier] = useState<Tier>('desktop');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const getTier = (w: number): Tier => {
      if (w < 640) return 'mobile';
      if (w < 1024) return 'tablet';
      if (w < 1536) return 'desktop';
      return 'ultra';
    };
    const update = () => setTier(getTier(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = useMemo(() => {
    switch (tier) {
      case 'mobile':
        return { countMin: 6, countMax: 9, sizeMin: 8, sizeMax: 14, opacityMin: 0.5, opacityMax: 1.0, margin: 1.8 };
      case 'tablet':
        return { countMin: 9, countMax: 13, sizeMin: 6, sizeMax: 11, opacityMin: 0.5, opacityMax: 1.0, margin: 1.6 };
      case 'ultra':
        return { countMin: 14, countMax: 20, sizeMin: 4, sizeMax: 8.5, opacityMin: 0.5, opacityMax: 1.0, margin: 1.5 };
      case 'desktop':
      default:
        return { countMin: 12, countMax: 18, sizeMin: 5, sizeMax: 9, opacityMin: 0.5, opacityMax: 1.0, margin: 1.6 };
    }
  }, [tier]);

  const swirls = useMemo(() => {
    if (!mounted) return [] as Swirl[];
    const placed: Swirl[] = [];
    const targetCount = pickInt(config.countMin, config.countMax);
    const maxAttempts = 2500;
    let attempts = 0;
    while (placed.length < targetCount && attempts < maxAttempts) {
      attempts += 1;
      const sizeVw = randomBetween(config.sizeMin, config.sizeMax);
      const radius = sizeVw / 2;
      const x = randomBetween(radius + 1, 100 - radius - 1);
      const y = randomBetween(radius + 1, 100 - radius - 1);
      const opacity = randomBetween(config.opacityMin, config.opacityMax);
      const rotate = randomBetween(-20, 20);
      const z = Math.random() < 0.45 ? 0 : 1;

      let intersects = false;
      for (const s of placed) {
        const dx = x - s.x;
        const dy = y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minSep = radius + s.sizeVw / 2 + config.margin;
        if (dist < minSep) {
          intersects = true;
          break;
        }
      }
      if (intersects) continue;
      if (placed.some((s) => Math.abs(s.y - y) < 6 && Math.abs(s.x - x) < 12)) continue;
      placed.push({ id: placed.length + 1, x, y, sizeVw, opacity, rotate, z });
    }
    return placed;
  }, [mounted, config]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`} aria-hidden suppressHydrationWarning>
      {swirls.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.sizeVw}vw`,
            height: `${s.sizeVw}vw`,
            opacity: s.opacity,
            transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
            filter: 'blur(0.4px) saturate(0.95)',
            mixBlendMode: 'soft-light',
            zIndex: s.z,
          }}
        >
          <Image
            src="/logo-swirl.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
});

SwirlBackground.displayName = 'SwirlBackground';
export default SwirlBackground;
