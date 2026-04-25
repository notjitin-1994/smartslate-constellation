/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CircularProgress, 
  Box,
  IconButton,
  Typography,
  Tooltip
} from '@mui/material';
import { 
  Database,
  Cloud,
  Code2,
  X,
  Lightbulb,
  ShieldCheck,
  Workflow,
  AlertOctagon,
  Fingerprint
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useConstellationPersistence } from '@/lib/hooks/useConstellationPersistence';
import { useSidebar } from '@/lib/SidebarContext';
import ScriptDraftingWorkspace from '@/components/blueprints/ScriptDraftingWorkspace';
import { KnowledgeVaultModal } from '@/components/blueprints/KnowledgeVaultModal';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface Blueprint {
  id: string;
  blueprint_json: any;
  user_id: string;
}

const COLORS = {
  background: '#020617',
  surface: '#0d1b2a',
  primary: '#A7DADB', // Brand Teal
  action: '#4F46E5',  // Brand Indigo (CTA)
  textMuted: '#64748B',
};

function ArchitectureCanvasContent() {
  const searchParams = useSearchParams();
  const blueprintId = searchParams.get('blueprintId');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showUlsPreview, setShowUlsPreview] = useState(false);
  const { setIsConstellationMode } = useSidebar();

  // Initialize sidebar to Neural Trace on first-time mount in this session
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('constellation-mode-init');
    if (!hasVisited) {
      setIsConstellationMode(true);
      sessionStorage.setItem('constellation-mode-init', 'true');
    }
  }, [setIsConstellationMode]);

  // --- PERSISTENCE HOOK ---
  const { state, updateState, isSyncing } = useConstellationPersistence(blueprintId);

  // --- DATA NORMALIZATION ---
  const modules = useMemo(() => {
    const rawModules = blueprint?.blueprint_json?.content_outline?.modules || [];
    return rawModules.map((m: any) => ({
      ...m,
      id: m.module_id || m.id || 'NO_ID',
      targetModality: m.delivery_method || m.targetModality || 'TEXT',
      pedagogicalMode: m.pedagogicalMode || 'Direct Instruction'
    }));
  }, [blueprint]);

  const activeIdx = Math.min(Math.max(0, state.activeNodeIdx), Math.max(0, modules.length - 1));
  const currentModule = modules[activeIdx] || null;
  const activeScript = state.scriptOutputs[state.activeNodeIdx];

  useEffect(() => {
    async function loadBlueprint() {
      if (!blueprintId) return;
      try {
        setLoading(true);
        const { data, error: bpError } = await supabase.from('blueprint_generator').select('*').eq('id', blueprintId).single();
        if (bpError) throw bpError;
        setBlueprint(data as Blueprint);

        fetch('/api/ingest/harvest-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprintId, blueprintJson: (data as any).blueprint_json })
        }).catch(err => console.error('Auto-Harvest Failed:', err));

      } catch (err: unknown) {
        console.error('Failed to load blueprint:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBlueprint();
  }, [blueprintId]);

  useEffect(() => {
    if (!modules.length) return;
    window.dispatchEvent(new CustomEvent('constellation-sidebar-sync', {
      detail: { modules: modules, activeIdx: activeIdx }
    }));
  }, [modules, activeIdx]);

  useEffect(() => {
    const handleNodeSelect = (e: any) => {
      const idx = typeof e.detail.idx === 'number' ? e.detail.idx : 0;
      updateState({ activeNodeIdx: idx });
    };
    window.addEventListener('constellation-node-select', handleNodeSelect);
    return () => window.removeEventListener('constellation-node-select', handleNodeSelect);
  }, [updateState]);

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
      alert(`Map Failed: ${err instanceof Error ? err.message : 'Unknown Error'}`);
    } finally { setIsDrafting(false); }
  };

  const formatText = (txt: string) => txt.replace(/_/g, ' ');

  const TooltipContent = ({ title, body }: { title: string, body: string }) => (
    <Box sx={{ p: 1.5, maxWidth: 280 }}>
      <Typography variant="caption" sx={{ fontWeight: 900, color: '#A7DADB', textTransform: 'uppercase', display: 'block', mb: 1, letterSpacing: '0.1em' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', lineHeight: 1.6, fontWeight: 500 }}>
        {body}
      </Typography>
    </Box>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617]">
      <CircularProgress sx={{ color: COLORS.primary }} size={40} thickness={2} />
    </div>
  );

  return (
    <Box sx={{ flex: 1, minHeight: '100vh', bgcolor: '#020617', color: '#F8FAFC', overflow: 'hidden', position: 'relative', selection: 'rgba(167, 218, 219, 0.2)' }}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#A7DADB]/5 blur-[150px] rounded-full" />
      </div>

      {/* --- MAIN WORKSPACE --- */}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', zIndex: 10, position: 'relative', overflow: 'hidden' }}>
        {/* Global HUD Header */}
        <header className="h-24 flex items-center justify-between px-12 z-20 shrink-0 border-b border-white/[0.03] bg-[#020617]/50 backdrop-blur-md">
          
          {/* --- INTEGRATED INTEGRITY SUITE (Moved to Primary Slot) --- */}
          <div className="flex items-center gap-12 px-10 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-2xl relative overflow-hidden group/hud">
            <div className="absolute inset-0 bg-[#A7DADB]/[0.02] group-hover/hud:bg-[#A7DADB]/[0.05] transition-colors" />
            
            <div className="flex items-center gap-10 relative z-10">
                <Tooltip enterTouchDelay={0} title={<TooltipContent title="Hallucination Guardian" body="Measures content purity. Verified means every factual claim is anchored to source documents." />}>
                  <div className="flex items-center gap-3 cursor-help">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${activeScript?.hallucinationFlag ? 'bg-rose-500/10 text-rose-500' : 'bg-[#A7DADB]/10 text-[#A7DADB]'} border ${activeScript?.hallucinationFlag ? 'border-rose-500/20' : 'border-[#A7DADB]/20'}`}>
                      {activeScript?.hallucinationFlag ? <AlertOctagon size={16} className="animate-pulse" /> : <Fingerprint size={16} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#A7DADB]/40">Integrity</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeScript?.hallucinationFlag ? 'text-rose-500' : 'text-[#A7DADB]'}`}>
                        {activeScript?.hallucinationFlag ? 'Flagged' : 'Verified'}
                      </span>
                    </div>
                  </div>
                </Tooltip>
                <div className="h-6 w-[1px] bg-white/10" />
                <Tooltip enterTouchDelay={0} title={<TooltipContent title="Grounding Density" body="Measures document coverage. High scores indicate successful utilization of Knowledge Vault requirements." />}>
                  <div className="flex flex-col gap-1 cursor-help group/item">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#A7DADB]/40">Grounding</span>
                      <span className="text-[9px] font-mono font-black text-white">{activeScript?.groundingScore || 0}/10</span>
                    </div>
                    <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(activeScript?.groundingScore || 0) * 10}%` }} className="h-full bg-[#A7DADB]" />
                    </div>
                  </div>
                </Tooltip>
                <Tooltip enterTouchDelay={0} title={<TooltipContent title="Cognitive Velocity" body="Measures instructional complexity. Lower scores indicate more digestible, learner-friendly content." />}>
                  <div className="flex flex-col gap-1 cursor-help">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#A7DADB]/40">Cognitive</span>
                      <span className="text-[9px] font-mono font-black text-white">{activeScript?.cognitiveLoadScore || 0}/10</span>
                    </div>
                    <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(activeScript?.cognitiveLoadScore || 0) * 10}%` }} className="h-full bg-indigo-500" />
                    </div>
                  </div>
                </Tooltip>
                <div className="h-6 w-[1px] bg-white/10" />
                <button onClick={() => window.dispatchEvent(new CustomEvent('constellation-open-verification'))} className="px-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[8px] font-black text-[#A7DADB] uppercase tracking-[0.2em] hover:bg-[#A7DADB]/10 hover:text-white transition-all shadow-xl">Verification</button>
            </div>
          </div>

          <div className="flex items-center gap-6">
             {isSyncing && (
               <div className="px-4 py-2 rounded-xl bg-[#A7DADB]/5 border border-[#A7DADB]/10 flex items-center gap-2 text-[#A7DADB]">
                 <Cloud size={14} className="animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-tighter">Synchronizing</span>
               </div>
             )}
             <Tooltip title="View Handover Schema">
                <IconButton onClick={() => setShowUlsPreview(true)} sx={{ color: '#A7DADB', bgcolor: 'rgba(167, 218, 219, 0.05)', border: '1px solid rgba(167, 218, 219, 0.1)', '&:hover': { bgcolor: 'rgba(167, 218, 219, 0.15)', color: '#A7DADB' } }}><Code2 size={16} /></IconButton>
             </Tooltip>
             <button onClick={() => setIsVaultOpen(true)} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-slate-500 hover:text-[#A7DADB] transition-all"><Database size={20} /></button>
             <button onClick={handleDraftScript} disabled={isDrafting} className="px-8 py-3 bg-[#4F46E5] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-500/20 hover:bg-[#4F46E5]/90 transition-all disabled:opacity-50 flex items-center gap-3">{isDrafting ? <CircularProgress size={14} color="inherit" /> : <Workflow size={14} />}{isDrafting ? 'Mapping...' : 'Map Constellation'}</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-20 pb-20 pt-10 custom-scrollbar relative z-10 w-full max-w-full">
            <AnimatePresence mode="wait">
              {activeScript || isDrafting ? (
                <div className="space-y-12 w-full max-w-full">
                   <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-10 rounded-[3rem] bg-white/[0.01] border border-white/[0.05] backdrop-blur-xl relative overflow-hidden w-full max-w-full">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#A7DADB]/40" />
                      <div className="flex flex-col gap-4">
                        <h2 className="text-4xl font-black text-white tracking-tighter leading-none">{formatText(currentModule?.title || 'Instructional Node')}</h2>
                        <div className="flex items-center gap-4">
                          <div className="px-4 py-1.5 rounded-xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 text-[10px] font-black text-[#A7DADB] uppercase tracking-widest">{formatText(currentModule?.id || 'NO ID')}</div>
                          <div className="px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-[10px] font-black text-slate-500 uppercase tracking-widest">{formatText(currentModule?.targetModality || 'UNMAPPED')}</div>
                        </div>
                      </div>
                   </motion.div>
                   <ScriptDraftingWorkspace content={activeScript?.script || ""} semanticDelta={activeScript?.semanticDelta} citations={activeScript?.citations || []} isLoading={isDrafting} nodeId={currentModule?.id || ""} />
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center py-40">
                   <div className="w-20 h-20 rounded-[2rem] bg-[#A7DADB]/5 flex items-center justify-center mb-10 border border-[#A7DADB]/10 relative group">
                     <Lightbulb size={32} className="text-[#A7DADB] relative z-10 group-hover:scale-110 transition-transform" />
                   </div>
                   <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl mb-8">
                     <h3 className="text-4xl font-black text-white mb-6 tracking-tighter uppercase font-heading">Architecture Canvas</h3>
                     <p className="text-slate-500 text-sm max-w-sm leading-relaxed font-medium uppercase tracking-widest">Select a node from the neural trace to begin orchestration.</p>
                   </div>
                   <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-white/[0.02] border border-[#A7DADB]/10 text-left max-w-lg backdrop-blur-3xl shadow-2xl">
                      <div className="p-4 rounded-2xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 text-[#A7DADB]"><ShieldCheck size={28} /></div>
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-1">Claim-Only Verification</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Instructional payloads are verified against the truth ledger using deterministic semantic anchors.</p>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </Box>

      <KnowledgeVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} blueprintId={blueprintId || ""} blueprintContext={blueprint?.blueprint_json || {}} />

      {/* ULS OVERLAY */}
      <AnimatePresence>
        {showUlsPreview && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} sx={{ position: 'fixed', inset: 0, zIndex: 1000, bgcolor: 'rgba(2, 6, 23, 0.98)', backdropFilter: 'blur(40px)', p: { xs: 4, md: 8 }, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ maxWidth: '1000px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', bgcolor: '#020617', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '60px', p: 10, overflow: 'hidden', boxShadow: '0 0 100px rgba(0,0,0,0.8)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="w-16 h-16 rounded-3xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center">
                    <Code2 size={32} className="text-[#A7DADB]" />
                  </div>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'white', tracking: '-0.02em', fontFamily: 'var(--font-quicksand)' }}>Universal Learning Schema</Typography>
                    <Typography variant="caption" sx={{ color: '#A7DADB', fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', opacity: 0.5 }}>V.1.0-GLA HANDOVER PACKET</Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setShowUlsPreview(false)} sx={{ color: '#A7DADB', bgcolor: 'rgba(167, 218, 219, 0.05)', p: 3, borderRadius: '24px', '&:hover': { bgcolor: 'rgba(167, 218, 219, 0.1)' } }}><X size={32} /></IconButton>
              </Box>
              <Box sx={{ flex: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '48px', border: '1px solid rgba(167, 218, 219, 0.05)', p: 8, overflow: 'auto' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-10 rounded-[3rem] bg-white/[0.01] border border-white/[0.03] space-y-6">
                      <span className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Core Metadata</span>
                      <pre className="text-[#A7DADB] text-[13px] font-mono leading-relaxed">{JSON.stringify({ uls_version: "1.0-GLA", meta: { polaris_id: blueprintId, status: "READY" } }, null, 2)}</pre>
                   </div>
                   <div className="p-10 rounded-[3rem] bg-white/[0.01] border border-white/[0.03] space-y-6">
                      <span className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Active Node</span>
                      <pre className="text-[#A7DADB] text-[13px] font-mono leading-relaxed">{JSON.stringify(currentModule ? { node_id: currentModule.id, modality: currentModule.targetModality, grounding: activeScript?.groundingScore } : null, null, 2)}</pre>
                   </div>
                   <div className="md:col-span-2 p-10 rounded-[3rem] bg-white/[0.01] border border-white/[0.03] space-y-8">
                      <span className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Full Sequence Trace</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {modules.map((m: any) => (<div key={m.id} className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400">{m.id}: {m.title}</div>))}
                      </div>
                   </div>
                </div>
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default function ArchitectureCanvas() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#020617]"><CircularProgress sx={{ color: '#A7DADB' }} /></div>}><ArchitectureCanvasContent /></Suspense>;
}
