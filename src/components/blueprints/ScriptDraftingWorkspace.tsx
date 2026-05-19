/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton, Modal, Backdrop, Fade, Box } from '@mui/material';
import { supabase } from '@/lib/supabase';
import { useSidebar } from '@/lib/SidebarContext';
import type { NodeScriptType } from '@/types/architect';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// --- SUB-COMPONENTS ---

const GenerativePlaceholder = ({
  status,
  error,
  scale,
}: {
  status: string;
  error?: string;
  scale: number;
}) => {
  const [fakeProgress, setFakeProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (status === 'pending') setFakeProgress(15);
    if (status === 'processing') {
      setFakeProgress(20);
      interval = setInterval(
        () => setFakeProgress((prev) => (prev >= 92 ? prev : prev + 1)),
        350
      );
    }
    if (status === 'completed') setFakeProgress(100);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'failed')
    return (
      <div className="absolute inset-0 bg-rose-950/20 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle size={24 * scale} className="text-rose-500 mb-4" />
        <h4 className="text-white font-bold uppercase tracking-tighter text-sm mb-2">
          Synthesis Failed
        </h4>
        <p className="text-[8px] font-mono text-rose-400/60 uppercase">
          Error: {error || 'Neural Interruption'}
        </p>
      </div>
    );

  return (
    <div className="relative w-full h-full bg-[#020617] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#A7DADB_0%,_transparent_70%)]" />
      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-[80%] text-center">
        <Sparkles size={24 * scale} className="text-[#A7DADB] animate-pulse" />
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${fakeProgress}%` }}
            className="h-full bg-[#A7DADB]"
          />
        </div>
        <span className="text-[8px] font-black text-[#A7DADB]/40 uppercase tracking-[0.3em]">
          {status === 'pending' ? 'Syncing' : 'Synthesizing'} {fakeProgress}%
        </span>
      </div>
    </div>
  );
};

// --- TYPES ---

interface ScriptDraftingWorkspaceProps {
  nodeScript: NodeScriptType | null;
  isLoading: boolean;
  semanticDelta?: string;
  citations: string[];
  nodeId: string;
}

const ScriptDraftingWorkspace: React.FC<ScriptDraftingWorkspaceProps> = ({
  nodeScript,
  isLoading,
  semanticDelta,
  citations,
  nodeId,
}) => {
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [visualUrls, setVisualUrls] = useState<Record<string, string>>({});
  const [visualPrompts, setVisualPrompts] = useState<Record<string, string>>({});
  const { collapsed } = useSidebar();
  const scale = collapsed ? 1.0 : 0.88;

  const scenes = useMemo(() => nodeScript?.scenes ?? [], [nodeScript]);
  const moduleTitle = nodeScript?.nodeTitle ?? 'Instructional Trace';

  // --- REAL-TIME VISUAL SYNC ---
  useEffect(() => {
    const allVisualIds = scenes.filter((s) => s.visualId).map((s) => s.visualId!);
    if (allVisualIds.length === 0) return;

    const fetchExisting = async () => {
      const { data } = await supabase
        .from('visual_generations')
        .select('id, image_url, prompt, status')
        .in('id', allVisualIds)
        .eq('status', 'completed');
      if (data) {
        const urlMap: Record<string, string> = {};
        const promptMap: Record<string, string> = {};
        data.forEach((g) => {
          if (g.image_url) urlMap[g.id] = g.image_url;
          if (g.prompt) promptMap[g.id] = g.prompt;
        });
        setVisualUrls((prev) => ({ ...prev, ...urlMap }));
        setVisualPrompts((prev) => ({ ...prev, ...promptMap }));
      }
    };
    fetchExisting();

    const channel = supabase
      .channel(`visual-trace-${nodeId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'visual_generations' },
        (payload) => {
          if (
            allVisualIds.includes(payload.new.id) &&
            payload.new.status === 'completed'
          ) {
            setVisualUrls((prev) => ({ ...prev, [payload.new.id]: payload.new.image_url }));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [scenes, nodeId]);

  useEffect(() => {
    const handleTrigger = () => setIsInsightOpen(true);
    window.addEventListener('constellation-open-verification', handleTrigger);
    return () => window.removeEventListener('constellation-open-verification', handleTrigger);
  }, []);

  return (
    <div className="flex flex-col w-full relative space-y-12">

      {/* --- MODULE ARCHITECTURE HEADER --- */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-full mx-auto px-2"
        >
          <div className="p-12 rounded-[4rem] bg-white/[0.01] border border-[#A7DADB]/20 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#A7DADB]/40 to-transparent" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-[2rem] bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center shadow-2xl">
                  <Workflow size={32} className="text-[#A7DADB]" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-heading">
                    {moduleTitle}
                  </h1>
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-xl bg-[#A7DADB]/5 border border-[#A7DADB]/10 flex items-center gap-3">
                      <Layers size={14} className="text-[#A7DADB]" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {scenes.length} Strategic Sections
                      </span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <span className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">
                      Instructional Architecture v2.0
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-white/5 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {scenes.map((s, i) => (
                <div
                  key={s.id}
                  className="flex-shrink-0 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group cursor-default hover:border-[#A7DADB]/20 transition-all"
                >
                  <span className="text-[10px] font-mono font-bold text-[#A7DADB]/40 group-hover:text-[#A7DADB] transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    {s.title.split(':')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* --- SCENE BENTO GRID --- */}
      <div className="w-full max-w-full mx-auto px-2 space-y-32 pb-60">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="space-y-12 py-20">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-16 rounded-[4rem] bg-white/[0.01] border border-white/5 animate-pulse space-y-10"
                >
                  <div className="h-8 w-1/3 bg-white/5 rounded-full" />
                  <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 h-64 bg-white/5 rounded-[2.5rem]" />
                    <div className="h-64 bg-white/5 rounded-[2.5rem]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            scenes.map((scene, sIdx) => {
              const url = scene.visualId ? visualUrls[scene.visualId] : null;
              const prompt = scene.visualId ? visualPrompts[scene.visualId] : null;

              return (
                <motion.section
                  key={scene.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: sIdx * 0.1 }}
                  className="space-y-12"
                >
                  <div className="flex items-center gap-8 px-10">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <h2 className="text-xl font-black text-white uppercase tracking-[0.6em] font-heading opacity-60 italic">
                      {scene.title}
                    </h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>

                  <div className="flex flex-wrap gap-8 items-stretch">
                    {/* ROW 1: 70/30 ASYMMETRIC SPLIT */}
                    <div className="w-full flex flex-wrap gap-8 items-stretch">
                      {/* Narration */}
                      <div className="flex-[2.5] min-w-[min(100%,600px)] p-14 rounded-[3.5rem] bg-white/[0.015] border border-white/[0.05] shadow-2xl relative overflow-hidden group/nar">
                        <div className="absolute top-8 left-10 flex items-center gap-4 text-[#A7DADB]/30 uppercase tracking-[0.4em] text-[9px] font-black group-hover/nar:text-[#A7DADB]/60 transition-colors">
                          <Mic2 size={14} /> Spoken Payload
                        </div>
                        <div className="mt-10 prose prose-invert max-w-none text-[1.2rem] font-medium leading-[1.7] text-white/90 italic tracking-tight">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {scene.narration || 'No narration defined.'}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Visual */}
                      <div
                        className={cn(
                          'transition-all duration-500 relative shadow-2xl group/viz flex flex-col',
                          expandedSceneId === scene.id
                            ? 'fixed inset-x-0 top-24 bottom-0 z-[100] bg-[#020617] p-12 overflow-y-auto'
                            : 'flex-1 min-w-[min(100%,350px)] rounded-[3.5rem] bg-black/40 border border-[#A7DADB]/20 overflow-hidden'
                        )}
                      >
                        <div className="absolute top-8 left-10 z-20 flex items-center gap-4 text-[#A7DADB]/30 uppercase tracking-[0.4em] text-[9px] font-black group-hover/viz:text-[#A7DADB] transition-colors">
                          <Eye size={14} /> Art Direction
                        </div>
                        {expandedSceneId === scene.id && (
                          <button
                            onClick={() => setExpandedSceneId(null)}
                            className="absolute top-8 right-10 z-30 p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-rose-500/20 hover:text-rose-500 transition-all"
                          >
                            <X size={20} />
                          </button>
                        )}

                        {url ? (
                          <div
                            className={cn(
                              'flex flex-col min-h-0',
                              expandedSceneId === scene.id ? 'h-full' : 'flex-1'
                            )}
                          >
                            <div
                              className={cn(
                                'relative flex items-center justify-center cursor-pointer group/img transition-all',
                                expandedSceneId === scene.id
                                  ? 'flex-1 p-0'
                                  : 'flex-1 p-12 mt-4'
                              )}
                              onClick={() =>
                                setExpandedSceneId(
                                  expandedSceneId === scene.id ? null : scene.id
                                )
                              }
                            >
                              <div className="absolute inset-0 bg-[#A7DADB]/0 group-hover/img:bg-[#A7DADB]/5 transition-colors z-10 rounded-3xl" />
                              {expandedSceneId !== scene.id && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/img:opacity-100 z-20 transition-all">
                                  <div className="p-4 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl">
                                    <Eye size={24} className="text-[#A7DADB]" />
                                  </div>
                                </div>
                              )}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt="Scene Mockup"
                                className={cn(
                                  'object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)] transition-all duration-500',
                                  expandedSceneId === scene.id
                                    ? 'max-w-[90vw] max-h-[70vh] rounded-[3rem]'
                                    : 'max-w-full max-h-full rounded-2xl group-hover/img:scale-[1.02]'
                                )}
                              />
                              {expandedSceneId === scene.id && prompt && (
                                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity z-30">
                                  <div className="max-w-4xl mx-auto space-y-4">
                                    <span className="text-[10px] font-black text-[#A7DADB] uppercase tracking-[0.4em]">
                                      Neural Trace: Generation Directive
                                    </span>
                                    <p className="text-sm font-mono text-slate-400 leading-relaxed bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                      {prompt}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div
                              className={cn(
                                'p-10 bg-white/[0.02] border-t border-white/5 space-y-4',
                                expandedSceneId === scene.id &&
                                  'max-w-4xl mx-auto w-full border-none bg-transparent'
                              )}
                            >
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-[#A7DADB]/40 uppercase tracking-[0.3em]">
                                  Institutional Art Direction
                                </span>
                                <p
                                  className={cn(
                                    'text-slate-500 leading-relaxed italic transition-all',
                                    expandedSceneId === scene.id
                                      ? 'text-lg text-slate-300'
                                      : 'text-[10px] line-clamp-3'
                                  )}
                                >
                                  {scene.visual.artDirection}
                                </p>
                              </div>
                              <div className="text-[8px] font-mono text-[#A7DADB] uppercase tracking-tighter pt-2 border-t border-white/[0.02] drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] opacity-80">
                                * Neural Trace: AI generated mockup for reference purposes only.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center min-h-[400px]">
                            <GenerativePlaceholder
                              status={scene.visualId ? 'processing' : 'pending'}
                              scale={scale}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ROW 2: Activity / Branching / Notes */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="p-10 rounded-[3rem] bg-indigo-500/[0.02] border border-indigo-500/20 shadow-xl space-y-6 group/act">
                        <div className="flex items-center gap-4 text-indigo-400/50 uppercase tracking-[0.3em] text-[9px] font-black group-hover/act:text-indigo-400 transition-colors">
                          <MousePointer2 size={14} /> Engagement Protocol
                        </div>
                        <div className="text-[1rem] font-bold text-indigo-100/80 leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {scene.activity || 'Passive Consumption'}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="p-10 rounded-[3rem] bg-black/40 border border-[#A7DADB]/20 shadow-xl space-y-6 group/log">
                        <div className="flex items-center gap-4 text-[#A7DADB]/40 uppercase tracking-[0.3em] text-[9px] font-black group-hover/log:text-[#A7DADB] transition-colors">
                          <GitBranch size={14} /> Architectural Logic
                        </div>
                        <div className="text-[0.9rem] font-mono text-[#A7DADB]/70 leading-relaxed bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {scene.branching || 'Linear Logic Flow'}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="p-10 rounded-[3rem] bg-white/[0.01] border border-white/5 shadow-xl space-y-6 group/not">
                        <div className="flex items-center gap-4 text-slate-600 uppercase tracking-[0.3em] text-[9px] font-black group-hover/not:text-slate-400 transition-colors">
                          <StickyNote size={14} /> Notes
                        </div>
                        <div className="text-[0.95rem] text-slate-500 italic leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {scene.speakerNotes || 'Standard operational guidelines apply.'}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* --- VERIFICATION MODAL --- */}
      <Modal
        open={isInsightOpen}
        onClose={() => setIsInsightOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backdropFilter: 'blur(40px)', bgcolor: 'rgba(2, 6, 23, 0.98)' },
        }}
      >
        <Fade in={isInsightOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '95%',
              maxWidth: '800px',
              maxHeight: '85vh',
              bgcolor: '#020617',
              border: '1px solid rgba(167, 218, 219, 0.1)',
              borderRadius: '60px',
              p: { xs: 6, md: 10 },
              outline: 'none',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 0 100px rgba(0,0,0,0.8)',
            }}
          >
            <div className="flex justify-between items-center mb-20 shrink-0">
              <div className="flex items-center gap-8">
                <div className="p-5 rounded-[2rem] bg-[#A7DADB]/10 border border-[#A7DADB]/20 shadow-2xl">
                  <Activity size={32} className="text-[#A7DADB]" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2 font-heading">
                    Knowledge Verification
                  </h2>
                  <p className="text-[11px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">
                    Strategic Integrity Protocol
                  </p>
                </div>
              </div>
              <IconButton
                onClick={() => setIsInsightOpen(false)}
                sx={{
                  color: '#A7DADB',
                  bgcolor: 'rgba(167, 218, 219, 0.05)',
                  p: 2,
                  borderRadius: '20px',
                  '&:hover': { bgcolor: 'rgba(167, 218, 219, 0.1)' },
                }}
              >
                <X size={28} />
              </IconButton>
            </div>
            <div className="space-y-24 overflow-y-auto custom-scrollbar pr-4 flex-1">
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <History size={16} className="text-[#A7DADB]" />
                  <h4 className="text-[11px] text-slate-500 uppercase tracking-[0.5em] font-black">
                    Semantic Integrity Pass
                  </h4>
                </div>
                <div className="p-12 rounded-[3rem] bg-white/[0.01] border border-white/[0.05] relative overflow-hidden backdrop-blur-3xl">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#A7DADB]/40 to-transparent" />
                  <div className="text-lg text-slate-400 leading-relaxed font-light italic">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {semanticDelta || 'Synthesizing truth anchors...'}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <BookOpen size={16} className="text-[#A7DADB]" />
                  <h4 className="text-[11px] text-slate-500 uppercase tracking-[0.5em] font-black">
                    Verified Institutional Citations
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  {citations.map((cite, i) => (
                    <div
                      key={i}
                      className="flex gap-8 items-center p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.03] hover:border-[#A7DADB]/20 transition-all group/cite"
                    >
                      <div className="text-[11px] font-mono font-black text-[#A7DADB] bg-[#A7DADB]/10 w-10 h-10 flex items-center justify-center rounded-2xl border border-[#A7DADB]/20 group-hover/cite:bg-[#A7DADB] group-hover/cite:text-black transition-all">
                        {i + 1}
                      </div>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate">
                        {cite}
                      </span>
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
        <ChevronRight
          size={32}
          className="-rotate-90 group-hover:-translate-y-1 transition-transform"
        />
      </button>
    </div>
  );
};

export default ScriptDraftingWorkspace;
