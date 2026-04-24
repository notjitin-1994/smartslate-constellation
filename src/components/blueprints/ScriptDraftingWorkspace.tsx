/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
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

// --- SUB-COMPONENT: NEURAL VISUALIZATION ---
const NeuralVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{ x: number, y: number, vx: number, vy: number }> = [];
    
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(167, 218, 219, 0.15)';
      ctx.fillStyle = 'rgba(167, 218, 219, 0.5)';

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.lineWidth = 1 - dist / 100;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />;
};

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
        results.push({
          id: `intro-${index}`,
          type: '[NARRATION]', 
          content: trimmed,
          title: 'Orchestration Note'
        });
      }
    });

    if (currentArtifact) results.push(currentArtifact as Artifact);
    return results;
  }, [content]);

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
      
      {/* --- FLOATING METRIC HUD --- */}
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
      <div className="w-full max-w-[95%] mx-auto px-4 lg:px-0">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-3 grid-flow-dense gap-8 py-12">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className={`h-64 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] animate-pulse ${i === 1 ? 'md:col-span-2' : ''}`} />
               ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 grid-flow-dense gap-8 pb-40"
            >
              {artifacts.map((art, idx) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -8, scale: 1.005, transition: { duration: 0.3 } }}
                  className={`
                    relative overflow-hidden group rounded-[3rem] p-10
                    bg-white/[0.015] backdrop-blur-3xl border
                    ${getCardStyle(art.type)}
                    transition-all duration-700 hover:bg-white/[0.03]
                    shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[#A7DADB]/5
                  `}
                >
                  {/* Card Glow Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A7DADB]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:border-[#A7DADB]/30 transition-all shadow-inner">
                        {getTypeIcon(art.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A7DADB]/30 group-hover:text-[#A7DADB]/60 transition-colors">
                          {art.type.replace('[', '').replace(']', '')}
                        </span>
                        {art.title && <span className="text-xs font-bold text-white tracking-tight">{art.title}</span>}
                      </div>
                    </div>
                    <IconButton size="small" sx={{ color: 'white/[0.05]', '&:hover': { color: '#A7DADB', bgcolor: 'white/[0.05]' } }}><Maximize2 size={14} /></IconButton>
                  </div>

                  {/* Content Area */}
                  <div className="relative z-10">
                    {art.type === '[VISUAL]' && (
                      <div className="aspect-video w-full rounded-[2rem] bg-black/60 border border-white/5 flex items-center justify-center mb-8 relative overflow-hidden group/viz shadow-2xl">
                        <NeuralVisualization />
                        <div className="absolute top-4 left-6 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-[#A7DADB]/20 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#A7DADB] animate-ping" />
                           <span className="text-[8px] font-black text-[#A7DADB] uppercase tracking-[0.2em]">Procedural Engine Active</span>
                        </div>
                        <div className="text-[9px] font-black text-[#A7DADB]/20 uppercase tracking-[0.5em] group-hover/viz:text-[#A7DADB]/40 transition-colors relative z-10">Live Constellation Frame</div>
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent opacity-60" />
                      </div>
                    )}

                    <div className={`
                      ${art.type === '[NARRATION]' ? 'text-2xl font-light leading-relaxed text-white/90' : 'text-[15px] text-slate-400 leading-relaxed'}
                      ${art.type === '[SPEAKER_NOTES]' ? 'text-sm text-slate-500 italic border-l border-white/10 pl-6 py-2' : ''}
                      ${art.type === '[BRANCHING]' ? 'font-mono text-[13px] bg-black/40 p-6 rounded-2xl border border-white/5 text-slate-300' : ''}
                      whitespace-pre-wrap
                    `}>
                      {art.content}
                    </div>

                    {art.type === '[ACTIVITY]' && (
                      <button className="mt-12 w-full py-5 bg-[#4F46E5] text-white rounded-[1.5rem] flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/20 hover:bg-[#4F46E5] hover:scale-[1.02] active:scale-[0.98] transition-all group/btn">
                        <Play size={14} fill="currentColor" className="group-hover/btn:translate-x-0.5 transition-transform" /> 
                        Deploy Simulation
                      </button>
                    )}
                  </div>

                  {/* Corner Accent Branding */}
                  <div className="absolute bottom-6 right-10 opacity-5 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-1000">
                    <Workflow size={60} className="text-[#A7DADB]" />
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
        BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(40px)', bgcolor: 'rgba(2, 6, 23, 0.98)' } }}
      >
        <Fade in={isInsightOpen}>
          <Box sx={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '95%', maxWidth: '800px', maxHeight: '85vh',
            bgcolor: '#020617', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '60px',
            p: 10, outline: 'none', overflowY: 'auto', boxShadow: '0 0 100px rgba(0,0,0,0.8)'
          }}>
            <div className="flex justify-between items-center mb-20">
               <div className="flex items-center gap-8">
                  <div className="p-5 rounded-[2rem] bg-[#A7DADB]/10 border border-[#A7DADB]/20 shadow-2xl">
                    <Activity size={32} className="text-[#A7DADB]" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">Knowledge Verification</h2>
                    <p className="text-[11px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Strategic Integrity Protocol</p>
                  </div>
               </div>
               <IconButton onClick={() => setIsInsightOpen(false)} sx={{ color: 'slate.500', bgcolor: 'white/[0.03]', p: 3, borderRadius: '24px' }}><X size={28} /></IconButton>
            </div>

            <div className="space-y-24">
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <History size={16} className="text-[#A7DADB]" />
                  <h4 className="text-[11px] text-slate-500 uppercase tracking-[0.5em] font-black">Semantic Integrity Pass</h4>
                </div>
                <div className="p-12 rounded-[3rem] bg-white/[0.01] border border-white/[0.05] relative overflow-hidden backdrop-blur-3xl shadow-inner">
                   <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#A7DADB]/40 to-transparent" />
                   <p className="text-lg text-slate-300 leading-relaxed font-light italic">
                      {semanticDelta || "Synthesizing truth anchors..."}
                   </p>
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <BookOpen size={16} className="text-[#A7DADB]" />
                  <h4 className="text-[11px] text-slate-500 uppercase tracking-[0.5em] font-black">Verified Institutional Citations</h4>
                </div>
                <div className="grid grid-cols-1 gap-5">
                   {citations.map((cite, i) => (
                     <div key={i} className="flex gap-8 items-center p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.03] hover:border-[#A7DADB]/20 hover:bg-white/[0.02] transition-all group/cite shadow-sm">
                        <div className="text-[11px] font-mono font-black text-[#A7DADB] bg-[#A7DADB]/10 w-10 h-10 flex items-center justify-center rounded-2xl border border-[#A7DADB]/20 shadow-xl transition-all group-hover/cite:scale-110 group-hover/cite:bg-[#A7DADB] group-hover/cite:text-black">{i + 1}</div>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate group-hover:text-white transition-colors">{cite}</span>
                        <div className="ml-auto w-1 h-1 rounded-full bg-[#A7DADB]/20 group-hover:bg-[#A7DADB] transition-all" />
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
        className="fixed bottom-12 right-12 w-20 h-20 rounded-full bg-[#020617] border border-[#A7DADB]/30 flex items-center justify-center text-[#A7DADB] hover:bg-[#A7DADB] hover:text-black transition-all shadow-2xl backdrop-blur-3xl group z-50 hover:scale-110"
      >
        <ChevronRight size={32} className="-rotate-90 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default ScriptDraftingWorkspace;
