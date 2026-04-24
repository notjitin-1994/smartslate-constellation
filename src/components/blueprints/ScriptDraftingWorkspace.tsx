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
  GitMerge,
  FileEdit,
  ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton, Modal, Backdrop, Fade, Box } from '@mui/material';

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

  return (
    <div className="flex flex-col w-full relative">
      
      {/* --- FLOATING METRIC HUD (Teal Accents) --- */}
      <div className="flex items-center justify-between py-6 mb-12 border-b border-white/[0.03] sticky top-0 bg-[#020617]/80 backdrop-blur-3xl z-30">
        <div className="flex items-center gap-10">
           <div className="flex items-center gap-4 group cursor-default">
             <div className={`flex items-center justify-center w-10 h-10 rounded-2xl ${hallucinationFlag ? 'bg-rose-500/10 text-rose-500' : 'bg-[#A7DADB]/10 text-[#A7DADB]'} border ${hallucinationFlag ? 'border-rose-500/20' : 'border-[#A7DADB]/20'} shadow-lg`}>
               {hallucinationFlag ? <AlertOctagon size={18} className="animate-pulse" /> : <Fingerprint size={18} />}
             </div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mb-0.5">Integrity Pass</span>
               <span className={`text-xs font-black uppercase tracking-widest ${hallucinationFlag ? 'text-rose-500' : 'text-[#A7DADB]'}`}>
                 {hallucinationFlag ? 'Flagged' : 'Verified'}
               </span>
             </div>
           </div>

           <div className="h-8 w-px bg-white/[0.05]" />

           <div className="flex items-center gap-8">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Grounding Density</span>
                  <span className="text-[10px] font-mono font-black text-white">{groundingScore}/10</span>
                </div>
                <div className="w-24 h-1 rounded-full bg-white/[0.03] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${groundingScore * 10}%` }} className={`h-full ${groundingScore > 7 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Cognitive Velocity</span>
                  <span className="text-[10px] font-mono font-black text-white">{cognitiveLoadScore}/10</span>
                </div>
                <div className="w-24 h-1 rounded-full bg-white/[0.03] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cognitiveLoadScore * 10}%` }} className={`h-full ${cognitiveLoadScore < 5 ? 'bg-[#A7DADB]' : 'bg-rose-500'}`} />
                </div>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsInsightOpen(true)}
             className="px-6 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[10px] font-black text-[#A7DADB] uppercase tracking-[0.2em] hover:bg-[#A7DADB]/10 hover:text-white transition-all group"
           >
             Instructional Ledger
           </button>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16 py-12">
               <div className="h-16 w-3/4 bg-white/[0.01] rounded-3xl animate-pulse" />
               <div className="space-y-6">
                 <div className="h-4 w-full bg-white/[0.01] rounded-full animate-pulse" />
                 <div className="h-64 w-full bg-white/[0.01] rounded-[3rem] animate-pulse" />
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
                          <div className="mb-12 p-8 rounded-[2.5rem] border border-amber-500/20 bg-amber-500/[0.02] flex gap-6 items-center">
                            <Search size={24} className="text-amber-500" />
                            <p className="text-xs text-amber-500/80 font-black uppercase tracking-widest">Knowledge Coverage Gap Detected</p>
                          </div>
                        )}
                        <h1 className="text-7xl font-bold text-white tracking-tighter leading-none mb-4">
                          {titleText.replace('!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!', '').trim()}
                        </h1>
                      </div>
                    );
                  },
                  h2: ({children}) => (
                    <h2 className="text-[10px] font-black mt-32 mb-10 text-[#A7DADB] uppercase tracking-[0.5em] flex items-center gap-8">
                      <span className="w-12 h-[1px] bg-[#A7DADB]/30" /> {children} <span className="flex-1 h-[1px] bg-white/[0.03]" />
                    </h2>
                  ),
                  p: ({children}) => {
                    const text = children?.toString() || '';
                    
                    if (text.includes('[VISUAL]')) {
                      return (
                        <div className="my-14 p-10 rounded-[2.5rem] bg-white/[0.01] border border-[#A7DADB]/10 relative group/visual">
                          <div className="flex items-center gap-4 mb-6 text-[#A7DADB]/40">
                             <Monitor size={18} />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Art Direction</span>
                          </div>
                          <p className="text-slate-400 font-light text-lg leading-relaxed italic">
                            {text.replace('[VISUAL]:', '').replace('[VISUAL]', '').trim()}
                          </p>
                        </div>
                      );
                    }

                    if (text.includes('[NARRATION]')) {
                      return (
                        <div className="mb-14 pl-14 relative group/voice">
                          <div className="absolute left-0 top-3 text-[#A7DADB]/10 group-hover/voice:text-[#A7DADB]/30 transition-all">
                            <Mic2 size={32} />
                          </div>
                          <div className="text-[9px] font-black text-[#A7DADB]/30 uppercase tracking-[0.3em] mb-3">Spoken Payload</div>
                          <p className="text-white text-2xl font-light leading-[1.6] tracking-tight">
                            {text.replace('[NARRATION]:', '').replace('[NARRATION]', '').trim()}
                          </p>
                        </div>
                      );
                    }

                    if (text.includes('[ACTIVITY]')) {
                      return (
                        <div className="my-16 p-12 rounded-[3rem] bg-[#A7DADB]/[0.02] border border-[#A7DADB]/10 shadow-2xl">
                          <div className="flex items-center gap-4 mb-6 text-[#A7DADB]">
                             <Zap size={20} fill="currentColor" />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Engagement Protocol</span>
                          </div>
                          <p className="text-slate-200 font-medium text-xl leading-relaxed">
                            {text.replace('[ACTIVITY]:', '').replace('[ACTIVITY]', '').trim()}
                          </p>
                        </div>
                      );
                    }

                    if (text.includes('[BRANCHING]')) {
                      return (
                        <div className="my-14 p-8 rounded-[2rem] border border-white/[0.05] bg-white/[0.01]">
                          <div className="flex items-center gap-4 mb-5 text-[#A7DADB]/60">
                             <GitMerge size={18} />
                             <span className="text-[9px] font-black uppercase tracking-[0.3em]">Logic Path</span>
                          </div>
                          <div className="text-slate-400 font-mono text-xs leading-relaxed">
                            {text.replace('[BRANCHING]:', '').replace('[BRANCHING]', '').trim()}
                          </div>
                        </div>
                      );
                    }

                    if (text.includes('[SPEAKER_NOTES]')) {
                      return (
                        <div className="my-10 p-6 rounded-2xl bg-white/[0.01] border border-white/[0.05] flex gap-5 items-start">
                           <FileEdit size={16} className="text-slate-600 mt-1" />
                           <p className="text-slate-600 text-sm font-medium leading-relaxed">
                             <span className="text-[9px] font-black mr-3 uppercase tracking-tighter text-slate-500">Note</span>
                             {text.replace('[SPEAKER_NOTES]:', '').replace('[SPEAKER_NOTES]', '').trim()}
                           </p>
                        </div>
                      );
                    }

                    if (text.includes('[MISSING_DATA:')) {
                      const parts = text.split(/(\[MISSING_DATA:.*?\])/g);
                      return (
                        <p className="mb-10 text-slate-300 font-light text-2xl">
                          {parts.map((part, i) => {
                            if (part.startsWith('[MISSING_DATA:')) {
                              const label = part.replace('[MISSING_DATA: ', '').replace('[MISSING_DATA:', '').replace(']', '');
                              return (
                                <span key={i} className="inline-flex px-3 py-1 mx-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                                  {label}
                                </span>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    }
                    return <p className="mb-12 leading-relaxed text-slate-400 font-light text-xl tracking-tight">{children}</p>;
                  },
                  blockquote: ({children}) => (
                    <div className="my-24 p-16 rounded-[3.5rem] bg-white/[0.01] border-l-2 border-[#A7DADB]/20 text-3xl font-light text-[#A7DADB]/80 leading-relaxed italic shadow-2xl">
                      {children}
                    </div>
                  ),
                  ul: ({children}) => <ul className="space-y-8 mb-20">{children}</ul>,
                  li: ({children}) => (
                    <li className="flex gap-8 items-start text-slate-300">
                      <div className="mt-4 w-1.5 h-1.5 rounded-full bg-[#A7DADB]/40 shrink-0" />
                      <span className="text-2xl font-light leading-relaxed">{children}</span>
                    </li>
                  ),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code: ({inline, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="my-20 rounded-[2.5rem] bg-[#010409]/50 border border-white/[0.05] overflow-hidden">
                        <div className="px-8 py-4 bg-white/[0.02] border-b border-white/[0.05] flex justify-between items-center">
                           <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{match?.[1] || 'Manifest'}</span>
                        </div>
                        <pre className="p-10 overflow-x-auto text-lg text-slate-300 font-mono leading-relaxed custom-scrollbar">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-[#A7DADB]/10 px-2 py-0.5 rounded text-[#A7DADB] text-sm font-mono" {...props}>{children}</code>
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
          )}
        </AnimatePresence>
      </div>

      {/* --- INSIGHT LEDGER MODAL (Teal/Obsidian) --- */}
      <Modal
        open={isInsightOpen}
        onClose={() => setIsInsightOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(20px)', bgcolor: 'rgba(2, 6, 23, 0.9)' } }}
      >
        <Fade in={isInsightOpen}>
          <Box sx={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: '600px', maxHeight: '80vh',
            bgcolor: '#0F172A', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '40px',
            p: 6, outline: 'none', overflowY: 'auto', boxShadow: '0 0 100px rgba(0,0,0,0.8)'
          }}>
            <div className="flex justify-between items-center mb-12">
               <div className="flex items-center gap-4">
                  <Activity size={24} className="text-[#A7DADB]" />
                  <h2 className="text-xl font-black text-white uppercase tracking-widest">Instructional Ledger</h2>
               </div>
               <IconButton onClick={() => setIsInsightOpen(false)} sx={{ color: 'slate.500', bgcolor: 'white/[0.03]' }}><X size={20} /></IconButton>
            </div>

            <div className="space-y-12">
              <section className="space-y-5">
                <h4 className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-black flex items-center gap-3">
                  <History size={14} className="text-[#A7DADB]" /> Semantic Integrity
                </h4>
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-[#A7DADB]/20" />
                   <div className="text-sm text-slate-400 leading-relaxed font-medium italic">
                     <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {semanticDelta || "Synthesizing truth anchors..."}
                     </ReactMarkdown>
                   </div>
                </div>
              </section>

              <section className="space-y-5">
                <h4 className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-black flex items-center gap-3">
                  <BookOpen size={14} className="text-[#A7DADB]" /> Verified Citations
                </h4>
                <div className="grid grid-cols-1 gap-3">
                   {citations.map((cite, i) => (
                     <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-white/[0.01] border border-white/[0.05]">
                        <div className="text-[9px] font-mono font-black text-[#A7DADB] bg-[#A7DADB]/10 px-2 py-1 rounded-md">{i + 1}</div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight truncate">{cite}</span>
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
        className="fixed bottom-10 right-10 w-14 h-14 rounded-full bg-white/[0.02] border border-[#A7DADB]/20 flex items-center justify-center text-[#A7DADB] hover:bg-[#A7DADB] hover:text-black transition-all shadow-2xl backdrop-blur-3xl group"
      >
        <ChevronRight size={24} className="-rotate-90 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default ScriptDraftingWorkspace;
