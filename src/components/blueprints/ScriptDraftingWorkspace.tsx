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
  Sparkles,
  Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton, Modal, Backdrop, Fade, Box, Tooltip, Typography } from '@mui/material';

// --- SUB-COMPONENT: PROCEDURAL GENERATIVE LENS ---
const GenerativeLens = ({ content }: { content: string }) => {
  const [seed] = useState(Math.floor(Math.random() * 1000));
  
  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden flex items-center justify-center group/viz">
      <div className="absolute inset-0 opacity-20 group-hover/viz:opacity-40 transition-opacity duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #A7DADB15 0%, transparent 70%), 
                            linear-gradient(${seed % 360}deg, #4F46E505 0%, transparent 100%)`
        }}
      />
      
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#A7DADB" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
         <motion.div 
           animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
           transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
           className="w-24 h-24 rounded-3xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center backdrop-blur-xl shadow-2xl"
         >
            <Sparkles size={32} className="text-[#A7DADB]" />
         </motion.div>
         
         <div className="space-y-2">
            <div className="text-[10px] font-black text-[#A7DADB] uppercase tracking-[0.4em] opacity-40">Procedural Gen Alpha</div>
            <div className="text-lg font-bold text-white/80 tracking-tight leading-tight max-w-xs truncate-2-lines italic">
               &quot;{content.split(' ').slice(0, 8).join(' ')}...&quot;
            </div>
         </div>
      </div>
      <div className="absolute bottom-4 left-6 text-[8px] font-mono text-[#A7DADB]/30 tracking-widest uppercase">
         Instructional Frame ID: {seed}-CONST
      </div>
    </div>
  );
};

interface Artifact {
  id: string;
  type: '[VISUAL]' | '[NARRATION]' | '[ACTIVITY]' | '[BRANCHING]' | '[SPEAKER_NOTES]' | '[HEADER]';
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

