/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  Activity, 
  History, 
  X, 
  Mic2,
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
import { IconButton, Modal, Backdrop, Fade, Box } from '@mui/material';

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
  isLoading: boolean;
  semanticDelta?: string;
  citations: string[];
}

const ScriptDraftingWorkspace: React.FC<ScriptDraftingWorkspaceProps> = ({
  content,
  isLoading,
  semanticDelta,
  citations
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
      case '[HEADER]': 
        return "w-full border-[#A7DADB]/20 bg-white/[0.005] py-16 px-20 mb-8";
      case '[VISUAL]': 
      case '[NARRATION]':
      case '[BRANCHING]':
        return "flex-[2] min-w-[min(100%,480px)] border-[#A7DADB]/20 bg-white/[0.01]";
      case '[ACTIVITY]':
      case '[SPEAKER_NOTES]':
        return "flex-1 min-w-[min(100%,320px)] border-white/10 bg-white/[0.005]";
      default: 
        return "flex-1 min-w-[300px] border-white/10";
    }
  };

  useEffect(() => {
    const handleTrigger = () => setIsInsightOpen(true);
    window.addEventListener('constellation-open-verification', handleTrigger);
    return () => window.removeEventListener('constellation-open-verification', handleTrigger);
  }, []);

  return (
    <div className="flex flex-col w-full relative pt-12">
      
      {/* --- FLUID BENTO ARTIFACTS --- */}
      <div className="w-full max-w-[98%] mx-auto px-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex flex-wrap gap-8 py-12">
               {[1,2,3,4].map(i => (
                 <div key={i} className={`h-64 rounded-[3rem] bg-white/[0.02] border border-white/[0.05] animate-pulse ${i === 1 ? 'w-full' : 'flex-1 min-w-[400px]'}`} />
               ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-8 pb-40"
            >
              {artifacts.map((art, idx) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className={`
                    relative overflow-hidden group rounded-[3rem] p-12
                    backdrop-blur-3xl border
                    ${getCardStyle(art.type)}
                    transition-all duration-700 hover:bg-white/[0.02]
                    shadow-[0_20px_80px_rgba(0,0,0,0.5)]
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A7DADB]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:border-[#A7DADB]/30 transition-all">
                        {getTypeIcon(art.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A7DADB]/30">
                          {art.type.replace('[', '').replace(']', '')}
                        </span>
                        {art.title && <span className="text-sm font-bold text-white tracking-widest uppercase">{art.title}</span>}
                      </div>
                    </div>
                    <IconButton size="small" sx={{ color: 'white/[0.05]', '&:hover': { color: '#A7DADB' } }}><Maximize2 size={14} /></IconButton>
                  </div>

                  <div className="relative z-10">
                    {art.type === '[VISUAL]' && (
                      <div className="aspect-video w-full rounded-[2.5rem] bg-black/60 border border-white/5 flex items-center justify-center mb-12 relative overflow-hidden shadow-2xl">
                         <GenerativeLens content={art.content} />
                      </div>
                    )}

                    <div className={`
                      prose prose-invert max-w-none
                      ${art.type === '[HEADER]' ? 'text-5xl font-black tracking-tighter text-white py-12' : ''}
                      ${art.type === '[NARRATION]' ? 'text-[1.125rem] font-medium leading-[1.65] text-white/90 tracking-[-0.01em] italic' : ''}
                      ${art.type === '[ACTIVITY]' ? 'text-[1.05rem] font-bold text-[#A7DADB] leading-relaxed' : ''}
                      ${art.type === '[SPEAKER_NOTES]' ? 'text-[0.95rem] text-slate-500 italic border-l-4 border-white/10 pl-10 py-4 font-medium' : ''}
                      ${art.type === '[BRANCHING]' ? 'font-mono text-[0.9rem] bg-black/40 p-10 rounded-[2rem] border border-white/5 text-[#A7DADB]/80 leading-relaxed' : ''}
                      ${!['[HEADER]', '[NARRATION]', '[ACTIVITY]', '[SPEAKER_NOTES]', '[BRANCHING]'].includes(art.type) ? 'text-[1.1rem] text-slate-400 font-light leading-relaxed' : ''}
                    `}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {art.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Workflow size={100} className="text-[#A7DADB]" />
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
                   <div className="text-lg text-slate-300 leading-relaxed font-light italic text-slate-400">
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
    </div>
  );
};

export default ScriptDraftingWorkspace;
