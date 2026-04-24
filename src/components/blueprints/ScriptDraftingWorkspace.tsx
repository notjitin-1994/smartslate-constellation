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
  Cpu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, IconButton } from '@mui/material';

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
    <div className="relative flex h-full w-full overflow-hidden bg-black/40 group">
      
      {/* --- Main Zen Editor --- */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500 relative z-10">
        
        {/* Minimalist Top HUD */}
        <div className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-8">
             {/* Hallucination / Grounding Status */}
             <div className="flex items-center gap-3">
               <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${hallucinationFlag ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'} border ${hallucinationFlag ? 'border-rose-500/30' : 'border-emerald-500/30'}`}>
                 {hallucinationFlag ? <AlertOctagon size={16} className="animate-pulse" /> : <Fingerprint size={16} />}
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Integrity Pass</span>
                 <span className={`text-xs font-bold ${hallucinationFlag ? 'text-rose-400' : 'text-emerald-400'} leading-none`}>
                   {hallucinationFlag ? 'Potential Hallucination' : 'Verified Organizational Truth'}
                 </span>
               </div>
             </div>
             
             <div className="h-6 w-px bg-white/10" />

             {/* Grounding Score */}
             <div className="flex items-center gap-4">
               <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1.5">Grounding</span>
                 <div className="flex items-center gap-2">
                   <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${groundingScore * 10}%` }}
                        className={`h-full ${groundingScore > 7 ? 'bg-emerald-500' : groundingScore > 4 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      />
                   </div>
                   <span className="text-[10px] font-mono font-black text-white">{groundingScore}/10</span>
                 </div>
               </div>
             </div>

             {/* Cognitive Load */}
             <div className="flex items-center gap-4">
               <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1.5">Cognitive Load</span>
                 <div className="flex items-center gap-2">
                   <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cognitiveLoadScore * 10}%` }}
                        className={`h-full ${cognitiveLoadScore < 4 ? 'bg-emerald-500' : cognitiveLoadScore < 7 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                      />
                   </div>
                   <span className="text-[10px] font-mono font-black text-white">{cognitiveLoadScore}/10</span>
                 </div>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip title="Neural Insights">
              <IconButton 
                onClick={() => setIsInsightOpen(!isInsightOpen)}
                sx={{ 
                  width: 40, height: 40,
                  color: isInsightOpen ? '#818CF8' : '#94A3B8',
                  bgcolor: isInsightOpen ? 'rgba(129, 140, 248, 0.1)' : 'white/5',
                  border: '1px solid',
                  borderColor: isInsightOpen ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                  '&:hover': { bgcolor: 'white/10' }
                }}
              >
                <Activity size={18} />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 lg:p-20 scroll-smooth">
          {isLoading ? (
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="space-y-4">
                <div className="h-12 w-2/3 bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-4 w-1/3 bg-white/5 rounded-full animate-pulse" />
              </div>
              <div className="space-y-6">
                <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
                <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
                <div className="h-4 w-4/5 bg-white/5 rounded-full animate-pulse" />
              </div>
              <div className="h-64 w-full bg-white/5 rounded-[32px] animate-pulse" />
            </div>
          ) : (
            <article className="max-w-3xl mx-auto selection:bg-indigo-500/40">
              {content.includes('!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!') && (
                <div className="mb-12 p-6 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 flex gap-4 items-center animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Search size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-1">Substantial Gaps Detected</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">The Knowledge Vault contains insufficient data for this specific module. Please upload relevant SOPs or documentation to ground this script.</p>
                  </div>
                </div>
              )}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({children}) => {
                    const titleText = children?.toString() || '';
                    return (
                      <motion.h1 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-black mb-12 text-white tracking-tighter leading-tight bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent pb-2"
                      >
                        {titleText.replace('!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!', '')}
                      </motion.h1>
                    );
                  },
                  h2: ({children}) => (
                    <h2 className="text-[10px] font-black mt-20 mb-8 text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-4">
                      <span className="w-12 h-px bg-indigo-500/40" /> {children}
                    </h2>
                  ),
                  h3: ({children}) => <h3 className="text-2xl font-bold mt-12 mb-6 text-white tracking-tight leading-snug">{children}</h3>,
                  p: ({children}) => {
                    if (typeof children === 'string' && children.includes('[MISSING_DATA:')) {
                      const parts = children.split(/(\[MISSING_DATA:.*?\])/g);
                      return (
                        <p className="mb-8 leading-relaxed text-slate-300 font-light text-xl">
                          {parts.map((part, i) => {
                            if (part.startsWith('[MISSING_DATA:')) {
                              const label = part.replace('[MISSING_DATA: ', '').replace('[MISSING_DATA:', '').replace(']', '');
                              return (
                                <span key={i} className="inline-flex items-center gap-2 px-3 py-1 mx-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
                                  <Search size={12} /> {label}
                                </span>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    }
                    return <p className="mb-8 leading-relaxed text-slate-300 font-light text-xl">{children}</p>;
                  },
                  blockquote: ({children}) => (
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="my-14 p-10 rounded-[32px] bg-gradient-to-br from-indigo-500/[0.05] to-transparent border border-indigo-500/10 flex gap-8 relative overflow-hidden group/quote shadow-2xl"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/40" />
                      <Quote size={40} className="text-indigo-500/20 shrink-0 mt-1" />
                      <div className="text-indigo-100/90 text-2xl font-medium leading-relaxed tracking-tight italic">{children}</div>
                    </motion.div>
                  ),
                  strong: ({children}) => <span className="font-bold text-white shadow-[0_1px_0_0_rgba(129,140,248,0.4)]">{children}</span>,
                  ul: ({children}) => <ul className="list-none pl-0 space-y-6 mb-12">{children}</ul>,
                  li: ({children}) => (
                    <li className="flex gap-6 items-start text-slate-300">
                      <div className="mt-3 w-2 h-2 rounded-full bg-indigo-500/60 ring-4 ring-indigo-500/10 shrink-0" />
                      <span className="text-xl font-light leading-relaxed">{children}</span>
                    </li>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto my-16 rounded-[24px] border border-white/5 bg-slate-900/20 backdrop-blur-sm shadow-inner">
                      <table className="w-full text-left border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  th: ({children}) => <th className="p-6 font-black text-indigo-300 bg-white/[0.03] uppercase tracking-[0.2em] text-[10px]">{children}</th>,
                  td: ({children}) => <td className="p-6 text-slate-400 border-t border-white/5 text-lg font-light">{children}</td>,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code: ({inline, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="my-14 rounded-[24px] bg-[#010409] border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/5">
                        <div className="px-6 py-4 bg-white/[0.04] border-b border-white/10 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Cpu size={14} className="text-indigo-400" />
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">{match?.[1] || 'Source Code'}</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                          </div>
                        </div>
                        <pre className="p-8 overflow-x-auto text-base text-indigo-100/90 font-mono leading-relaxed custom-scrollbar">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-indigo-500/10 px-2 py-0.5 rounded-md text-indigo-300 text-sm font-mono border border-indigo-500/20" {...props}>{children}</code>
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </div>

      {/* --- Sliding Insight Panel (Right) --- */}
      <AnimatePresence>
        {isInsightOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="w-[420px] border-l border-white/10 bg-slate-900/95 backdrop-blur-3xl z-30 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                   <Activity size={20} className="text-indigo-400" />
                 </div>
                 <div>
                   <span className="block text-xs font-black uppercase tracking-[0.2em] text-white leading-none mb-1">Architectural Hub</span>
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Grounding & Cognitive Audit</span>
                 </div>
               </div>
               <IconButton onClick={() => setIsInsightOpen(false)} sx={{ color: 'slate.500', bgcolor: 'white/5', '&:hover': { bgcolor: 'white/10' } }}><X size={18} /></IconButton>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
              
              {/* Cognitive Load Metric */}
              <section className="space-y-5">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                  <Cpu size={14} className="text-indigo-400" /> Cognitive Complexity
                </h4>
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-inner">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-xs text-slate-300 font-bold tracking-tight">Complexity Index</span>
                     <span className="text-xs font-mono font-black text-indigo-400">{cognitiveLoadScore}/10</span>
                   </div>
                   <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cognitiveLoadScore * 10}%` }}
                        className={`h-full transition-all duration-1000 ${cognitiveLoadScore < 5 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      />
                   </div>
                   <p className="mt-4 text-[11px] text-slate-500 leading-relaxed font-medium">
                     Analysis based on terminology density, sentence depth, and required prior organizational knowledge.
                   </p>
                </div>
              </section>

              {/* Semantic Delta */}
              <section className="space-y-5">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                  <History size={14} className="text-indigo-400" /> Semantic Integrity Delta
                </h4>
                <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/20" />
                   <div className="text-xs text-slate-400 leading-relaxed italic prose prose-invert prose-xs max-w-none">
                     <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {semanticDelta || "Analyzing instructional alignment..."}
                     </ReactMarkdown>
                   </div>
                </div>
              </section>

              {/* Citations */}
              <section className="space-y-5">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                  <BookOpen size={14} className="text-indigo-400" /> Validated Sources
                </h4>
                <div className="space-y-3">
                   {citations.length > 0 ? citations.map((cite, i) => (
                     <motion.div 
                      key={i} 
                      whileHover={{ x: 5 }}
                      className="group p-5 rounded-[20px] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all flex gap-5 items-center shadow-lg"
                     >
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-[10px] font-mono font-black text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          {i + 1}
                        </div>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors truncate flex-1">{cite}</span>
                     </motion.div>
                   )) : (
                     <p className="text-[11px] text-slate-600 italic font-medium">No active citations detected.</p>
                   )}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScriptDraftingWorkspace;
