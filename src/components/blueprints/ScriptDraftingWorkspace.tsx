// REQUIRED DEPENDENCIES:
// - lucide-react (npm install lucide-react)
// - react-markdown (npm install react-markdown)
// - framer-motion (npm install framer-motion)

"use client";

import React, { useState } from 'react';
import { 
  BookOpen, 
  Quote, 
  Activity, 
  History, 
  X, 
  Search,
  AlertOctagon,
  Fingerprint,
  Cpu,
  Monitor,
  Mic2,
  Zap,
  GitMerge,
  FileEdit,
  Layers,
  ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconButton, 
  Modal, 
  Backdrop, 
  Fade, 
  Box 
} from '@mui/material';

interface ScriptDraftingWorkspaceProps {
  content: string;
  groundingScore: number;
  cognitiveLoadScore: number;
  hallucinationFlag: boolean;
  semanticDelta?: string;
  citations: string[];
  isLoading: boolean;
  onCommit?: () => void;
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
      
      {/* --- FLOATING METRIC HUD --- */}
      <div className="flex items-center justify-between py-6 mb-12 border-b border-white/5 sticky top-0 bg-[#020617]/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-10">
           {/* Integrity Pill */}
           <div className="flex items-center gap-4 group cursor-default">
             <div className={`flex items-center justify-center w-10 h-10 rounded-2xl ${hallucinationFlag ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'} border ${hallucinationFlag ? 'border-rose-500/20' : 'border-emerald-500/20'} transition-all duration-500 group-hover:scale-105 shadow-lg`}>
               {hallucinationFlag ? <AlertOctagon size={18} className="animate-pulse" /> : <Fingerprint size={18} />}
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Integrity</span>
               <span className={`text-sm font-bold tracking-tight ${hallucinationFlag ? 'text-rose-400' : 'text-emerald-400'}`}>
                 {hallucinationFlag ? 'Flagged' : 'Verified'}
               </span>
             </div>
           </div>

           <div className="h-8 w-px bg-white/5" />

           {/* Metrics Cluster */}
           <div className="flex items-center gap-8">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Grounding</span>
                  <span className="text-[10px] font-mono font-bold text-white">{groundingScore}/10</span>
                </div>
                <div className="w-24 h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${groundingScore * 10}%` }} className={`h-full ${groundingScore > 7 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Cognitive</span>
                  <span className="text-[10px] font-mono font-bold text-white">{cognitiveLoadScore}/10</span>
                </div>
                <div className="w-24 h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cognitiveLoadScore * 10}%` }} className={`h-full ${cognitiveLoadScore < 5 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                </div>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsInsightOpen(true)}
             className="flex items-center gap-3 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl group"
           >
             <Layers size={14} className="text-indigo-400 group-hover:rotate-12 transition-transform" /> 
             Insight Ledger
           </button>
        </div>
      </div>

