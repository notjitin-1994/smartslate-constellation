// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled

"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Target, 
  Database,
  ShieldCheck,
  Code2,
  Users,
  Trophy,
  ClipboardCheck,
  Lightbulb,
  Workflow,
  X,
  Dna,
  Cloud
} from 'lucide-react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Chip, 
  IconButton,
  Tooltip,
  Modal,
  Backdrop,
  Fade
} from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { useConstellationPersistence } from '@/lib/hooks/useConstellationPersistence';
import { useSidebar } from '@/lib/SidebarContext';

// --- DYNAMIC IMPORTS FOR PERFORMANCE ---
const KnowledgeVaultModal = dynamic(() => import('@/components/blueprints/KnowledgeVaultModal').then(mod => mod.KnowledgeVaultModal), {
  ssr: false,
  loading: () => <CircularProgress size={20} />
});

const ScriptDraftingWorkspace = dynamic(() => import('@/components/blueprints/ScriptDraftingWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-64 gap-4 animate-pulse">
      <div className="h-4 w-48 bg-white/5 rounded-full" />
      <div className="h-2 w-32 bg-white/5 rounded-full" />
    </div>
  )
});

// --- CONSTELLATION ZEN DESIGN SYSTEM ---
const COLORS = {
  bg: '#020617',
  surface: '#0F172A',
  primary: '#818CF8',
  secondary: '#38BDF8',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  accentGlow: 'rgba(129, 140, 248, 0.15)',
};

// --- TYPES ---
interface ModuleData {
  id: string;
  title: string;
  description: string;
  pedagogicalMode: string;
  cognitiveLoad: number;
  scaffolding: string;
  assetGroundingStatus: string;
  groundingTypes?: string[];
  targetModality: string;
  modalityRationale?: string;
  learning_activities?: Array<{ type: string; activity: string; duration: string }>;
}

interface Blueprint {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blueprint_json?: any;
}

const extractEnrichedModules = (blueprint: Blueprint | null): ModuleData[] => {
  if (!blueprint) return [];
  const bj = blueprint.blueprint_json || {};
  const modules = bj.content_outline?.modules || [];
  const globalModalities = bj.instructional_strategy?.modalities || [];

  return modules.map((mod: Record<string, unknown>, i: number) => {
    const deliveryMethod = String(mod.delivery_method || '').toLowerCase();
    const matchedModality = globalModalities.find((m: { type: string }) => {
      const typeWords = m.type.toLowerCase().split(/[\s()/-]+/);
      const deliveryWords = deliveryMethod.split(/[\s()/-]+/);
      return deliveryWords.some(dw => dw.length > 2 && typeWords.includes(dw)) ||
             typeWords.some(tw => tw.length > 2 && deliveryWords.includes(tw));
    }) || globalModalities[0] || { type: 'Standard eLearning', rationale: 'Default delivery method.' };

    return {
      title: String(mod.title || ''),
      description: String(mod.description || ''),
      learning_activities: Array.isArray(mod.learning_activities) ? (mod.learning_activities as Array<{ type: string; activity: string; duration: string }>) : [],
      id: `NODE_0${i + 1}`,
      pedagogicalMode: i === 0 ? 'ACTIVATION' : mod.assessment ? 'APPLICATION' : 'DEMONSTRATION',
      cognitiveLoad: 0,
      scaffolding: 'MEDIUM',
      assetGroundingStatus: 'PENDING',
      targetModality: matchedModality.type,
      modalityRationale: matchedModality.rationale
    };
  });
};

