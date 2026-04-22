// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)

"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Layout, 
  Hexagon
} from 'lucide-react';
import Image from 'next/image';

const glassStyles: React.CSSProperties = {
  background: 'rgba(13, 27, 42, 0.55)',
  backdropFilter: 'blur(40px)',
  border: '1px solid rgba(167, 218, 219, 0.12)',
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
};

const BackgroundTrajectory = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg className="w-full h-full opacity-20" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M -100 200 Q 300 150 500 500 T 1100 800"
        fill="none"
        stroke="#A7DADB"
        strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d="M -100 600 Q 400 800 600 400 T 1100 200"
        fill="none"
        stroke="#A7DADB"
        strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.3 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
      />
    </svg>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(124,105,245,0.08),transparent_70%)]" />
  </div>
);

const FeatureItem = ({ icon: Icon, title, desc }: { icon: React.ElementType, title: string, desc: string }) => (
  <div className="group flex gap-5 items-start p-4 rounded-xl transition-colors hover:bg-white/[0.02]">
    <div className="mt-1 p-2.5 rounded-lg bg-[#A7DADB]/10 border border-[#A7DADB]/20 text-[#A7DADB] group-hover:scale-110 transition-transform">
      <Icon size={18} />
    </div>
    <div>
      <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
      <p className="text-white/80 text-xs leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#020C1B] flex flex-col md:flex-row overflow-hidden font-sans text-[#E2E8F0]">
      
      {/* Cinematic Background Video - Shared/Static */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60 blur-[4px] scale-105"
        >
          <source src="/login-bg-new.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-[#020C1B] via-transparent to-[#020C1B] opacity-80" />
      </div>

      <BackgroundTrajectory />

      {/* LEFT PANE: MARKETING EDITORIAL (Shared/Static) */}
      <section className="relative w-full md:w-[50%] lg:w-[50%] flex flex-col z-10">
        <div
          style={{
            ...glassStyles,
            height: '100vh',
            borderRadius: '0',
            borderLeft: 'none',
            borderTop: 'none',
            borderBottom: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
          className="w-full relative"
        >
          {/* Background Image for Marketing Card */}
          <div className="absolute inset-0 z-0 opacity-100">
            <Image 
              src="/marketing-bg.jpg" 
              alt="Architectural context" 
              fill
              priority
              className="object-cover blur-[12px] scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#061B24]/65 via-[#020C1B]/60 to-[#020C1B]/70 z-10" />
          </div>

          <div className="max-w-xl w-full px-12 md:px-16 relative z-30 space-y-10">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white leading-tight font-heading">
                Design the <span className="text-[#A7DADB]">Future of Learning</span>
              </h1>
              <p className="text-white text-lg max-w-md leading-relaxed opacity-90">
                Connect your vision to the Architectural Bridge. Automated workflows for the modern creator.
              </p>
            </div>

            <div className="grid gap-2">
              <FeatureItem 
                icon={Zap} 
                title="ScriptGen Intelligence" 
                desc="Generate production-ready scripts from core learning objectives instantly." 
              />
              <FeatureItem 
                icon={Layout} 
                title="Automated Storyboarding" 
                desc="Translate concepts into visual sequences with precision-mapped assets." 
              />
              <FeatureItem 
                icon={Hexagon} 
                title="Strategic Blueprinting" 
                desc="Map cognitive trajectories through high-fidelity editorial frameworks." 
              />
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT PANE: DYNAMIC CONTENT (Login/Signup Cards) */}
      <section className="relative flex-1 flex items-center justify-center p-6 md:p-12 z-10">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </section>

      {/* FOOTER ACCENT (Shared/Static) */}
      <div className="absolute bottom-6 left-12 md:left-24 z-20 hidden md:block">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#94A3B8] mb-1">Status</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#A7DADB] animate-pulse" />
              <span className="text-[10px] font-mono text-[#A7DADB]">PROTOCOL_READY</span>
            </div>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#94A3B8] mb-1">Version</span>
            <span className="text-[10px] font-mono text-[#E2E8F0]">CONSTELLATION.4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
