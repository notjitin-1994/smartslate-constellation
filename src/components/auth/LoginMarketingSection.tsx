'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon } from 'lucide-react';
import { personasData } from './personasData';
import type { PersonaType } from './types';

export function LoginMarketingSection() {
  const [activePersona, setActivePersona] = useState<PersonaType>(personasData[0].id);
  const currentPersona = personasData.find((p) => p.id === activePersona) || personasData[0];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="relative z-10 mb-4 xl:mb-6">
        <img src="/logo.png" alt="Smartslate" className="h-7 xl:h-8 w-auto" />
      </div>

      <div className="relative z-10 mb-6 xl:mb-8 text-left">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-heading mb-3 text-2xl leading-tight font-bold text-white xl:text-3xl 2xl:text-4xl">
            Transform Learning Design
            <span className="relative mt-1 block text-primary">from Weeks to Hours</span>
          </h1>
        </motion.div>
        <motion.p className="max-w-lg text-sm leading-relaxed text-white/70 xl:text-base" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          AI-assisted Learning Experience Design for professionals. Select your role to see how Polaris optimizes your workflow:
        </motion.p>
      </div>

      <nav role="tablist" className="relative z-10 mb-6 xl:mb-8">
        <div className="relative rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
          <div className="scrollbar-none flex gap-0.5 overflow-x-auto">
            {personasData.map((persona) => {
              const isActive = activePersona === persona.id;
              return (
                <button key={persona.id} role="tab" aria-selected={isActive} onClick={() => setActivePersona(persona.id)} className={`relative flex min-w-[90px] flex-1 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-center transition-all duration-200 ${isActive ? 'text-[#020C1B]' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}>
                  {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 rounded-lg bg-primary shadow-lg shadow-primary/20" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                  <span className="font-heading relative z-10 text-[10px] font-bold tracking-tight xl:text-[11px]">{persona.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activePersona} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }} className="flex h-full flex-col">
            <div className="mb-6 flex items-center gap-3 xl:mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-xl xl:h-12 xl:w-12">{currentPersona.icon}</div>
              <div>
                <h2 className="font-heading text-lg font-bold text-primary xl:text-xl">{currentPersona.title}</h2>
                <p className="text-xs font-medium text-white/60 xl:text-sm">{currentPersona.subtitle}</p>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden xl:grid-cols-[1fr_200px] 2xl:grid-cols-[1fr_240px]">
              <div className="flex flex-col overflow-hidden">
                <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-widest text-primary uppercase xl:text-xs">
                  <span className="h-px w-6 bg-primary/50" />Key Benefits
                </h3>
                <ul className="scrollbar-thin space-y-1 overflow-y-auto pr-2 xl:space-y-2">
                  {currentPersona.benefits.slice(0, 5).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-lg py-1 xl:py-1.5">
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
                      <span className="text-xs leading-snug text-white/80 xl:text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col">
                <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-widest text-primary uppercase xl:text-xs">
                  <span className="h-px w-6 bg-primary/50" />Impact
                </h3>
                <div className="grid grid-cols-2 gap-3 xl:flex xl:flex-col">
                  {currentPersona.stats.map((stat, i) => (
                    <div key={i} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 xl:p-4">
                      <div className="text-xl font-black text-primary xl:text-2xl 2xl:text-3xl">{stat.value}<span className="text-sm xl:text-base">{stat.suffix}</span></div>
                      <div className="text-[9px] font-bold text-white/50 uppercase xl:text-[10px]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