function ArchitectureCanvasContent() {
  const searchParams = useSearchParams();
  const blueprintId = searchParams.get('blueprintId');
  const [loading, setLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showUlsPreview, setShowUlsPreview] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const router = useRouter();

  // --- SIDEBAR INTEGRATION ---
  const { setIsConstellationMode } = useSidebar();

  // --- PERSISTENCE HOOK ---
  const { state, updateState, isSyncing, constellationId } = useConstellationPersistence(blueprintId);

  useEffect(() => {
    const fetchBlueprint = async () => {
      if (!blueprintId) { setLoading(false); return; }
      try {
        setLoading(true);
        const { data, error: bpError } = await supabase.from('blueprint_generator').select('*').eq('id', blueprintId).single();
        if (bpError) throw bpError;
        setBlueprint(data as Blueprint);

        // --- AUTO-HARVEST BLUEPRINT DATA ---
        fetch('/api/ingest/harvest-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          body: JSON.stringify({ blueprintId, blueprintJson: (data as any).blueprint_json })
        }).catch(err => console.error('Auto-Harvest Failed:', err));

      } catch (err: unknown) {
        console.error('Canvas Fetch Error:', err);
        router.push('/handover');
      } finally { setLoading(false); }
    };
    fetchBlueprint();
  }, [blueprintId, router]);

  const modules = useMemo(() => {
    const base = extractEnrichedModules(blueprint);
    return base.map((mod, idx) => {
      const output = state.scriptOutputs[idx];
      if (!output) return mod;
      return {
        ...mod,
        cognitiveLoad: output.cognitiveLoadScore,
        assetGroundingStatus: output.hallucinationFlag ? 'WARNING' : 'RESOLVED',
        groundingTypes: output.groundingTypes
      };
    });
  }, [blueprint, state.scriptOutputs]);

  // Sync state to Global Sidebar
  useEffect(() => {
    setIsConstellationMode(true);
    const event = new CustomEvent('constellation-sidebar-sync', { 
      detail: { modules, activeIdx: state.activeNodeIdx } 
    });
    window.dispatchEvent(event);
    return () => setIsConstellationMode(false);
  }, [modules, state.activeNodeIdx, setIsConstellationMode]);

  // Listen for Sidebar selections
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelect = (e: any) => {
      if (typeof e.detail?.idx === 'number') {
        updateState({ activeNodeIdx: e.detail.idx });
      }
    };
    window.addEventListener('constellation-node-select', handleSelect);
    return () => window.removeEventListener('constellation-node-select', handleSelect);
  }, [updateState]);

  const currentModule = modules[state.activeNodeIdx] || null;

  const handleDraftScript = async () => {
    if (!currentModule || !blueprintId) return;
    setIsDrafting(true);
    try {
      const response = await fetch('/api/architect/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentModule.id,
          title: currentModule.title,
          description: currentModule.description,
          pedagogicalMode: currentModule.pedagogicalMode,
          targetModality: currentModule.targetModality,
          blueprintId,
          blueprintContext: blueprint?.blueprint_json 
        }),
      });
      const result = await response.json();
      if (result.success) {
        updateState({ 
          scriptOutputs: { ...state.scriptOutputs, [state.activeNodeIdx]: result.data } 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err: unknown) {
      alert(`Drafting Failed: ${err instanceof Error ? err.message : 'Unknown Error'}`);
    } finally { setIsDrafting(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617]">
      <CircularProgress sx={{ color: COLORS.primary }} size={40} thickness={2} />
    </div>
  );

  const bj = blueprint?.blueprint_json || {};
  const activeScript = state.scriptOutputs[state.activeNodeIdx];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden relative selection:bg-indigo-500/30 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 flex flex-col z-10 overflow-hidden ml-0"> {/* Margin-left handled by ClientLayout's main Sidebar */}
        {/* Global HUD Header */}
        <header className="h-20 flex items-center justify-between px-12 z-20">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsStrategyOpen(true)}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <Dna size={14} className="text-indigo-400 group-hover:rotate-45 transition-transform" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Strategic DNA</span>
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-white tracking-tight leading-none mb-1">{currentModule?.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{currentModule?.id}</span>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{currentModule?.targetModality}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {isSyncing && (
               <div className="flex items-center gap-2 text-indigo-400/50">
                 <Cloud size={14} className="animate-pulse" />
                 <span className="text-[9px] font-bold uppercase tracking-tighter">Syncing...</span>
               </div>
             )}
             <Tooltip title="View ULS Schema">
                <IconButton onClick={() => setShowUlsPreview(true)} sx={{ color: 'slate.500', bgcolor: 'white/5', '&:hover': { bgcolor: 'white/10' } }}><Code2 size={16} /></IconButton>
             </Tooltip>
             <button 
               onClick={() => setIsVaultOpen(true)}
               className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
             >
               <Database size={20} />
             </button>
             <Button 
                variant="contained" 
                onClick={handleDraftScript} 
                disabled={isDrafting}
                className="ml-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full px-8 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
                startIcon={isDrafting ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />}
              >
                Draft Script
              </Button>
          </div>
        </header>

        {/* ZEN EDITOR AREA */}
        <div className="flex-1 overflow-y-auto px-12 pb-12 pt-4 custom-scrollbar">
           <div className="max-w-4xl mx-auto w-full h-full min-h-[80vh] rounded-3xl border border-white/5 bg-[#0F172A]/20 backdrop-blur-sm shadow-2xl relative overflow-hidden">
              {activeScript || isDrafting ? (
                <ScriptDraftingWorkspace 
                  content={activeScript?.script || ""}
                  groundingScore={activeScript?.groundingScore || 0}
                  cognitiveLoadScore={activeScript?.cognitiveLoadScore || 0}
                  hallucinationFlag={activeScript?.hallucinationFlag || false}
                  semanticDelta={activeScript?.semanticDelta}
                  citations={activeScript?.citations || []}
                  isLoading={isDrafting}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                   <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mb-8 relative">
                     <Lightbulb size={40} className="text-indigo-400 relative z-10" />
                     <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Immersive Architecture Workspace</h3>
                   <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
                     Your instructional design canvas is online. Use the <b>Neural Trace</b> sidebar to navigate through strategic nodes.
                   </p>
                   <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left max-w-lg">
                      <div className="p-3 rounded-xl bg-cyan-500/10">
                        <ShieldCheck size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase mb-1">Triple-Pass Integrity Shield</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Your work is automatically persisted locally and synchronized to the cloud ID: <span className="font-mono text-indigo-400">{constellationId?.substring(0, 8)}</span>.</p>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* --- OVERLAY MODALS --- */}

      {/* STRATEGIC DNA MODAL */}
      <Modal
        open={isStrategyOpen}
        onClose={() => setIsStrategyOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(8px)', bgcolor: 'rgba(2, 6, 23, 0.8)' } }}
      >
        <Fade in={isStrategyOpen}>
          <Box sx={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: '1000px', maxHeight: '90vh',
            bgcolor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px',
            p: 6, outline: 'none', overflowY: 'auto', boxShadow: '0 0 50px rgba(0,0,0,0.5)'
          }}>
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                   <Target size={24} className="text-indigo-400" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-extrabold text-white tracking-tight">Strategic DNA</h2>
                   <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Polaris Blueprint Configuration</p>
                 </div>
              </div>
              <IconButton onClick={() => setIsStrategyOpen(false)} sx={{ color: 'slate.500', bgcolor: 'white/5' }}><X /></IconButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <section>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Users size={14} className="text-indigo-400" /> Target Audience
                    </h3>
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                       <div>
                         <span className="text-[10px] text-slate-600 uppercase font-bold block mb-2">Key Roles</span>
                         <div className="flex flex-wrap gap-2">
                           {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                           {bj.target_audience?.demographics?.roles?.map((r: any, i: number) => <Chip key={i} label={r} size="small" sx={{ color: 'white', bgcolor: 'white/5', border: '1px solid rgba(255,255,255,0.05)' }} />)}
                         </div>
                       </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <ClipboardCheck size={14} className="text-emerald-400" /> Assessment Strategy
                    </h3>
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                      <p className="text-sm text-slate-400 leading-relaxed italic">&ldquo;{bj.assessment_strategy?.overview}&rdquo;</p>
                    </div>
                  </section>
               </div>

               <div className="space-y-8">
                  <section>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Workflow size={14} className="text-cyan-400" /> Instructional Logic
                    </h4>
                    <div className="space-y-3">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {bj.instructional_strategy?.modalities?.map((m: any, i: number) => (
                        <div key={i} className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex gap-4">
                           <div>
                             <h4 className="text-sm font-bold text-white mb-1">{m.type}</h4>
                             <p className="text-[11px] text-slate-500 leading-relaxed">{m.rationale}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Trophy size={14} className="text-amber-400" /> Success Metrics
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                       {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                       {bj.success_metrics?.metrics?.map((m: any, i: number) => (
                         <div key={i} className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                            <span className="text-xs text-slate-300 font-medium">{m.metric}</span>
                            <Chip label={m.target} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 800, fontSize: '10px' }} />
                         </div>
                       ))}
                    </div>
                  </section>
               </div>
            </div>
          </Box>
        </Fade>
      </Modal>

      <KnowledgeVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} blueprintId={blueprintId || ""} blueprintContext={bj} />

      {/* ULS OVERLAY */}
      <AnimatePresence>
        {showUlsPreview && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} sx={{ position: 'fixed', inset: 0, zIndex: 1000, bgcolor: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(30px)', p: 6, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ maxWidth: '800px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Code2 size={24} className="text-indigo-400" />
                  </div>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>Universal Learning Schema</Typography>
                    <Typography variant="caption" sx={{ color: 'slate.500', letterSpacing: '0.1em' }}>V.1.0-GLA HANDOVER PACKET</Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setShowUlsPreview(false)} sx={{ color: 'white', bgcolor: 'white/5' }}><X size={20} /></IconButton>
              </Box>
              <Box sx={{ flex: 1, bgcolor: '#020617', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', p: 4, overflow: 'auto' }}>
                <pre className="text-indigo-300 text-xs font-mono leading-relaxed">
                  {JSON.stringify({
                    uls_version: "1.0-GLA",
                    meta: { polaris_id: blueprintId, strategy_alignment: "HIGH" },
                    active_node: currentModule ? {
                      node_id: currentModule.id,
                      mode: currentModule.pedagogicalMode,
                      modality: currentModule.targetModality,
                      script: activeScript?.script,
                      grounding: activeScript?.groundingScore,
                      cognitive_load: currentModule.cognitiveLoad
                    } : null,
                    full_sequence: modules.map((m) => ({ id: m.id, mode: m.pedagogicalMode, modality: m.targetModality }))
                  }, null, 2)}
                </pre>
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ArchitectureCanvas() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#020617]"><CircularProgress /></div>}><ArchitectureCanvasContent /></Suspense>;
}
