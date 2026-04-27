"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
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
  PackageCheck,
  Binary,
  Target,
  ShieldCheck,
  ShieldAlert,
  ScrollText,
  Database,
  History,
  Activity
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton, Modal, Fade, Box } from '@mui/material';
import { supabase } from '@/lib/supabase';
import { useSidebar } from '@/lib/SidebarContext';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

// --- SUB-COMPONENTS ---

const GenerativePlaceholder = ({ status, error, scale }: { status: string, error?: string, scale: number }) => {
  const [fakeProgress, setFakeProgress] = useState(0);
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (status === 'pending') setFakeProgress(15);
    if (status === 'processing') {
      setFakeProgress(20);
      interval = setInterval(() => { setFakeProgress(prev => prev >= 92 ? prev : prev + 1); }, 350);
    }
    if (status === 'completed') setFakeProgress(100);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  if (status === 'failed') return (
    <div className="absolute inset-0 bg-rose-950/20 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
       <AlertCircle size={24 * scale} className="text-rose-500 mb-4" />
       <h4 className="text-white font-bold uppercase tracking-tighter text-sm mb-2">Synthesis Failed</h4>
       <p className="text-[8px] font-mono text-rose-400/60 uppercase">Error: {error || "Neural Interruption"}</p>
    </div>
  );

  return (
    <div className="relative w-full h-full bg-[#020617] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#A7DADB_0%,_transparent_70%)]" />
      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-[80%] text-center">
         <Sparkles size={24 * scale} className="text-[#A7DADB] animate-pulse" />
         <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${fakeProgress}%` }} className="h-full bg-[#A7DADB]" />
         </div>
         <span className="text-[8px] font-black text-[#A7DADB]/40 uppercase tracking-[0.3em]">{status === 'pending' ? 'Syncing' : 'Synthesizing'} {fakeProgress}%</span>
      </div>
    </div>
  );
};

// --- TYPES ---

interface Artifact {
  type: '[VISUAL]' | '[NARRATION]' | '[ACTIVITY]' | '[BRANCHING]' | '[NOTES]' | '[DIRECTIVE]';
  content: string;
  visualId?: string;
}

interface SceneGroup {
  id: string;
  title: string;
  artifacts: Artifact[];
}

interface ScriptDraftingWorkspaceProps {
  content: string;
  isLoading: boolean;
  semanticDelta?: string;
  citations: string[];
  deliverables: string[];
  auditLog: string[];
  nodeId: string;
  schematic?: unknown;
  state?: unknown;
}

const ScriptDraftingWorkspace: React.FC<ScriptDraftingWorkspaceProps> = ({
  content,
  isLoading,
  semanticDelta,
  citations,
  deliverables,
  auditLog,
  nodeId,
  schematic,
  state: globalState
}) => {
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [visualUrls, setVisualUrls] = useState<Record<string, string>>({}); 
  const [visualPrompts, setVisualPrompts] = useState<Record<string, string>>({}); 
  const { collapsed } = useSidebar();
  const scale = collapsed ? 1.0 : 0.88;

  // --- HYPER-RESILIENT GLOBAL PARSER (V8 - Anchor-Free & Case-Resilient) ---
  const { scenes, moduleTitle } = useMemo(() => {
    const sceneGroups: SceneGroup[] = [];
    if (!content) return { scenes: [], moduleTitle: 'Instructional Trace' };
    
    // 1. Structural Normalization
    // Strip bolding and horizontal rules which break boundaries
    const cleanContent = content
      .replace(/\*\*\[/g, '[')
      .replace(/\]\*\*/g, ']')
      .replace(/\*\*(SCENE|SCREEN|SLIDE|Scene|Screen|Slide)\s*(\d+).*?\*\*/gi, '$1 $2')
      .replace(/^-{3,}/gm, ''); 
    
    // 2. Extract Module Title
    const titleMatch = cleanContent.match(/Storyboard Constellation:\s*(.*)/i);
    const mTitle = titleMatch ? titleMatch[1].replace(/[*#]/g, '').trim() : 'Instructional Trace';

    // 3. Precise Tokenization
    // Boundary anchors: Start of line SCENE/SCREEN or [TAG]
    const tokenRegex = /((?:^|\n)\s*(?:###|##|#)?\s*(?:SCENE|SCREEN|SLIDE|Scene|Screen|Slide)\s*\d+.*)|(\[(?:VISUAL(?:\s*:\s*[a-f0-9-]*)?|NARRATION|ACTIVITY|BRANCHING|SPEAKER_NOTES|VISUAL_PROMPT|NOTES)\])/gi;
    
    const parts = cleanContent.split(tokenRegex);

    let currentScene: SceneGroup = { id: 'scene-0', title: 'Sequence Opening', artifacts: [] };
    let currentArtifact: Artifact | null = null;
    let sceneCount = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === undefined || part === '') continue;

      const isSceneHeader = /^\s*(?:###|##|#)?\s*(?:SCENE|SCREEN|SLIDE|Scene|Screen|Slide)\s*\d+/i.test(part.trim());
      const isTag = part.trim().startsWith('[') && part.trim().endsWith(']');

      if (isSceneHeader) {
        if (currentScene.artifacts.length > 0 || currentArtifact) {
          if (currentArtifact) currentScene.artifacts.push(currentArtifact);
          sceneGroups.push(currentScene);
          currentArtifact = null;
        }

        sceneCount++;
        currentScene = {
          id: `scene-${sceneCount}`,
          title: part.trim().replace(/^[#*\s]*/, '').replace(/\*+$/, '').trim() || `Screen ${sceneCount}`,
          artifacts: []
        };
      } else if (isTag) {
        if (currentArtifact) {
          currentScene.artifacts.push(currentArtifact);
        }

        const rawTag = part.trim().slice(1, -1);
        const [tagType, tagId] = rawTag.split(':').map(s => s.trim());
        const typeStr = tagType.toUpperCase();
        
        if (typeStr === 'VISUAL_PROMPT') {
          currentArtifact = { type: '[DIRECTIVE]', content: '' };
        } else {
          let typeValStr = typeStr;
          if (typeValStr === 'SPEAKER_NOTES') typeValStr = 'NOTES';

          currentArtifact = {
            type: `[${typeValStr}]` as Artifact['type'],
            visualId: tagId, // Preserve original UUID casing
            content: ''
          };
        }
      } else {
        const cleanText = part.trim();
        if (!cleanText) continue;

        if (currentArtifact) {
          currentArtifact.content += (currentArtifact.content ? '\n' : '') + cleanText;
        } else {
          currentArtifact = { type: '[NARRATION]', content: cleanText };
        }
      }
    }

    if (currentArtifact) currentScene.artifacts.push(currentArtifact);
    if (currentScene.artifacts.length > 0) sceneGroups.push(currentScene);

    return { scenes: sceneGroups, moduleTitle: mTitle };
  }, [content]);

  // --- REAL-TIME SYNC ---
  useEffect(() => {
    const allVisualIds = scenes.flatMap(s => s.artifacts).filter(a => a.visualId).map(a => a.visualId!);
    if (allVisualIds.length === 0) return;

    const fetchExisting = async () => {
      const { data } = await supabase.from('visual_generations').select('id, image_url, prompt, status').in('id', allVisualIds).eq('status', 'completed');
      if (data) {
        const urlMap: Record<string, string> = {};
        const promptMap: Record<string, string> = {};
        data.forEach(g => { 
          if(g.image_url) urlMap[g.id] = g.image_url; 
          if(g.prompt) promptMap[g.id] = g.prompt;
        });
        setVisualUrls(prev => ({ ...prev, ...urlMap }));
        setVisualPrompts(prev => ({ ...prev, ...promptMap }));
      }
    };
    fetchExisting();

    const channel = supabase.channel(`visual-trace-${nodeId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'visual_generations' }, (payload) => {
      if (allVisualIds.includes(payload.new.id) && payload.new.status === 'completed') {
        setVisualUrls(prev => ({ ...prev, [payload.new.id]: payload.new.image_url }));
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [scenes, nodeId]);

  useEffect(() => {
    const handleTrigger = () => setIsInsightOpen(true);
    window.addEventListener('constellation-open-verification', handleTrigger);
    return () => {
      window.removeEventListener('constellation-open-verification', handleTrigger);
    };
  }, []);

  return (
    <div className="flex flex-col w-full relative space-y-12">
      
      {/* --- MODULE ARCHITECTURE HEADER --- */}
      {!isLoading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-full mx-auto px-2">
           <div className="p-12 rounded-[4rem] bg-white/[0.01] border border-[#A7DADB]/20 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#A7DADB]/40 to-transparent" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
                 <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[2rem] bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center shadow-2xl">
                       <Workflow size={32} className="text-[#A7DADB]" />
                    </div>
                    <div className="space-y-2">
                       <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-heading">{moduleTitle}</h1>
                       <div className="flex items-center gap-4">
                          <div className="px-4 py-1.5 rounded-xl bg-[#A7DADB]/5 border border-[#A7DADB]/10 flex items-center gap-3">
                             <Layers size={14} className="text-[#A7DADB]" />
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">{scenes.length} Strategic Sections</span>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                          <span className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Instructional Architecture v1.0</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="mt-12 pt-10 border-t border-white/5 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                 {scenes.map((s, i) => (
                   <div key={s.id} className="flex-shrink-0 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group cursor-default hover:border-[#A7DADB]/20 transition-all">
                      <span className="text-[10px] font-mono font-bold text-[#A7DADB]/40 group-hover:text-[#A7DADB] transition-colors">{String(i+1).padStart(2, '0')}</span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{s.title.split(':')[0]}</span>
                   </div>
                 ))}
              </div>
           </div>
        </motion.div>
      )}

      {/* --- PRODUCTION SUMMARY --- */}
      {!isLoading && ((deliverables && deliverables.length > 0) || (auditLog && auditLog.length > 0)) && (
         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="w-full max-w-full px-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="p-10 rounded-[3rem] bg-indigo-500/[0.02] border border-indigo-500/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden flex flex-col gap-8">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#4F46E5]" />
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 rounded-2xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center">
                        <PackageCheck size={24} className="text-[#4F46E5]" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Production Deliverables</h3>
                        <p className="text-[9px] font-black text-indigo-400/60 uppercase tracking-[0.4em]">Developer Handoff Packet</p>
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                     {deliverables.map((item, i) => (
                       <div key={i} className="px-5 py-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 group hover:border-[#4F46E5]/40 transition-all">
                          <Target size={12} className="text-slate-600 group-hover:text-[#4F46E5]" />
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">{item}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="p-10 rounded-[3rem] bg-[#A7DADB]/[0.02] border border-[#A7DADB]/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden flex flex-col gap-8">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#A7DADB]" />
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 rounded-2xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center">
                        <ShieldCheck size={24} className="text-[#A7DADB]" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Integrity Checkpoints</h3>
                        <p className="text-[9px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Sentinel Compliance Log</p>
                     </div>
                  </div>
                  <div className="flex flex-col gap-3">
                     {auditLog.slice(0, 3).map((item, i) => (
                       <div key={i} className="flex gap-4 items-center">
                          <div className="w-1 h-1 rounded-full bg-[#A7DADB]" />
                          <span className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{item}</span>
                       </div>
                     ))}
                     {auditLog.length > 3 && (
                       <span className="text-[9px] font-mono text-[#A7DADB]/40 mt-2 uppercase tracking-tighter">+ {auditLog.length - 3} additional integrity marks</span>
                     )}
                  </div>
               </div>
            </div>
         </motion.div>
      )}

      {/* --- SCENE BENTO GRID --- */}
      <div className="w-full max-w-full mx-auto px-2 space-y-32 pb-60">
        <AnimatePresence mode="wait">
          {isLoading ? (
             <div className="space-y-12 py-20">
                {[1,2].map(i => (
                  <div key={i} className="p-16 rounded-[4rem] bg-white/[0.01] border border-white/5 animate-pulse space-y-10">
                     <div className="h-8 w-1/3 bg-white/5 rounded-full" />
                     <div className="grid grid-cols-3 gap-8">
                        <div className="col-span-2 h-64 bg-white/5 rounded-[2.5rem]" />
                        <div className="h-64 bg-white/5 rounded-[2.5rem]" />
                     </div>
                  </div>
                ))}
             </div>
          ) : (
            scenes.map((scene, sIdx) => (
              <motion.section 
                key={scene.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: sIdx * 0.1 }}
                className="space-y-12"
              >
                 <div className="flex items-center gap-8 px-10">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <h2 className="text-xl font-black text-white uppercase tracking-[0.6em] font-heading opacity-60 italic">{scene.title}</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                 </div>

                 <div className="flex flex-wrap gap-8 items-stretch">
                    <div className="w-full flex flex-wrap gap-8 items-stretch">
                       <div className="flex-[2.5] min-w-[min(100%,600px)] p-14 rounded-[3.5rem] bg-white/[0.015] border border-white/[0.05] shadow-2xl relative overflow-hidden group/nar">
                          <div className="absolute top-8 left-10 flex items-center gap-4 text-[#A7DADB]/30 uppercase tracking-[0.4em] text-[9px] font-black group-hover/nar:text-[#A7DADB]/60 transition-colors">
                             <Mic2 size={14} /> Spoken Payload
                          </div>
                          <div className="mt-10 prose prose-invert max-w-none text-[1.2rem] font-medium leading-[1.7] text-white/90 italic tracking-tight">
                             <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                               {scene.artifacts.find(a => a.type === '[NARRATION]')?.content || "No narration defined."}
                             </ReactMarkdown>
                          </div>
                       </div>
                       <div className={cn(
                          "transition-all duration-500 relative shadow-2xl group/viz flex flex-col",
                          expandedSceneId === scene.id 
                            ? "fixed inset-x-0 top-24 bottom-0 z-[100] bg-[#020617] p-12 overflow-y-auto" 
                            : "flex-1 min-w-[min(100%,350px)] rounded-[3.5rem] bg-black/40 border border-[#A7DADB]/20 overflow-hidden"
                       )}>
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

                          {(() => {
                             const vis = scene.artifacts.find(a => a.type === '[VISUAL]');
                             const directive = scene.artifacts.find(a => a.type === '[DIRECTIVE]');
                             const url = vis?.visualId ? visualUrls[vis.visualId] : null;
                             const prompt = vis?.visualId ? visualPrompts[vis.visualId] : null;
                             
                             return url ? (
                               <div key={vis?.visualId} className={cn(
                                 "flex flex-col min-h-0",
                                 expandedSceneId === scene.id ? "h-full" : "flex-1"
                               )}>
                                 <div 
                                   className={cn(
                                     "relative flex items-center justify-center cursor-pointer group/img transition-all",
                                     expandedSceneId === scene.id ? "flex-1 p-0" : "flex-1 p-12 mt-4"
                                   )}
                                   onClick={() => setExpandedSceneId(expandedSceneId === scene.id ? null : scene.id)}
                                 >
                                   <div className="absolute inset-0 bg-[#A7DADB]/0 group-hover/img:bg-[#A7DADB]/5 transition-colors z-10 rounded-3xl" />
                                   
                                   {expandedSceneId !== scene.id && (
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/img:opacity-100 z-20 transition-all">
                                        <div className="p-4 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl">
                                           <Eye size={24} className="text-[#A7DADB]" />
                                        </div>
                                     </div>
                                   )}

                                   <img 
                                      src={url} 
                                      alt="Scene Mockup" 
                                      loading="lazy"
                                      className={cn(
                                        "object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)] transition-all duration-500",
                                        expandedSceneId === scene.id ? "max-w-[90vw] max-h-[70vh] rounded-[3rem]" : "max-w-full max-h-full rounded-2xl group-hover/img:scale-[1.02]"
                                      )}
                                   />
                                 </div>

                                 <div className={cn(
                                   "p-10 bg-white/[0.02] border-t border-white/5 space-y-4",
                                   expandedSceneId === scene.id && "max-w-4xl mx-auto w-full border-none bg-transparent"
                                 )}>
                                    <div className="space-y-4">
                                       <div className="space-y-1">
                                          <span className="text-[8px] font-black text-[#A7DADB]/40 uppercase tracking-[0.3em]">Institutional Art Direction</span>
                                          <p className={cn(
                                            "text-slate-500 leading-relaxed italic transition-all",
                                            expandedSceneId === scene.id ? "text-lg text-slate-300" : "text-[10px] line-clamp-3"
                                          )}>
                                             {vis?.content}
                                          </p>
                                       </div>
                                       
                                       {(directive || prompt) && (
                                          <div className="p-4 rounded-xl bg-[#A7DADB]/5 border border-[#A7DADB]/10 space-y-2">
                                             <div className="flex items-center gap-2 text-[#A7DADB]/60 uppercase tracking-[0.2em] text-[7px] font-black">
                                                <Binary size={10} /> Neural Generation Directive
                                             </div>
                                             <p className="text-[9px] font-mono text-slate-400 leading-normal">{prompt || directive?.content}</p>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex-1 flex items-center justify-center min-h-[400px]">
                                 <GenerativePlaceholder status={vis?.visualId ? 'processing' : 'pending'} scale={scale} />
                               </div>
                             );
                          })()}
                       </div>
                    </div>

                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="p-10 rounded-[3rem] bg-indigo-500/[0.02] border border-indigo-500/10 shadow-xl space-y-6 group/act">
                          <div className="flex items-center gap-4 text-indigo-400/50 uppercase tracking-[0.3em] text-[9px] font-black group-hover/act:text-indigo-400 transition-colors">
                             <MousePointer2 size={14} /> Engagement Protocol
                          </div>
                          <div className="text-[1rem] font-bold text-indigo-100/80 leading-relaxed">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                               {scene.artifacts.find(a => a.type === '[ACTIVITY]')?.content || "Passive Consumption"}
                             </ReactMarkdown>
                          </div>
                       </div>
                       <div className="p-10 rounded-[3rem] bg-black/40 border border-[#A7DADB]/20 shadow-xl space-y-6 group/log">
                          <div className="flex items-center gap-4 text-[#A7DADB]/40 uppercase tracking-[0.3em] text-[9px] font-black group-hover/log:text-[#A7DADB] transition-colors">
                             <GitBranch size={14} /> Architectural Logic
                          </div>
                          <div className="text-[0.9rem] font-mono text-[#A7DADB]/70 leading-relaxed bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                               {scene.artifacts.find(a => a.type === '[BRANCHING]')?.content || "Linear Logic Flow"}
                             </ReactMarkdown>
                          </div>
                       </div>
                       <div className="p-10 rounded-[3rem] bg-white/[0.01] border border-white/5 shadow-xl space-y-6 group/not">
                          <div className="flex items-center gap-4 text-slate-600 uppercase tracking-[0.3em] text-[9px] font-black group-hover/not:text-slate-400 transition-colors">
                             <StickyNote size={14} /> Notes
                          </div>
                          <div className="text-[0.95rem] text-slate-500 italic leading-relaxed">
                             <ReactMarkdown 
                               remarkPlugins={[remarkGfm]}
                               components={{
                                 hr: () => null 
                               }}
                             >
                               {scene.artifacts.find(a => a.type === '[NOTES]')?.content || "Standard operational guidelines apply."}
                             </ReactMarkdown>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.section>
            ))
          )}
        </AnimatePresence>
      </div>

      <Modal open={isInsightOpen} onClose={() => setIsInsightOpen(false)} closeAfterTransition slotProps={{ backdrop: { timeout: 500, sx: { backdropFilter: 'blur(32px)', bgcolor: 'rgba(2, 6, 23, 0.95)' } } }}>
        <Fade in={isInsightOpen}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '95%', maxWidth: '1000px', maxHeight: '85vh', bgcolor: '#020617', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '48px', p: 10, outline: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 100px rgba(0,0,0,0.8)' }}>
             <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center">
                      <Activity size={28} className="text-[#A7DADB]" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Knowledge Verification</h3>
                      <p className="text-[9px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Strategic Integrity Protocol</p>
                   </div>
                </div>
                <IconButton onClick={() => setIsInsightOpen(false)} sx={{ color: '#A7DADB' }}><X size={28} /></IconButton>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-20">
                <section className="space-y-6">
                   <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                      <History size={14} /> Semantic Strategic Alignment
                   </div>
                   <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 prose prose-invert prose-sm max-w-none shadow-inner">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {semanticDelta || "Waiting for constellation mapping to complete integrity pass..."}
                      </ReactMarkdown>
                   </div>
                </section>

                {auditLog && auditLog.length > 0 && (
                   <section className="space-y-6">
                      <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                         <ShieldAlert size={14} /> Sentinel Compliance Audit
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                         {auditLog.map((log: string, i: number) => (
                           <div key={i} className="flex gap-4 items-start p-6 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-[#A7DADB]/20 transition-all">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#A7DADB] mt-1.5" />
                              <span className="text-[12px] font-bold text-slate-400">{log}</span>
                           </div>
                         ))}
                      </div>
                   </section>
                )}

                {!!schematic && (
                   <section className="space-y-6">
                      <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                         <Workflow size={14} /> Tactical Schematic (Architect)
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/[0.03] overflow-hidden">
                         <pre className="text-[10px] text-[#A7DADB]/80 font-mono whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(schematic, null, 2)}
                         </pre>
                      </div>
                   </section>
                )}

                {!!globalState && (
                   <section className="space-y-6">
                      <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                         <Database size={14} /> Global Constellation State (Memory)
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/[0.03] overflow-hidden">
                         <pre className="text-[10px] text-indigo-300/80 font-mono whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(globalState, null, 2)}
                         </pre>
                      </div>
                   </section>
                )}

                <section className="space-y-6">
                   <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                      <ScrollText size={14} /> Verified Institutional Citations
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

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-12 right-12 w-20 h-20 rounded-full bg-[#020617] border border-[#A7DADB]/30 flex items-center justify-center text-[#A7DADB] hover:bg-[#A7DADB] hover:text-black transition-all shadow-2xl backdrop-blur-3xl group z-50 hover:scale-110"><ChevronRight size={32} className="-rotate-90 group-hover:-translate-y-1 transition-transform" /></button>
    </div>
  );
};

export default ScriptDraftingWorkspace;