      {/* --- SEAMLESS STORYBOARD CONTENT --- */}
      <div className="w-full max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16 py-12">
               <div className="space-y-4">
                 <div className="h-16 w-3/4 bg-white/[0.02] rounded-3xl animate-pulse" />
                 <div className="h-4 w-1/4 bg-white/[0.01] rounded-full animate-pulse" />
               </div>
               <div className="space-y-6">
                 <div className="h-4 w-full bg-white/[0.01] rounded-full animate-pulse" />
                 <div className="h-4 w-full bg-white/[0.01] rounded-full animate-pulse" />
                 <div className="h-64 w-full bg-white/[0.02] rounded-[3rem] animate-pulse" />
               </div>
            </motion.div>
          ) : (
            <article className="pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({children}) => {
                    const titleText = children?.toString() || '';
                    const isGapped = titleText.includes('!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!');
                    return (
                      <div className="mb-20">
                        {isGapped && (
                          <div className="mb-10 p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 flex gap-6 items-center backdrop-blur-xl">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                              <Search size={24} className="text-amber-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-amber-400 mb-1">Knowledge Coverage Alert</h4>
                              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl font-light italic">This instructional node is currently ungrounded. The Architect has identified critical gaps in the Truth Ledger for this specific module.</p>
                            </div>
                          </div>
                        )}
                        <h1 className="text-6xl font-black text-white tracking-tighter leading-[1.1] bg-gradient-to-br from-white via-white to-slate-600 bg-clip-text text-transparent">
                          {titleText.replace('!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!', '').trim()}
                        </h1>
                      </div>
                    );
                  },
                  h2: ({children}) => (
                    <h2 className="text-[10px] font-black mt-32 mb-10 text-indigo-400 uppercase tracking-[0.5em] flex items-center gap-6">
                      <span className="w-20 h-px bg-gradient-to-r from-transparent to-indigo-500/50" /> 
                      {children}
                      <span className="flex-1 h-px bg-gradient-to-r from-indigo-500/50 to-transparent" />
                    </h2>
                  ),
                  h3: ({children}) => <h3 className="text-2xl font-bold mt-16 mb-8 text-white tracking-tight leading-snug">{children}</h3>,
                  p: ({children}) => {
                    const text = children?.toString() || '';
                    
                    if (text.includes('[VISUAL]')) {
                      return (
                        <div className="my-14 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group/visual hover:bg-white/[0.04] transition-all duration-700 shadow-2xl">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                          <div className="flex items-center gap-4 mb-5 text-indigo-400/70">
                             <Monitor size={18} />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Art Direction</span>
                          </div>
                          <p className="text-slate-300 font-light text-lg leading-relaxed italic tracking-wide">
                            {text.replace('[VISUAL]:', '').replace('[VISUAL]', '').trim()}
                          </p>
                        </div>
                      );
                    }

                    if (text.includes('[NARRATION]')) {
                      return (
                        <div className="mb-14 pl-12 relative group/voice">
                          <div className="absolute left-0 top-3 text-cyan-500/20 group-hover/voice:text-cyan-500 transition-all duration-700">
                            <Mic2 size={32} />
                          </div>
                          <div className="text-[10px] font-black text-cyan-500/40 uppercase tracking-[0.2em] mb-2">Narrator Voice</div>
                          <p className="text-slate-100 text-2xl font-light leading-[1.6] tracking-tight">
                            {text.replace('[NARRATION]:', '').replace('[NARRATION]', '').trim()}
                          </p>
                        </div>
                      );
                    }

                    if (text.includes('[ACTIVITY]')) {
                      return (
                        <div className="my-16 p-10 rounded-[3rem] bg-emerald-500/[0.03] border border-emerald-500/10 shadow-2xl relative overflow-hidden group/act">
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-[60px] rounded-full group-hover/act:scale-150 transition-transform duration-1000" />
                          <div className="flex items-center gap-4 mb-6 text-emerald-400">
                             <Zap size={22} fill="currentColor" />
                             <span className="text-xs font-black uppercase tracking-[0.3em]">Engagement Protocol</span>
                          </div>
                          <p className="text-slate-200 font-medium text-xl leading-relaxed">
                            {text.replace('[ACTIVITY]:', '').replace('[ACTIVITY]', '').trim()}
                          </p>
                        </div>
                      );
                    }

                    if (text.includes('[BRANCHING]')) {
                      return (
                        <div className="my-14 p-8 rounded-[2rem] bg-amber-500/[0.03] border border-amber-500/10 border-dashed backdrop-blur-md">
                          <div className="flex items-center gap-4 mb-4 text-amber-400">
                             <GitMerge size={20} />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Logic Branch</span>
                          </div>
                          <div className="text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                            {text.replace('[BRANCHING]:', '').replace('[BRANCHING]', '').trim()}
                          </div>
                        </div>
                      );
                    }

                    if (text.includes('[SPEAKER_NOTES]')) {
                      return (
                        <div className="my-10 p-6 rounded-2xl bg-white/[0.01] border border-white/5 flex gap-5 items-start">
                           <div className="p-2 rounded-lg bg-white/5 text-slate-500"><FileEdit size={16} /></div>
                           <p className="text-slate-500 text-sm font-medium leading-relaxed">
                             <span className="text-slate-400 font-black mr-2 uppercase tracking-tighter text-[10px]">Producer Directive:</span>
                             {text.replace('[SPEAKER_NOTES]:', '').replace('[SPEAKER_NOTES]', '').trim()}
                           </p>
                        </div>
                      );
                    }

                    if (text.includes('[MISSING_DATA:')) {
                      const parts = text.split(/(\[MISSING_DATA:.*?\])/g);
                      return (
                        <p className="mb-10 leading-relaxed text-slate-300 font-light text-xl">
                          {parts.map((part, i) => {
                            if (part.startsWith('[MISSING_DATA:')) {
                              const label = part.replace('[MISSING_DATA: ', '').replace('[MISSING_DATA:', '').replace(']', '');
                              return (
                                <span key={i} className="inline-flex items-center gap-2 px-3 py-1 mx-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest shadow-lg shadow-rose-500/5">
                                  <Search size={12} /> {label}
                                </span>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    }
                    return <p className="mb-10 leading-relaxed text-slate-400 font-light text-xl tracking-wide">{children}</p>;
                  },
                  blockquote: ({children}) => (
                    <div className="my-20 p-12 rounded-[3.5rem] bg-indigo-500/[0.02] border border-white/5 flex gap-10 relative overflow-hidden group/quote shadow-2xl">
                      <Quote size={48} className="text-indigo-500/10 shrink-0 mt-1" />
                      <div className="text-indigo-100/80 text-3xl font-light leading-relaxed tracking-tight italic">{children}</div>
                    </div>
                  ),
                  strong: ({children}) => <span className="font-bold text-white shadow-[0_1px_0_0_rgba(129,140,248,0.3)]">{children}</span>,
                  ul: ({children}) => <ul className="list-none pl-0 space-y-8 mb-20">{children}</ul>,
                  li: ({children}) => (
                    <li className="flex gap-8 items-start text-slate-300 group/li">
                      <div className="mt-3.5 w-2 h-2 rounded-full bg-indigo-500/30 group-hover/li:bg-indigo-500 transition-colors shrink-0 shadow-[0_0_10px_rgba(129,140,248,0.2)]" />
                      <span className="text-2xl font-light leading-[1.5] tracking-tight">{children}</span>
                    </li>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto my-20 rounded-[2.5rem] border border-white/5 bg-slate-900/10 backdrop-blur-xl shadow-2xl">
                      <table className="w-full text-left border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  th: ({children}) => <th className="p-8 font-black text-indigo-300 bg-white/[0.02] uppercase tracking-[0.3em] text-[10px]">{children}</th>,
                  td: ({children}) => <td className="p-8 text-slate-400 border-t border-white/5 text-xl font-light">{children}</td>,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code: ({inline, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="my-20 rounded-[3rem] bg-[#010409] border border-white/5 overflow-hidden shadow-2xl ring-1 ring-white/5 relative">
                        <div className="px-8 py-5 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <Cpu size={16} className="text-indigo-400" />
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">{match?.[1] || 'Technical Manifest'}</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500/10 border border-rose-500/20" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/10 border border-amber-500/20" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/10 border border-emerald-500/20" />
                          </div>
                        </div>
                        <pre className="p-10 overflow-x-auto text-lg text-indigo-100/90 font-mono leading-relaxed custom-scrollbar">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-indigo-500/10 px-2 py-0.5 rounded-lg text-indigo-300 text-sm font-mono border border-indigo-500/10" {...props}>{children}</code>
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

      {/* --- FLOATING INSIGHT PANEL (Minimalist Overlay) --- */}
      <Modal
        open={isInsightOpen}
        onClose={() => setIsInsightOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(12px)', bgcolor: 'rgba(2, 6, 23, 0.7)' } }}
      >
        <Fade in={isInsightOpen}>
          <Box sx={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: '600px', maxHeight: '80vh',
            bgcolor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '40px',
            p: 6, outline: 'none', overflowY: 'auto', boxShadow: '0 0 80px rgba(0,0,0,0.6)'
          }}>
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                   <Activity size={20} className="text-indigo-400" />
                 </div>
                 <h2 className="text-xl font-bold text-white tracking-tight">Instructional Ledger</h2>
              </div>
              <IconButton onClick={() => setIsInsightOpen(false)} sx={{ color: 'slate.500', bgcolor: 'white/5' }}><X size={20} /></IconButton>
            </div>

            <div className="space-y-10">
              <section className="space-y-4">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                  <History size={14} className="text-indigo-400" /> Semantic Integrity
                </h4>
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30" />
                   <div className="text-sm text-slate-300 leading-relaxed italic prose prose-invert prose-sm max-w-none">
                     <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {semanticDelta || "Synthesizing truth map..."}
                     </ReactMarkdown>
                   </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                  <BookOpen size={14} className="text-indigo-400" /> Grounding Citations
                </h4>
                <div className="space-y-3">
                   {citations.map((cite, i) => (
                     <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-[10px] font-mono font-bold text-indigo-400">{i + 1}</div>
                        <span className="text-xs text-slate-400 truncate">{cite}</span>
                     </div>
                   ))}
                </div>
              </section>
            </div>
          </Box>
        </Fade>
      </Modal>

      {/* Floating Scroll Trigger */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-10 right-10 w-12 h-12 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-2xl backdrop-blur-xl group"
      >
        <ChevronRight size={20} className="-rotate-90 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default ScriptDraftingWorkspace;
