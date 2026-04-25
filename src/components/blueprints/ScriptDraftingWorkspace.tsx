/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  BookOpen, 
  Activity, 
  History, 
  X, 
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
import { IconButton, Modal, Backdrop, Fade, Box } from '@mui/material';
import { supabase } from '@/lib/supabase';
import { useSidebar } from '@/lib/SidebarContext';

// --- SUB-COMPONENT: PROCEDURAL GENERATIVE LENS (As Loader) ---
const GenerativeLens = ({ content, status, scale }: { content: string, status?: string, scale: number }) => {
  const [seed] = useState(Math.floor(Math.random() * 1000));
  
  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden flex items-center justify-center group/viz">
      <div className="absolute inset-0 opacity-20 group-hover/viz:opacity-40 transition-opacity duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #A7DADB15 0%, transparent 70%), 
                            linear-gradient(${seed % 360}deg, #4F46E505 0%, transparent 100%)`
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center" style={{ gap: `${24 * scale}px` }}>
         <motion.div 
           animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
           transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
           className="rounded-3xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center backdrop-blur-xl shadow-2xl"
           style={{ width: `${96 * scale}px`, height: `${96 * scale}px` }}
         >
            <Sparkles size={32 * scale} className="text-[#A7DADB]" />
         </motion.div>
         
         <div className="space-y-2">
            <div className="font-black text-[#A7DADB] uppercase tracking-[0.4em] opacity-40" style={{ fontSize: `${10 * scale}px` }}>
              {status === 'processing' ? 'Synthesizing 4K Assets' : 'Nano Banana Pro Active'}
            </div>
            <div className="font-bold text-white/80 tracking-tight leading-tight max-w-xs truncate-2-lines italic" style={{ fontSize: `${18 * scale}px` }}>
               &quot;{content.split(' ').slice(0, 8).join(' ')}...&quot;
            </div>
         </div>
      </div>
    </div>
  );
};

interface Artifact {
  id: string;
  type: '[VISUAL]' | '[NARRATION]' | '[ACTIVITY]' | '[BRANCHING]' | '[SPEAKER_NOTES]' | '[HEADER]';
  content: string;
  title?: string;
  visualPrompt?: string;
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
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({}); 
  const { collapsed } = useSidebar();

  // Dynamic Scaling Factor: 1.0 when collapsed (sidebar is small), ~0.85 when expanded (sidebar is large)
  const scale = collapsed ? 1.0 : 0.88;

