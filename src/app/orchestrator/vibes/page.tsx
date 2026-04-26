"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Search, GitBranch, Layout, ShieldCheck, Terminal, Cpu,
  ArrowUpRight, RefreshCw, Hash, ChevronRight, Layers, Maximize2, 
  MoreHorizontal, Zap, Box as BoxIcon, ArrowRight, Command, Plus,
  Database, Settings2, AlertCircle, Target, Users, Calendar, 
  TrendingUp, Info
} from 'lucide-react';
import { 
  Box, Typography, Tooltip, IconButton, Chip, ThemeProvider, 
  createTheme, CssBaseline, LinearProgress 
} from '@mui/material';

// --- SHARED UTILS & THEME ---
const theme = createTheme({
  palette: { mode: 'dark' },
  typography: { fontFamily: '"Space Grotesk", sans-serif' },
});

// ============================================================================
// VIBE 1: PRISM ARCHITECT (Multi-Agent Progress)
// ============================================================================

const Vibe1 = () => {
  const AGENT_DATA = [
    { id: 'analyst', name: 'Analyst', icon: Search, status: 'processing', progress: 85, task: 'Deconstructing source syllabus', metrics: { tokens: '1.2k', latency: '420ms' } },
    { id: 'mapper', name: 'Mapper', icon: GitBranch, status: 'active', progress: 42, task: 'Generating node hierarchy', metrics: { tokens: '840', latency: '180ms' } },
    { id: 'storyboarder', name: 'Storyboarder', icon: Layout, status: 'pending', progress: 12, task: 'Sequencing visual assets', metrics: { tokens: '0', latency: '0ms' } },
    { id: 'sentinel', name: 'Sentinel', icon: ShieldCheck, status: 'standby', progress: 100, task: 'Monitoring compliance', metrics: { tokens: '2.4k', latency: '12ms' } }
  ];

  return (
    <div className="p-8 bg-[#020617] border-b border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#A7DADB]/5 blur-[120px] -z-10" />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <span className="text-[10px] font-mono text-[#A7DADB] tracking-[0.3em] uppercase">Direction 01</span>
          <h2 className="text-2xl font-bold text-white mt-2">Prism Architect</h2>
          <p className="text-slate-400 text-sm">Glassmorphism & Ultra-thin Teal accents.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {AGENT_DATA.map((agent) => (
            <div key={agent.id} className="p-4 rounded-xl border border-[#A7DADB]/10 bg-white/[0.02] backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <agent.icon className="w-4 h-4 text-[#A7DADB]" />
                <span className="text-sm font-semibold text-slate-100">{agent.name}</span>
              </div>
              <div className="space-y-2">
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${agent.progress}%` }} className="h-full bg-[#A7DADB]" />
                </div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter truncate">{agent.task}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VIBE 2: ZEN MONOLITH (Knowledge Ledger)
// ============================================================================

const Vibe2 = () => {
  return (
    <div className="p-8 bg-[#020617] border-b border-white/5 relative">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
           <span className="text-[10px] font-mono text-indigo-400 tracking-[0.3em] uppercase">Direction 02</span>
           <h2 className="text-2xl font-bold text-white mt-2">Zen Monolith</h2>
           <p className="text-slate-400 text-sm mb-8">Brutalist minimalism with functional Indigo CTAs.</p>
           <div className="space-y-4">
             <div className="flex items-center gap-3 border-l-2 border-indigo-500 pl-4 py-1">
               <span className="text-xs font-mono text-slate-500 italic">01</span>
               <span className="text-sm text-slate-200">Zero-Gradients Enforcement</span>
             </div>
             <div className="flex items-center gap-3 border-l-2 border-slate-800 pl-4 py-1">
               <span className="text-xs font-mono text-slate-500 italic">02</span>
               <span className="text-sm text-slate-200">Obsidian-First Surface Design</span>
             </div>
           </div>
        </div>
        <div className="bg-[#020617] border border-slate-800 rounded-sm overflow-hidden shadow-2xl">
          <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Knowledge Ledger</span>
            <div className="w-2 h-2 bg-indigo-500" />
          </div>
          <div className="p-6 font-mono text-xs text-indigo-300/80 leading-relaxed">
            {`{
  "ledger_id": "0x88921-A",
  "status": "NOMINAL",
  "data_integrity": 1.0,
  "last_sync": "14:40:02"
}`}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VIBE 3: NEURAL BLUEPRINT (Architecture Canvas)
// ============================================================================

const Vibe3 = () => {
  return (
    <div className="p-8 bg-[#0B0E14] border-b border-white/5 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(167, 218, 219, 0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <span className="text-[10px] font-mono text-[#A7DADB] tracking-[0.3em] uppercase">Direction 03</span>
          <h2 className="text-2xl font-bold text-white mt-2">Neural Blueprint</h2>
          <p className="text-slate-400 text-sm">Technical schematics & Interconnected nodes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="relative group p-6 bg-[#141820]/80 border border-[#A7DADB]/10 rounded-sm">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#A7DADB]/40" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-[#A7DADB] rounded-full shadow-[0_0_8px_#A7DADB]" />
                <span className="text-[10px] text-[#A7DADB]/60 font-mono uppercase tracking-widest">Node_0{i}</span>
              </div>
              <h4 className="text-white text-sm font-bold uppercase mb-2">Logical Substructure</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Mapping instructional objectives into a cohesive narrative structure using BLOOMS taxonomy.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VIBE 4: TECHNICAL TERMINAL (Surgical Refinement)
// ============================================================================

const Vibe4 = () => {
  return (
    <div className="p-8 bg-[#020617] border-b border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <span className="text-[10px] font-mono text-[#A7DADB] tracking-[0.3em] uppercase">Direction 04</span>
          <h2 className="text-2xl font-bold text-white mt-2">Technical Terminal</h2>
          <p className="text-slate-400 text-sm">CLI-style precision & Command-driven UI.</p>
        </div>
        <div className="bg-black border border-[#A7DADB]/20 rounded-lg overflow-hidden shadow-3xl">
          <div className="bg-[#A7DADB]/5 px-4 py-2 border-b border-[#A7DADB]/10 flex items-center gap-4">
             <div className="flex gap-1.5">
               <div className="w-2 h-2 rounded-full bg-slate-800" />
               <div className="w-2 h-2 rounded-full bg-slate-800" />
             </div>
             <span className="text-[10px] font-mono text-[#A7DADB]/60 uppercase font-bold tracking-widest">Refinement_Engine_Stream</span>
          </div>
          <div className="p-6 font-mono text-sm space-y-2">
            <p className="text-[#A7DADB]/40">[14:20:01] SYSTEM_INITIALIZED</p>
            <p className="text-[#A7DADB]">{"[AGENT]"} Awaiting surgical refinement input...</p>
            <div className="flex items-center gap-2 mt-4 text-white">
              <span className="text-[#A7DADB]">{">"}</span>
              <span className="animate-pulse">_</span>
              <span className="text-slate-500 italic">type command here...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VIBE 5: STRATEGIC DASHBOARD (Executive Anchors)
// ============================================================================

const Vibe5 = () => {
  return (
    <div className="p-8 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <span className="text-[10px] font-mono text-slate-400 tracking-[0.3em] uppercase">Direction 05</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">Strategic Dashboard</h2>
          <p className="text-slate-500 text-sm">Executive metrics & High-fidelity visibility.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Engagement', val: '92.4%', trend: '+12%' },
            { label: 'Retention', val: '0.88', trend: '+0.4' },
            { label: 'Velocity', val: '14 Days', trend: '-2.1' }
          ].map((kpi, idx) => (
            <div key={idx} className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">{kpi.label}</span>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-light text-slate-900">{kpi.val}</span>
                <span className="text-xs font-bold text-teal-600 mb-1">{kpi.trend}</span>
              </div>
              <div className="h-1 w-full bg-slate-100 mt-6 rounded-full overflow-hidden">
                <div className="h-full bg-[#A7DADB] w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN SELECTION PAGE
// ============================================================================

export default function VibesSelection() {
  const [selectedVibe, setSelectedVibe] = useState<number | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-[#020617] text-white overflow-y-auto selection:bg-[#A7DADB]/30">
        
        {/* TOP NAV */}
        <nav className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#A7DADB] rounded-sm flex items-center justify-center">
              <span className="text-slate-950 font-black text-xs">C</span>
            </div>
            <h1 className="text-sm font-bold tracking-widest uppercase">Constellation <span className="text-[#A7DADB]">Orchestrator</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Select a Visual Direction</span>
             <button className="px-4 py-1.5 bg-[#4F46E5] text-white text-[10px] font-black uppercase tracking-widest rounded-sm">Finalize Design</button>
          </div>
        </nav>

        {/* CONTENT */}
        <div className="pt-16">
          <Vibe1 />
          <Vibe2 />
          <Vibe3 />
          <Vibe4 />
          <Vibe5 />
        </div>

        {/* FOOTER */}
        <footer className="p-12 bg-slate-950 text-center border-t border-white/5">
           <p className="text-xs text-slate-500 font-mono uppercase tracking-[0.5em]">End of Visualization</p>
        </footer>

      </div>
    </ThemeProvider>
  );
}
