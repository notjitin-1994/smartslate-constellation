/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import { 
  BookOpen, 
  Activity, 
  History, 
  X, 
  Search,
  AlertOctagon,
  Fingerprint,
  Monitor,
  Mic2,
  Zap,
  FileEdit,
  ChevronRight,
  Info,
  Workflow
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton, Modal, Backdrop, Fade, Box, Tooltip, Typography } from '@mui/material';

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

  return (
    <div className="flex flex-col w-full relative">
      
      {/* --- FLOATING METRIC HUD (Refined Glassmorphic) --- */}
      <div className="sticky top-0 py-6 mb-12 z-40">
        <div className="max-w-fit mx-auto px-10 py-4 rounded-[2rem] border border-[#A7DADB]/20 bg-[#0d1b2a]/60 backdrop-blur-2xl shadow-2xl flex items-center gap-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#A7DADB]/5 pointer-events-none" />
          
          <div className="flex items-center gap-10 relative z-10">
            <Tooltip 
              enterTouchDelay={0} leaveTouchDelay={2500}
              title={<TooltipContent title="Hallucination Guardian" body="Measures content purity. 'Verified' means every factual claim is mathematically anchored to your source documents." />}
            >
              <div className="flex items-center gap-4 group cursor-help">
                <div className={`flex items-center justify-center w-10 h-10 rounded-2xl ${hallucinationFlag ? 'bg-rose-500/10 text-rose-500' : 'bg-[#A7DADB]/10 text-[#A7DADB]'} border ${hallucinationFlag ? 'border-rose-500/20' : 'border-[#A7DADB]/20'} shadow-lg transition-transform group-hover:scale-105`}>
                  {hallucinationFlag ? <AlertOctagon size={18} className="animate-pulse" /> : <Fingerprint size={18} />}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none mb-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A7DADB]/50">Integrity</span>
                    <Info size={10} className="text-[#A7DADB]/30" />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${hallucinationFlag ? 'text-rose-500' : 'text-[#A7DADB]'}`}>
                    {hallucinationFlag ? 'Flagged' : 'Verified'}
                  </span>
                </div>
              </div>
            </Tooltip>

            <div className="h-8 w-px bg-white/[0.05]" />

            <Tooltip 
              enterTouchDelay={0} leaveTouchDelay={2500}
              title={<TooltipContent title="Grounding Density" body="Measures document coverage. A high score means the Architect successfully utilized the majority of your provided requirements." />}
            >
              <div className="flex flex-col gap-2 group cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A7DADB]/50">Grounding</span>
                    <Info size={10} className="text-[#A7DADB]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-mono font-black text-white">{groundingScore}/10</span>
                </div>
                <div className="w-24 h-1 rounded-full bg-white/[0.03] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${groundingScore * 10}%` }} className={`h-full ${groundingScore > 7 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
              </div>
            </Tooltip>

            <Tooltip 
              enterTouchDelay={0} leaveTouchDelay={2500}
              title={<TooltipContent title="Cognitive Velocity" body="Measures instructional complexity. Lower scores indicate more digestible, learner-friendly content." />}
            >
              <div className="flex flex-col gap-2 group cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A7DADB]/50">Cognitive</span>
                    <Info size={10} className="text-[#A7DADB]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-mono font-black text-white">{cognitiveLoadScore}/10</span>
                </div>
                <div className="w-24 h-1 rounded-full bg-white/[0.03] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cognitiveLoadScore * 10}%` }} className={`h-full ${cognitiveLoadScore < 5 ? 'bg-[#A7DADB]' : 'bg-rose-500'}`} />
                </div>
              </div>
            </Tooltip>
          </div>

          <div className="flex items-center gap-4 relative z-10">
             <button 
               onClick={() => setIsInsightOpen(true)}
               className="px-6 py-2 rounded-xl bg-[#A7DADB]/5 border border-[#A7DADB]/10 text-[10px] font-black text-[#A7DADB] uppercase tracking-[0.2em] hover:bg-[#A7DADB] hover:text-black transition-all shadow-lg"
             >
               Knowledge Verification
             </button>
          </div>
        </div>
      </div>

      {/* --- SEAMLESS STORYBOARD CONTENT --- */}
      <div className="w-full max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16 py-12">
               <div className="space-y-6">
                 <div className="h-20 w-4/5 bg-white/[0.02] rounded-3xl animate-pulse relative overflow-hidden" />
                 <div className="h-4 w-1/4 bg-[#A7DADB]/5 rounded-full animate-pulse" />
               </div>
               <div className="p-10 rounded-[2.5rem] border border-[#A7DADB]/5 bg-white/[0.01] space-y-4">
                  <div className="h-3 w-32 bg-[#A7DADB]/10 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-white/[0.02] rounded-full" />
                    <div className="h-4 w-3/4 bg-white/[0.02] rounded-full" />
                  </div>
               </div>
               <div className="pl-14 space-y-4 border-l border-white/5">
                  <div className="h-2 w-24 bg-cyan-500/10 rounded-full" />
                  <div className="h-6 w-full bg-white/[0.03] rounded-full" />
               </div>
               <div className="p-12 rounded-[3rem] border border-[#A7DADB]/5 bg-emerald-500/[0.02] space-y-4">
                  <div className="h-4 w-40 bg-emerald-500/10 rounded-full" />
                  <div className="h-4 w-full bg-white/[0.02] rounded-full" />
               </div>
            </motion.div>
          ) : (
            <article className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({children}) => {
                    const titleText = children?.toString() || '';
                    const isGapped = titleText.includes('!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!');
                    return (
                      <div className="mb-24">
                        {isGapped && (
                          <div className="mb-12 p-8 rounded-[2.5rem] border border-amber-500/20 bg-amber-500/[0.02] flex gap-6 items-center backdrop-blur-md">
                            <Search size={24} className="text-amber-500" />
                            <p className="text-xs text-amber-500/80 font-black uppercase tracking-widest">Knowledge Coverage Gap Detected</p>
                          </div>
                        )}
                        <h1 className="text-7xl font-bold text-white tracking-tighter leading-none mb-4 break-words">
                          {titleText.replace('!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!', '').trim()}
                        </h1>
                      </div>
                    );
                  },
                  h2: ({children}) => (
                    <h2 className="text-[10px] font-black mt-32 mb-10 text-[#A7DADB] uppercase tracking-[0.5em] flex items-center gap-8 break-words">
                      <span className="w-12 h-[1px] bg-[#A7DADB]/30" /> {children} <span className="flex-1 h-[1px] bg-white/[0.03]" />
                    </h2>
                  ),
                  p: ({children}) => {
                    const text = children?.toString() || '';
                    
                    if (text.includes('[VISUAL]')) {
                      return (
                        <div className="my-14 p-10 rounded-[2.5rem] bg-white/[0.01] border border-[#A7DADB]/10 relative group/visual w-full overflow-hidden shadow-2xl">
                          <div className="flex items-center gap-4 mb-6 text-[#A7DADB]/40">
                             <Monitor size={18} />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Art Direction</span>
                          </div>
                          <p className="text-slate-400 font-light text-lg leading-relaxed italic break-words">
                            {text.replace('[VISUAL]:', '').replace('[VISUAL]', '').trim()}
                          </p>
                        </div>
                      );
                    }

                    if (text.includes('[NARRATION]')) {
                      return (
                        <div className="mb-14 pl-14 relative group/voice w-full">
                          <div className="absolute left-0 top-3 text-[#A7DADB]/10 group-hover/voice:text-[#A7DADB]/30 transition-all">
                            <Mic2 size={32} />
                          </div>
                          <div className="text-[9px] font-black text-[#A7DADB]/30 uppercase tracking-[0.3em] mb-3 font-mono">Spoken Payload</div>
                          <p className="text-white text-2xl font-light leading-[1.6] tracking-tight break-words">
                            {text.replace('[NARRATION]:', '').replace('[NARRATION]', '').trim()}
                          </p>
                        </div>
                      );
                    }

                    if (text.includes('[ACTIVITY]')) {
                      return (
                        <div className="my-16 p-12 rounded-[3rem] bg-[#A7DADB]/[0.02] border border-[#A7DADB]/10 shadow-2xl w-full overflow-hidden relative">
                          <div className="flex items-center gap-4 mb-6 text-[#A7DADB] relative z-10">
                             <Zap size={20} fill="currentColor" />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Engagement Protocol</span>
                          </div>
                          <p className="text-slate-200 font-medium text-xl leading-relaxed break-words relative z-10">
                            {text.replace('[ACTIVITY]:', '').replace('[ACTIVITY]', '').trim()}
                          </p>
                        </div>
                      );
                    }

                    if (text.includes('[BRANCHING]')) {
                      return (
                        <div className="my-14 p-10 rounded-[2.5rem] border border-[#A7DADB]/20 bg-white/[0.01] w-full overflow-hidden relative group/logic shadow-2xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#A7DADB]/5 to-transparent pointer-events-none" />
                          <div className="flex items-center gap-4 mb-6 text-[#A7DADB] relative z-10">
                             <Workflow size={22} className="group-hover/logic:rotate-90 transition-transform duration-700" />
                             <span className="text-[11px] font-black uppercase tracking-[0.4em]">Architectural Logic</span>
                          </div>
                          <div className="text-slate-300 font-mono text-base leading-relaxed break-words whitespace-pre-wrap relative z-10 pl-6 border-l border-[#A7DADB]/20">
                            {text.replace('[BRANCHING]:', '').replace('[BRANCHING]', '').trim()}
                          </div>
                        </div>
                      );
                    }

                    if (text.includes('[SPEAKER_NOTES]')) {
                      return (
                        <div className="my-10 p-6 rounded-2xl bg-white/[0.01] border border-white/[0.05] flex gap-5 items-start w-full overflow-hidden">
                           <FileEdit size={16} className="text-slate-600 mt-1" />
                           <p className="text-slate-600 text-sm font-medium leading-relaxed break-words">
                             <span className="text-[9px] font-black mr-3 uppercase tracking-tighter text-slate-500 font-mono">Note</span>
                             {text.replace('[SPEAKER_NOTES]:', '').replace('[SPEAKER_NOTES]', '').trim()}
                           </p>
                        </div>
                      );
                    }

                    // --- WRAP STANDARD TEXT IN CONTAINERS ---
                    return (
                      <div className="my-8 p-10 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] transition-all hover:bg-white/[0.02] w-full group/para">
                        <p className="leading-relaxed text-slate-400 font-light text-xl tracking-tight break-words group-hover/para:text-slate-200 transition-colors">
                          {children}
                        </p>
                      </div>
                    );
                  },
                  blockquote: ({children}) => (
                    <div className="my-24 p-16 rounded-[3.5rem] bg-white/[0.01] border-l-2 border-[#A7DADB]/20 text-3xl font-light text-[#A7DADB]/80 leading-relaxed italic shadow-2xl break-words relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#A7DADB]/5 to-transparent pointer-events-none" />
                      <div className="relative z-10">{children}</div>
                    </div>
                  ),
                  li: ({children}) => (
                    <li className="flex gap-8 items-start text-slate-300 break-words w-full group/li">
                      <div className="mt-4 w-1.5 h-1.5 rounded-full bg-[#A7DADB]/40 shrink-0 shadow-[0_0_10px_rgba(167,218,219,0.2)] group-hover/li:bg-[#A7DADB] transition-all" />
                      <span className="text-2xl font-light leading-relaxed flex-1 min-w-0">{children}</span>
                    </li>
                  )
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
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
            bgcolor: '#0F172A', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '48px',
            p: 8, outline: 'none', overflowY: 'auto', boxShadow: '0 0 120px rgba(0,0,0,0.9)'
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
                   <div className="text-base text-slate-400 leading-relaxed font-light italic">
                     <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {semanticDelta || "Synthesizing truth anchors..."}
                     </ReactMarkdown>
                   </div>
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
