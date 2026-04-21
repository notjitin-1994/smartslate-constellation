// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Navigation, 
  Telescope, 
  Users, 
  Ship, 
  Crown,
  ChevronRight,
  Info,
  Check,
  Activity
} from 'lucide-react';
import { Box, Tooltip } from '@mui/material';

// --- Constellation Design System Tokens ---
const THEME = {
  bg: '#020C1B',
  primary: '#7C69F5',
  secondary: '#A7DADB',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  glass: {
    background: 'rgba(124, 105, 245, 0.04)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(124, 105, 245, 0.15)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  }
};

// --- Functional Data Definitions (Polaris V4 Parity) ---
const TIERS = [
  { id: 'free', name: 'Free', icon: ShieldCheck, limit: 1, price: '0', color: '#94A3B8' },
  { id: 'explorer', name: 'Explorer', icon: Telescope, limit: 5, price: '[Price]', color: '#A7DADB' },
  { id: 'navigator', name: 'Navigator', icon: Navigation, limit: 15, price: '[Price]', color: '#7C69F5' },
  { id: 'voyager', name: 'Voyager', icon: Zap, limit: 50, price: '[Price]', color: '#7C69F5' },
  { id: 'crew', name: 'Crew', icon: Users, limit: 200, price: '[Price]', color: '#A7DADB' },
  { id: 'fleet', name: 'Fleet', icon: Ship, limit: 1000, price: '[Price]', color: '#7C69F5' },
  { id: 'armada', name: 'Armada', icon: Crown, limit: '∞', price: '[Custom]', color: '#7C69F5' },
];

// --- Sub-components ---

const PremiumAction = ({ children, onClick, active = false }: { children: React.ReactNode, onClick?: () => void, active?: boolean }) => {
  return (
    <motion.button
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative overflow-hidden px-4 py-2 rounded-md transition-all duration-300 group"
      style={{
        background: active ? THEME.primary : 'rgba(124, 105, 245, 0.1)',
        border: `1px solid ${active ? THEME.secondary : 'rgba(124, 105, 245, 0.3)'}`,
      }}
    >
      {/* Scanning Light Flare */}
      <motion.div
        variants={{
          hover: { left: '100%', transition: { duration: 0.6, ease: "easeInOut" } }
        }}
        initial={{ left: '-100%' }}
        className="absolute top-0 bottom-0 w-1/2 skew-x-12 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(167, 218, 219, 0.2), transparent)',
        }}
      />
      
      {/* Atmospheric Rings (Idle) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 scale-110 border border-indigo-500/20 rounded-md animate-pulse" />
      </div>

      <span className="relative z-10 flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase">
        {children}
        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </span>
    </motion.button>
  );
};

const UsageCircularProgress = ({ used, total, label }: { used: number, total: any, label: string }) => {
  const percentage = typeof total === 'number' ? (used / total) * 100 : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-2xl" style={THEME.glass}>
      <div className="relative flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="rgba(124, 105, 245, 0.1)"
            strokeWidth="4"
            fill="transparent"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            stroke={THEME.primary}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xl font-bold tracking-tighter" style={{ color: THEME.textPrimary }}>
            {used}<span className="text-xs text-slate-500">/{total === '∞' ? '∞' : total}</span>
          </span>
        </div>
        
        {/* Pulsing Core Node Effect */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: THEME.textSecondary }}>{label}</p>
        <div className="mt-1 flex items-center gap-1 justify-center">
          <Activity size={10} className="text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-mono">LIVE_SYNC</span>
        </div>
      </div>
    </div>
  );
};

const TierCard = ({ tier, isCurrent }: { tier: typeof TIERS[0], isCurrent: boolean }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative flex flex-col w-[260px] p-5 rounded-xl border transition-all duration-500 group overflow-hidden"
      style={{
        ...THEME.glass,
        borderColor: isCurrent ? 'rgba(167, 218, 219, 0.4)' : THEME.glass.border,
      }}
    >
      {/* V.4 Badge */}
      <div className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] font-mono text-indigo-300">
        V.4-ALPHA
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ background: `${tier.color}15` }}>
            <tier.icon size={18} style={{ color: tier.color }} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight" style={{ color: THEME.textPrimary }}>{tier.name}</h3>
            {isCurrent && (
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active Tier</span>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tighter" style={{ color: THEME.textPrimary }}>
            {tier.price === '0' ? 'FREE' : tier.price}
          </span>
          {tier.price !== 'FREE' && tier.price !== '[Custom]' && (
            <span className="text-xs" style={{ color: THEME.textSecondary }}>/mo</span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 mb-8">
        <div className="flex items-center justify-between text-[11px]">
          <span style={{ color: THEME.textSecondary }}>Arch. Jobs</span>
          <span className="font-mono" style={{ color: THEME.textPrimary }}>{tier.limit}</span>
        </div>
        <div className="h-px w-full bg-slate-800/50" />
        <ul className="space-y-2">
          {['Global Delivery', 'Blueprint Sync', 'Neural Optim.'].map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-[11px]" style={{ color: THEME.textSecondary }}>
              <Check size={12} className="text-indigo-400" />
              {feat}
            </li>
          ))}
        </ul>
      </div>

      <PremiumAction active={isCurrent}>
        {isCurrent ? 'Current Plan' : 'Select Blueprint'}
      </PremiumAction>
    </motion.div>
  );
};

// --- Main Console Component ---

export default function TierManagementConsole() {
  const [activeTierId] = useState('navigator'); // Mock state

  return (
    <Box sx={{ p: 4, bgcolor: THEME.bg, color: THEME.textPrimary }}>
      {/* Strategic Marketing Space */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-12 p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-indigo-500/10"
        style={{
          background: 'linear-gradient(135deg, rgba(124, 105, 245, 0.08) 0%, rgba(2, 12, 27, 0) 100%)',
        }}
      >
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-widest rounded-full uppercase">
              Constellation Evolution
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-slate-400">
            Scale Your Architectural Horizon
          </h1>
          <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: THEME.textSecondary }}>
            Upgrade to higher tiers to unlock concurrent Blueprint deployments, 
            advanced neural optimization, and real-time fleet synchronization across the Deep Space network.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020C1B] bg-slate-800" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-[#020C1B] bg-indigo-900 flex items-center justify-center text-[10px] font-bold">+12k</div>
            </div>
            <span className="text-[11px] font-medium" style={{ color: THEME.textSecondary }}>
              Architects active in Polaris V4
            </span>
          </div>
        </div>

        {/* Usage Visualization Area */}
        <div className="flex gap-4 relative z-10">
          <UsageCircularProgress used={12} total={15} label="Arch. Jobs Used" />
          <UsageCircularProgress used={2} total={5} label="Fleet Nodes" />
        </div>
      </motion.div>

      {/* Tier Selection Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight">Deployment Blueprint Tiers</h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <AnimatePresence mode="popLayout">
            {TIERS.map((tier, idx) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  x: 0,
                  transition: { delay: idx * 0.05, duration: 0.5, ease: "easeOut" }
                }}
              >
                <TierCard 
                  tier={tier} 
                  isCurrent={tier.id === activeTierId} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Box>
  );
}
