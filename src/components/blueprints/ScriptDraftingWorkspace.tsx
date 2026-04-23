// REQUIRED DEPENDENCIES:
// - lucide-react (npm install lucide-react)
// - react-markdown (npm install react-markdown)
// - framer-motion (npm install framer-motion)

"use client";

import React, { useState } from 'react';
import { 
  BookOpen, 
  Send,
  Quote,
  Activity,
  History,
  Info,
  ChevronLeft,
  X,
  Search
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, IconButton } from '@mui/material';

interface ScriptDraftingWorkspaceProps {
  content: string;
  groundingScore: number;
  hallucinationFlag: boolean;
  semanticDelta?: string;
  citations: string[];
  isLoading: boolean;
  onCommit: () => void;
}

const ScriptDraftingWorkspace: React.FC<ScriptDraftingWorkspaceProps> = ({
  content,
  groundingScore,
  hallucinationFlag,
  semanticDelta,
  citations,
  isLoading,
  onCommit
}) => {
  const [isInsightOpen, setIsInsightOpen] = useState(false);

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-black/20 group">
      
      {/* --- Main Zen Editor --- */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500">
        
        {/* Minimalist Top HUD */}
        <div className="h-14 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${hallucinationFlag ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                 {hallucinationFlag ? 'Grounding Error' : 'Verified Grounded'}
               </span>
             </div>
             
             <div className="h-4 w-px bg-white/5" />

             <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Grounding Score</span>
               <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${groundingScore * 10}%` }} 
                  />
               </div>
               <span className="text-[10px] font-mono font-bold text-slate-300">{groundingScore}/10</span>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip title="View Insights & Citations">
              <IconButton 
                onClick={() => setIsInsightOpen(!isInsightOpen)}
                sx={{ 
                  color: isInsightOpen ? '#818CF8' : '#94A3B8',
                  bgcolor: isInsightOpen ? 'rgba(129, 140, 248, 0.1)' : 'transparent',
                  '&:hover': { bgcolor: 'white/5' }
                }}
              >
                <Activity size={16} />
              </IconButton>
            </Tooltip>
            <button 
              onClick={onCommit}
              className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/10"
            >
              Commit <Send size={12} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 lg:p-20 relative">
          {isLoading ? (
            <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
              <div className="h-10 w-2/3 bg-white/5 rounded-lg" />
              <div className="space-y-4">
                <div className="h-4 w-full bg-white/5 rounded" />
                <div className="h-4 w-full bg-white/5 rounded" />
                <div className="h-4 w-3/4 bg-white/5 rounded" />
              </div>
              <div className="h-40 w-full bg-white/5 rounded-2xl" />
            </div>
          ) : (
            <article className="max-w-3xl mx-auto prose prose-invert prose-slate selection:bg-indigo-500/30">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({children}) => <h1 className="text-4xl font-black mb-10 text-white tracking-tighter border-none">{children}</h1>,
                  h2: ({children}) => <h2 className="text-sm font-bold mt-16 mb-6 text-indigo-400 uppercase tracking-[0.3em] border-none flex items-center gap-3">
                    <div className="w-8 h-px bg-indigo-500/30" /> {children}
                  </h2>,
                  h3: ({children}) => <h3 className="text-lg font-bold mt-8 mb-4 text-slate-200 tracking-tight">{children}</h3>,
                  p: ({children}) => {
                    if (typeof children === 'string' && children.includes('[MISSING_DATA:')) {
                      const parts = children.split(/(\[MISSING_DATA:.*?\])/g);
                      return (
                        <p className="mb-6 leading-relaxed text-slate-300 font-light text-lg">
                          {parts.map((part, i) => {
                            if (part.startsWith('[MISSING_DATA:')) {
                              const label = part.replace('[MISSING_DATA: ', '').replace('[MISSING_DATA:', '').replace(']', '');
                              return (
                                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                                  <Search size={10} /> {label}
                                </span>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    }
                    return <p className="mb-6 leading-relaxed text-slate-300 font-light text-lg">{children}</p>;
                  },
                  blockquote: ({children}) => (
                    <div className="my-10 p-8 rounded-3xl bg-indigo-500/[0.03] border border-indigo-500/10 italic flex gap-6 relative overflow-hidden group/quote">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                      <Quote size={32} className="text-indigo-500/20 shrink-0 mt-1" />
                      <div className="text-indigo-200/80 text-xl leading-relaxed">{children}</div>
                    </div>
                  ),
                  strong: ({children}) => <span className="font-bold text-white border-b border-indigo-500/30">{children}</span>,
                  ul: ({children}) => <ul className="list-none pl-0 space-y-4 mb-8">{children}</ul>,
                  li: ({children}) => (
                    <li className="flex gap-4 items-start text-slate-400">
                      <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-500/40 shrink-0" />
                      <span className="text-lg font-light leading-relaxed">{children}</span>
                    </li>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto my-12 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <table className="w-full text-left border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  th: ({children}) => <th className="p-4 font-bold text-indigo-300 bg-white/5 uppercase tracking-widest text-[10px]">{children}</th>,
                  td: ({children}) => <td className="p-4 text-slate-400 border-t border-white/5">{children}</td>,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code: ({inline, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="my-10 rounded-2xl bg-[#010409] border border-white/5 overflow-hidden shadow-2xl">
                        <div className="px-5 py-3 bg-white/[0.03] border-b border-white/5 flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{match?.[1] || 'Code'}</span>
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-white/5" />
                            <div className="w-2 h-2 rounded-full bg-white/5" />
                          </div>
                        </div>
                        <pre className="p-6 overflow-x-auto text-sm text-indigo-200/90 font-mono leading-relaxed custom-scrollbar">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-300 text-xs font-mono" {...props}>{children}</code>
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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-96 border-l border-white/5 bg-[#0F172A]/90 backdrop-blur-2xl z-30 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                   <Activity size={16} className="text-cyan-400" />
                 </div>
                 <span className="text-xs font-bold uppercase tracking-widest text-white">Instructional Audit</span>
               </div>
               <IconButton onClick={() => setIsInsightOpen(false)} sx={{ color: 'slate.500' }}><X size={18} /></IconButton>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
              
              {/* Semantic Delta */}
              <section className="space-y-4">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                  <History size={12} className="text-indigo-400" /> Semantic Delta
                </h4>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30" />
                   <div className="text-xs text-slate-400 leading-relaxed italic prose prose-invert prose-xs">
                     <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {semanticDelta || "Analyzing instructional alignment..."}
                     </ReactMarkdown>
                   </div>
                </div>
              </section>

              {/* Citations */}
              <section className="space-y-4">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                  <BookOpen size={12} className="text-indigo-400" /> Grounding Evidence
                </h4>
                <div className="space-y-3">
                   {citations.length > 0 ? citations.map((cite, i) => (
                     <div key={i} className="group p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-indigo-500/30 transition-all flex gap-4 items-center">
                        <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-[10px] font-mono font-bold text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          {i + 1}
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate flex-1">{cite}</span>
                     </div>
                   )) : (
                     <p className="text-[10px] text-slate-600 italic">No active citations detected.</p>
                   )}
                </div>
              </section>

              {/* Instructional Mode Info */}
              <section className="p-6 rounded-3xl bg-indigo-600/5 border border-indigo-500/10 space-y-3">
                 <div className="flex items-center gap-2 text-indigo-300">
                   <Info size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Pedagogical Guardrails</span>
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed">
                   This script follows the <b>Triple-Pass Integrity Shield</b> protocol. Every claim is verified against your Knowledge Vault. Hallucinations trigger automatic semantic flags.
                 </p>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Insight Trigger (when sidebar is closed) */}
      {!isInsightOpen && (
        <button 
          onClick={() => setIsInsightOpen(true)}
          className="absolute right-8 top-1/2 -translate-y-1/2 w-10 h-24 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-indigo-400 hover:bg-white/10 transition-all z-20 group/trigger"
        >
          <div className="flex flex-col items-center gap-1 opacity-50 group-hover/trigger:opacity-100 transition-opacity">
            <span className="[writing-mode:vertical-lr] text-[9px] font-bold uppercase tracking-[0.2em]">Insights</span>
            <ChevronLeft size={14} />
          </div>
        </button>
      )}
    </div>
  );
};

export default ScriptDraftingWorkspace;