  // --- CONSOLIDATED SEMANTIC PARSER ---
  const artifacts = useMemo(() => {
    if (!content) return [];
    
    const normalized = content
      .replace(/---/g, '')
      .replace(/###\s+\*\*Scene/gi, '[HEADER] Scene')
      .replace(/\*\*(Storyboard Constellation.*?)\*\*/i, '[HEADER] $1');

    const lines = normalized.split('\n');
    const tempResults: Artifact[] = [];
    let currentArtifact: Partial<Artifact> | null = null;
    const typeRegex = /\[(VISUAL|NARRATION|ACTIVITY|BRANCHING|SPEAKER_NOTES|HEADER)\]/;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const typeMatch = trimmed.match(typeRegex);
      
      if (typeMatch) {
        if (currentArtifact) tempResults.push(currentArtifact as Artifact);
        const type = `[${typeMatch[1]}]` as Artifact['type'];
        currentArtifact = {
          id: `artifact-${index}`,
          type,
          content: trimmed.replace(/^[#*\s]*\[.*?\]:?/, '').replace(/\*\*:/g, '').replace(/\*\*/g, '').trim()
        };
      } else if (currentArtifact) {
        currentArtifact.content += `\n${trimmed}`;
      } else {
        tempResults.push({
          id: `intro-${index}`,
          type: '[HEADER]', 
          content: trimmed,
          title: 'System Initiation'
        });
      }
    });
    if (currentArtifact) tempResults.push(currentArtifact as Artifact);

    // --- CONSOLIDATION LOGIC: Merge all headers into one single top card ---
    const headers = tempResults.filter(a => a.type === '[HEADER]');
    const others = tempResults.filter(a => a.type !== '[HEADER]');
    
    if (headers.length > 0) {
      const consolidatedHeader: Artifact = {
        id: 'main-constellation-header',
        type: '[HEADER]',
        title: 'Core Architecture Initiation',
        content: headers.map(h => h.content).join('\n\n')
      };
      return [consolidatedHeader, ...others];
    }

    return others;
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
      case '[HEADER]': return <Layers size={18} className="text-[#A7DADB]" />;
      default: return <Workflow size={18} className="text-[#A7DADB]" />;
    }
  };

  const getCardStyle = (type: Artifact['type']) => {
    switch (type) {
      case '[HEADER]': return "md:col-span-3 border-[#A7DADB]/10 bg-white/[0.005] py-12 px-14";
      case '[VISUAL]': return "md:col-span-2 md:row-span-1 border-[#A7DADB]/20";
      case '[NARRATION]': return "md:col-span-2 md:row-span-1 border-white/10 bg-white/[0.01]";
      case '[ACTIVITY]': return "md:col-span-1 md:row-span-1 border-indigo-500/30 bg-indigo-500/[0.02]";
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
      <div className="w-full max-w-[98%] mx-auto px-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-3 grid-flow-dense gap-8 py-12">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className={`h-64 rounded-[3rem] bg-white/[0.02] border border-white/[0.05] animate-pulse ${i === 1 ? 'md:col-span-3' : ''}`} />
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
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className={`
                    relative overflow-hidden group rounded-[3rem] p-10
                    bg-white/[0.015] backdrop-blur-3xl border
                    ${getCardStyle(art.type)}
                    transition-all duration-700 hover:bg-white/[0.02]
                    shadow-[0_20px_60px_rgba(0,0,0,0.4)]
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A7DADB]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:border-[#A7DADB]/30 transition-all">
                        {getTypeIcon(art.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#A7DADB]/30">
                          {art.type.replace('[', '').replace(']', '')}
                        </span>
                        {art.title && <span className="text-xs font-bold text-white tracking-tight uppercase">{art.title}</span>}
                      </div>
                    </div>
                    <IconButton size="small" sx={{ color: 'white/[0.05]', '&:hover': { color: '#A7DADB' } }}><Maximize2 size={14} /></IconButton>
                  </div>

                  <div className="relative z-10">
                    {art.type === '[VISUAL]' && (
                      <div className="aspect-video w-full rounded-[2rem] bg-black/60 border border-white/5 flex items-center justify-center mb-10 relative overflow-hidden shadow-2xl">
                         <GenerativeLens content={art.content} />
                      </div>
                    )}

                    <div className={`
                      prose prose-invert max-w-none
                      ${art.type === '[HEADER]' ? 'text-4xl font-bold tracking-tighter text-white/90' : ''}
                      ${art.type === '[NARRATION]' ? 'text-2xl font-light leading-relaxed text-white/90' : 'text-[15px] text-slate-400 leading-relaxed'}
                      ${art.type === '[SPEAKER_NOTES]' ? 'text-sm text-slate-500 italic border-l-2 border-white/5 pl-8 py-2' : ''}
                      ${art.type === '[BRANCHING]' ? 'font-mono text-[13px] bg-black/40 p-8 rounded-3xl border border-white/5 text-[#A7DADB]/80' : ''}
                    `}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {art.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Workflow size={80} className="text-[#A7DADB]" />
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
            p: 10, outline: 'none', overflowY: 'auto'
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
                <div className="p-12 rounded-[3rem] bg-white/[0.01] border border-white/[0.05] relative overflow-hidden backdrop-blur-3xl">
                   <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#A7DADB]/40 to-transparent" />
                   <div className="text-lg text-slate-300 leading-relaxed font-light italic">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {semanticDelta || "Synthesizing truth anchors..."}
                      </ReactMarkdown>
                   </div>
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <BookOpen size={16} className="text-[#A7DADB]" />
                  <h4 className="text-[11px] text-slate-500 uppercase tracking-[0.5em] font-black">Verified Institutional Citations</h4>
                </div>
                <div className="grid grid-cols-1 gap-5">
                   {citations.map((cite, i) => (
                     <div key={i} className="flex gap-8 items-center p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.03] hover:border-[#A7DADB]/20 transition-all group/cite">
                        <div className="text-[11px] font-mono font-black text-[#A7DADB] bg-[#A7DADB]/10 w-10 h-10 flex items-center justify-center rounded-2xl border border-[#A7DADB]/20 group-hover/cite:bg-[#A7DADB] group-hover/cite:text-black transition-all">{i + 1}</div>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate">{cite}</span>
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