  useEffect(() => {
    // 1. Initial Fetch for already completed visuals in this session
    const fetchExisting = async () => {
      const { data } = await supabase
        .from('visual_generations')
        .select('prompt, image_url')
        .eq('status', 'completed')
        .not('image_url', 'is', null);
      
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(g => { if(g.image_url) map[g.prompt] = g.image_url; });
        setGeneratedImages(map);
      }
    };
    fetchExisting();

    // 2. Subscribe to new completions
    const channel = supabase
      .channel('visual-updates-global')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'visual_generations' },
        (payload) => {
          console.log('[ScriptWorkspace] Neural Pulse Received:', payload.new.status);
          if (payload.new.status === 'completed' && payload.new.image_url) {
            setGeneratedImages(prev => ({
              ...prev,
              [payload.new.prompt]: payload.new.image_url
            }));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const artifacts = useMemo(() => {
    if (!content) return [];
    
    const normalized = content
      .replace(/---/g, '')
      .replace(/###\s+\*\*Scene/gi, '[HEADER] Scene')
      .replace(/\*\*(Storyboard Constellation.*?)\*\*/i, '[HEADER] $1');

    const lines = normalized.split('\n');
    const tempResults: Artifact[] = [];
    let currentArtifact: Partial<Artifact> | null = null;
    const typeRegex = /\[(VISUAL|NARRATION|ACTIVITY|BRANCHING|SPEAKER_NOTES|HEADER|VISUAL_PROMPT)\]/;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const typeMatch = trimmed.match(typeRegex);
      
      if (typeMatch) {
        const typeStr = typeMatch[1];
        if (typeStr === 'VISUAL_PROMPT' && currentArtifact?.type === '[VISUAL]') {
          currentArtifact.visualPrompt = trimmed.replace(/^[#*\s]*\[.*?\]:?/, '').trim();
          return;
        }

        if (currentArtifact) tempResults.push(currentArtifact as Artifact);
        const type = `[${typeStr}]` as Artifact['type'];
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
      case '[VISUAL]': return <Eye size={18 * scale} className="text-[#A7DADB]" />;
      case '[NARRATION]': return <Mic2 size={18 * scale} className="text-[#A7DADB]" />;
      case '[ACTIVITY]': return <MousePointer2 size={18 * scale} className="text-[#A7DADB]" />;
      case '[BRANCHING]': return <GitBranch size={18 * scale} className="text-[#A7DADB]" />;
      case '[SPEAKER_NOTES]': return <StickyNote size={18 * scale} className="text-[#64748B]" />;
      case '[HEADER]': return <Layers size={18 * scale} className="text-[#A7DADB]" />;
      default: return <Workflow size={18 * scale} className="text-[#A7DADB]" />;
    }
  };

  const getCardStyle = (type: Artifact['type']) => {
    switch (type) {
      case '[HEADER]': return "w-full border-[#A7DADB]/20 bg-white/[0.005] mb-8";
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
    <div className="flex flex-col w-full relative pt-12" style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div className="w-full max-w-full mx-auto px-2 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex flex-wrap gap-8 py-12" style={{ gap: `${32 * scale}px` }}>
               {[1,2,3,4].map(i => (
                 <div key={i} className={`h-64 rounded-[3rem] bg-white/[0.02] border border-white/[0.05] animate-pulse ${i === 1 ? 'w-full' : 'flex-1 min-w-[400px]'}`} />
               ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="flex flex-wrap pb-40"
              style={{ gap: `${32 * scale}px` }}
            >
              {artifacts.map((art, idx) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -8, scale: 1.005, transition: { duration: 0.3 } }}
                  className={`relative overflow-hidden group rounded-[3rem] backdrop-blur-3xl border ${getCardStyle(art.type)} transition-all duration-700 hover:bg-white/[0.02] shadow-[0_20px_80px_rgba(0,0,0,0.5)]`}
                  style={{ padding: `${48 * scale}px` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A7DADB]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="flex items-center justify-between mb-10 relative z-10" style={{ marginBottom: `${40 * scale}px` }}>
                    <div className="flex items-center gap-6" style={{ gap: `${24 * scale}px` }}>
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:border-[#A7DADB]/30 transition-all shadow-inner" style={{ padding: `${16 * scale}px` }}>
                        {getTypeIcon(art.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black uppercase tracking-[0.4em] text-[#A7DADB]/30" style={{ fontSize: `${10 * scale}px` }}>
                          {art.type.replace('[', '').replace(']', '')}
                        </span>
                        {art.title && <span className="font-bold text-white tracking-widest uppercase" style={{ fontSize: `${14 * scale}px` }}>{art.title}</span>}
                      </div>
                    </div>
                    <IconButton size="small" sx={{ color: 'white/[0.05]', '&:hover': { color: '#A7DADB' } }}><Maximize2 size={14 * scale} /></IconButton>
                  </div>

                  <div className="relative z-10">
                    {art.type === '[VISUAL]' && (
                      <div className="aspect-video w-full rounded-[2.5rem] bg-black/60 border border-white/5 flex items-center justify-center mb-12 relative overflow-hidden shadow-2xl" style={{ marginBottom: `${48 * scale}px` }}>
                         <AnimatePresence mode="wait">
                           {generatedImages[art.visualPrompt || ''] ? (
                             <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
                               <Image 
                                 src={generatedImages[art.visualPrompt || '']} 
                                 alt="Generated Mockup" 
                                 fill 
                                 className="object-cover" 
                               />
                             </motion.div>
                           ) : (
                             <motion.div key="loader" exit={{ opacity: 0 }} className="absolute inset-0">
                               <GenerativeLens content={art.content} status={art.visualPrompt ? 'processing' : undefined} scale={scale} />
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>
                    )}

                    <div className={`prose prose-invert max-w-none ${art.type === '[HEADER]' ? 'tracking-tighter text-white' : ''} ${art.type === '[NARRATION]' ? 'font-medium text-white/90 tracking-[-0.01em] italic' : ''} ${art.type === '[ACTIVITY]' ? 'font-bold text-[#A7DADB]' : ''} ${art.type === '[SPEAKER_NOTES]' ? 'text-slate-500 italic border-l-4 border-white/10 font-medium' : ''} ${art.type === '[BRANCHING]' ? 'font-mono bg-black/40 rounded-[2rem] border border-white/5 text-[#A7DADB]/80' : ''}`}
                         style={{ 
                            fontSize: art.type === '[HEADER]' ? `${48 * scale}px` : 
                                      art.type === '[NARRATION]' ? `${18 * scale}px` : 
                                      art.type === '[SPEAKER_NOTES]' ? `${15 * scale}px` : `${16 * scale}px`,
                            lineHeight: 1.65,
                            padding: art.type === '[BRANCHING]' ? `${40 * scale}px` : '0',
                            paddingLeft: art.type === '[SPEAKER_NOTES]' ? `${40 * scale}px` : undefined,
                            paddingTop: art.type === '[HEADER]' ? `${48 * scale}px` : undefined,
                            paddingBottom: art.type === '[HEADER]' ? `${48 * scale}px` : undefined
                         }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {art.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Workflow size={100 * scale} className="text-[#A7DADB]" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal open={isInsightOpen} onClose={() => setIsInsightOpen(false)} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(40px)', bgcolor: 'rgba(2, 6, 23, 0.98)' } }}>
        <Fade in={isInsightOpen}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '95%', maxWidth: '800px', maxHeight: '85vh', bgcolor: '#020617', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '60px', p: 10, outline: 'none', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-20">
               <div className="flex items-center gap-8">
                  <div className="p-5 rounded-[2rem] bg-[#A7DADB]/10 border border-[#A7DADB]/20 shadow-2xl"><Activity size={32} className="text-[#A7DADB]" /></div>
                  <div><h2 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">Knowledge Verification</h2><p className="text-[11px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Strategic Integrity Protocol</p></div>
               </div>
               <IconButton onClick={() => setIsInsightOpen(false)} sx={{ color: 'slate.500', bgcolor: 'white/[0.03]', p: 3, borderRadius: '24px' }}><X size={28} /></IconButton>
            </div>
            <div className="space-y-24">
              <section className="space-y-8">
                <div className="flex items-center gap-4"><History size={16} className="text-[#A7DADB]" /><h4 className="text-[11px] text-slate-500 uppercase tracking-[0.5em] font-black">Semantic Integrity Pass</h4></div>
                <div className="p-12 rounded-[3rem] bg-white/[0.01] border border-white/[0.05] relative overflow-hidden backdrop-blur-3xl"><div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#A7DADB]/40 to-transparent" /><div className="text-lg text-slate-300 leading-relaxed font-light italic text-slate-400"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{semanticDelta || "Synthesizing truth anchors..."}</ReactMarkdown></div></div>
              </section>
              <section className="space-y-8">
                <div className="flex items-center gap-4"><BookOpen size={16} className="text-[#A7DADB]" /><h4 className="text-[11px] text-slate-500 uppercase tracking-[0.5em] font-black">Verified Institutional Citations</h4></div>
                <div className="grid grid-cols-1 gap-5">{citations.map((cite, i) => (<div key={i} className="flex gap-8 items-center p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.03] hover:border-[#A7DADB]/20 transition-all group/cite"><div className="text-[11px] font-mono font-black text-[#A7DADB] bg-[#A7DADB]/10 w-10 h-10 flex items-center justify-center rounded-2xl border border-[#A7DADB]/20 group-hover/cite:bg-[#A7DADB] group-hover/cite:text-black transition-all">{i + 1}</div><span className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate">{cite}</span></div>))}</div>
              </section>
            </div>
          </Box>
        </Fade>
      </Modal>

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-12 right-12 w-20 h-20 rounded-full bg-[#020617] border border-[#A7DADB]/30 flex items-center justify-center text-[#A7DADB] hover:bg-[#A7DADB] hover:text-black transition-all shadow-2xl backdrop-blur-3xl group z-50 hover:scale-110"><ChevronRight size={32} className="-rotate-90 group-hover:-translate-y-1 transition-transform" /></button>
    </div>
  );
};

export default ScriptDraftingWorkspace;
