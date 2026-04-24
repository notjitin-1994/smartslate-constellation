/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Activity, 
  History, 
  X, 
  AlertOctagon,
  Fingerprint,
  Mic2,
  ChevronRight,
  Workflow,
  Eye,
  MousePointer2,
  GitBranch,
  StickyNote,
  Maximize2,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton, Modal, Backdrop, Fade, Box, Tooltip, Typography } from '@mui/material';

interface Artifact {
  id: string;
  type: '[VISUAL]' | '[NARRATION]' | '[ACTIVITY]' | '[BRANCHING]' | '[SPEAKER_NOTES]';
  content: string;
  title?: string;
}

interface ScriptDraftingWorkspaceProps {
  content: string;
  groundingScore: number;
  cognitiveLoadScore: number;
  hallucinationFlag: boolean;
  semanticDelta?: string;
  citations: string[];
  isLoading: boolean;
}

const ScriptDraftingWorkspace: React.FC<ScriptDraftingWorkspaceProps> = ({
  content,
  groundingScore,
  cognitiveLoadScore,
  hallucinationFlag,
  semanticDelta,
  citations,
  isLoading
}) => {
  const [isInsightOpen, setIsInsightOpen] = useState(false);

  // --- PARSE MARKDOWN INTO BENTO ARTIFACTS ---
  const artifacts = useMemo(() => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const results: Artifact[] = [];
    let currentArtifact: Partial<Artifact> | null = null;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const typeMatch = trimmed.match(/^\[(VISUAL|NARRATION|ACTIVITY|BRANCHING|SPEAKER_NOTES)\]/);
      
      if (typeMatch) {
        if (currentArtifact) results.push(currentArtifact as Artifact);
        
        const type = `[${typeMatch[1]}]` as Artifact['type'];
        currentArtifact = {
          id: `artifact-${index}`,
          type,
          content: trimmed.replace(/^\[.*?\]:?/, '').trim()
        };
      } else if (currentArtifact && trimmed) {
        currentArtifact.content += `\n${trimmed}`;
      } else if (trimmed && !currentArtifact) {
        // Handle introductory text or titles
        results.push({
          id: `intro-${index}`,
          type: '[NARRATION]', // Fallback to narration style for general text
          content: trimmed,
          title: 'Orchestration Note'
        });
      }
    });

    if (currentArtifact) results.push(currentArtifact as Artifact);
    return results;
  }, [content]);

  // --- Tooltip Content Helpers ---
  const TooltipContent = ({ title, body }: { title: string, body: string }) => (
    <Box sx={{ p: 1.5, maxWidth: 280 }}>
      <Typography variant="caption" sx={{ fontStyle: 'normal', fontWeight: 900, color: '#A7DADB', textTransform: 'uppercase', display: 'block', mb: 1, letterSpacing: '0.1em' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', lineHeight: 1.6, fontWeight: 500 }}>
        {body}
      </Typography>
    </Box>
  );

  const getTypeIcon = (type: Artifact['type']) => {
    switch (type) {
      case '[VISUAL]': return <Eye size={18} className="text-[#A7DADB]" />;
      case '[NARRATION]': return <Mic2 size={18} className="text-[#A7DADB]" />;
      case '[ACTIVITY]': return <MousePointer2 size={18} className="text-[#A7DADB]" />;
      case '[BRANCHING]': return <GitBranch size={18} className="text-[#A7DADB]" />;
      case '[SPEAKER_NOTES]': return <StickyNote size={18} className="text-[#64748B]" />;
      default: return <Workflow size={18} className="text-[#A7DADB]" />;
    }
  };

  const getCardStyle = (type: Artifact['type']) => {
    switch (type) {
      case '[VISUAL]': return "md:col-span-2 md:row-span-1 border-[#A7DADB]/20";
      case '[NARRATION]': return "md:col-span-2 md:row-span-1 border-white/10 bg-white/[0.01]";
      case '[ACTIVITY]': return "md:col-span-1 md:row-span-2 border-indigo-500/30 bg-indigo-500/[0.02]";
      case '[BRANCHING]': return "md:col-span-2 md:row-span-1 border-[#A7DADB]/40 font-mono";
      case '[SPEAKER_NOTES]': return "md:col-span-1 md:row-span-1 border-white/5 bg-white/[0.005]";
      default: return "md:col-span-1 border-white/10";
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      
      {/* --- FLOATING METRIC HUD (Refined Glassmorphic) --- */}
      <div className="sticky top-0 py-6 mb-12 z-40">
        <div className="max-w-fit mx-auto px-10 py-4 rounded-[2rem] border border-[#A7DADB]/20 bg-[#020617]/80 backdrop-blur-3xl shadow-2xl flex items-center gap-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#A7DADB]/5 pointer-events-none" />
          
          <div className="flex items-center gap-10 relative z-10">
            <Tooltip enterTouchDelay={0} title={<TooltipContent title="Integrity Guardian" body="Deterministic verification via semantic truth-anchoring." />}>
              <div className="flex items-center gap-4 group cursor-help">
                <div className={`flex items-center justify-center w-10 h-10 rounded-2xl ${hallucinationFlag ? 'bg-rose-500/10 text-rose-500' : 'bg-[#A7DADB]/10 text-[#A7DADB]'} border ${hallucinationFlag ? 'border-rose-500/20' : 'border-[#A7DADB]/20'} shadow-lg`}>
                  {hallucinationFlag ? <AlertOctagon size={18} className="animate-pulse" /> : <Fingerprint size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A7DADB]/50 mb-1">Integrity</span>
                  <span className={`text-xs font-black uppercase tracking-widest ${hallucinationFlag ? 'text-rose-500' : 'text-[#A7DADB]'}`}>
                    {hallucinationFlag ? 'Flagged' : 'Verified'}
                  </span>
                </div>
              </div>
            </Tooltip>

            <div className="h-8 w-px bg-white/[0.05]" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A7DADB]/50">Grounding</span>
                <span className="text-[10px] font-mono font-black text-white">{groundingScore}/10</span>
              </div>
              <div className="w-24 h-1 rounded-full bg-white/[0.03] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${groundingScore * 10}%` }} className="h-full bg-emerald-500" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A7DADB]/50">Cognitive</span>
                <span className="text-[10px] font-mono font-black text-white">{cognitiveLoadScore}/10</span>
              </div>
              <div className="w-24 h-1 rounded-full bg-white/[0.03] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${cognitiveLoadScore * 10}%` }} className="h-full bg-[#4F46E5]" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsInsightOpen(true)}
            className="px-6 py-2 rounded-xl bg-[#A7DADB]/5 border border-[#A7DADB]/10 text-[10px] font-black text-[#A7DADB] uppercase tracking-[0.2em] hover:bg-[#A7DADB] hover:text-black transition-all"
          >
            Verification Ledger
          </button>
        </div>
      </div>

      {/* --- BENTO GRID ARTIFACTS --- */}
      <div className="w-full max-w-7xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className={`h-64 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] animate-pulse ${i === 1 ? 'md:col-span-2' : ''}`} />
               ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-40"
            >
              {artifacts.map((art, idx) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className={`
                    relative overflow-hidden group rounded-[2.5rem] p-8
                    bg-white/[0.015] backdrop-blur-2xl border
                    ${getCardStyle(art.type)}
                    transition-all duration-500 hover:bg-white/[0.03]
                  `}
                >
                  {/* Card Glow */}
                  <div className="absolute inset-0 bg-[#A7DADB]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:border-[#A7DADB]/30 transition-all">
                        {getTypeIcon(art.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A7DADB]/40">
                          {art.type.replace('[', '').replace(']', '')}
                        </span>
                        {art.title && <span className="text-xs font-bold text-white">{art.title}</span>}
                      </div>
                    </div>
                    <IconButton size="small" sx={{ color: 'white/[0.1]', '&:hover': { color: '#A7DADB' } }}><Maximize2 size={14} /></IconButton>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {art.type === '[VISUAL]' && (
                      <div className="aspect-video w-full rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center mb-6 relative overflow-hidden">
                        <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Procedural Visualization</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}

                    <div className={`
                      ${art.type === '[NARRATION]' ? 'text-2xl font-light leading-relaxed text-white' : 'text-base text-slate-300 leading-relaxed'}
                      ${art.type === '[SPEAKER_NOTES]' ? 'text-sm text-slate-500 italic' : ''}
                      ${art.type === '[BRANCHING]' ? 'font-mono text-sm bg-black/20 p-4 rounded-xl border border-white/5' : ''}
                    `}>
                      {art.content}
                    </div>

                    {art.type === '[ACTIVITY]' && (
                      <button className="mt-10 w-full py-4 bg-[#4F46E5] text-white rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all">
                        <Play size={14} fill="currentColor" /> Launch Simulation
                      </button>
                    )}
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute bottom-4 right-8 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Workflow size={40} className="text-[#A7DADB]" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- KNOWLEDGE VERIFICATION MODAL --- */}
      <Modal
        open={isInsightOpen}
        onClose={() => setIsInsightOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(25px)', bgcolor: 'rgba(2, 6, 23, 0.95)' } }}
      >
        <Fade in={isInsightOpen}>
          <Box sx={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: '700px', maxHeight: '85vh',
            bgcolor: '#020617', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '48px',
            p: 8, outline: 'none', overflowY: 'auto'
          }}>
            <div className="flex justify-between items-center mb-16">
               <div className="flex items-center gap-6">
                  <div className="p-4 rounded-3xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 shadow-lg shadow-[#A7DADB]/5">
                    <Activity size={28} className="text-[#A7DADB]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-1">Knowledge Verification</h2>
                    <p className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.3em]">Master Integrity Ledger</p>
                  </div>
               </div>
               <IconButton onClick={() => setIsInsightOpen(false)} sx={{ color: 'slate.500', bgcolor: 'white/[0.03]', p: 2 }}><X size={24} /></IconButton>
            </div>

            <div className="space-y-16">
              <section className="space-y-6">
                <h4 className="text-[10px] text-slate-600 uppercase tracking-[0.4em] font-black flex items-center gap-4">
                   <History size={14} className="text-[#A7DADB]" /> Semantic Integrity Pass
                </h4>
                <div className="p-10 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.05] relative overflow-hidden backdrop-blur-md">
                   <div className="absolute top-0 left-0 w-1 h-full bg-[#A7DADB]/30" />
                   <p className="text-base text-slate-400 leading-relaxed font-light italic">
                      {semanticDelta || "Synthesizing truth anchors..."}
                   </p>
                </div>
              </section>

              <section className="space-y-6">
                <h4 className="text-[10px] text-slate-600 uppercase tracking-[0.4em] font-black flex items-center gap-4">
                   <BookOpen size={14} className="text-[#A7DADB]" /> Verified Institutional Citations
                </h4>
                <div className="grid grid-cols-1 gap-4">
                   {citations.map((cite, i) => (
                     <div key={i} className="flex gap-6 items-center p-6 rounded-[2rem] bg-white/[0.01] border border-white/[0.05] hover:border-[#A7DADB]/20 transition-all group/cite">
                        <div className="text-[10px] font-mono font-black text-[#A7DADB] bg-[#A7DADB]/10 w-8 h-8 flex items-center justify-center rounded-xl border border-[#A7DADB]/20 shadow-md transition-all group-hover/cite:scale-110">{i + 1}</div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate">{cite}</span>
                     </div>
                   ))}
                </div>
              </section>
            </div>
          </Box>
        </Fade>
      </Modal>

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-10 right-10 w-16 h-16 rounded-full bg-[#020617] border border-[#A7DADB]/30 flex items-center justify-center text-[#A7DADB] hover:bg-[#A7DADB] hover:text-black transition-all shadow-2xl backdrop-blur-3xl group z-50"
      >
        <ChevronRight size={28} className="-rotate-90 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default ScriptDraftingWorkspace;
