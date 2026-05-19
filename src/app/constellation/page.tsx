/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Fingerprint,
  Rocket,
  TriangleAlert,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useConstellationPersistence } from '@/lib/hooks/useConstellationPersistence';
import { useSidebar } from '@/lib/SidebarContext';
import ScriptDraftingWorkspace from '@/components/blueprints/ScriptDraftingWorkspace';
import { KnowledgeVaultModal } from '@/components/blueprints/KnowledgeVaultModal';
import { motion, AnimatePresence } from 'framer-motion';
import { extractEnrichedModules } from '@/lib/services/modalityMapper';
import { buildULS } from '@/domain/uls/builder';
import { assessCLG, CLG_THRESHOLD } from '@/domain/pedagogy/cognitiveLoad';
import type { ULSType } from '@/domain/uls/schema';

// --- Types ---
interface Blueprint {
  id: string;
  blueprint_json: any;
  user_id: string;
}

const COLORS = {
  background: '#020617',
  surface: '#0d1b2a',
  primary: '#A7DADB',
  action: '#4F46E5',
  textMuted: '#64748B',
};

function ArchitectureCanvasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const blueprintId = searchParams.get('blueprintId');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showUlsPreview, setShowUlsPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const { setIsConstellationMode } = useSidebar();

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('constellation-mode-init');
    if (!hasVisited) {
      setIsConstellationMode(true);
      sessionStorage.setItem('constellation-mode-init', 'true');
    }
  }, [setIsConstellationMode]);

  const { state, updateState, isSyncing } = useConstellationPersistence(blueprintId);

  const modules = useMemo(() => {
    const rawModules: any[] = blueprint?.blueprint_json?.content_outline?.modules || [];
    const enriched = blueprint ? extractEnrichedModules({ blueprint_json: blueprint.blueprint_json }) : [];
    return rawModules.map((m: any, i: number) => ({
      ...m,
      id: m.module_id || m.id || 'NO_ID',
      targetModality: enriched[i]?.targetModality || m.delivery_method || 'TEXT',
      scaffolding: enriched[i]?.scaffolding || 'MEDIUM',
      pedagogicalMode: m.pedagogicalMode || 'Direct Instruction',
    }));
  }, [blueprint]);

  const activeIdx = Math.min(Math.max(0, state.activeNodeIdx), Math.max(0, modules.length - 1));
  const currentModule = modules[activeIdx] || null;
  const activeScript = state.scriptOutputs[state.activeNodeIdx];

  // Compute real ULS from current state
  const uls = useMemo<ULSType | null>(() => {
    if (!blueprint || modules.length === 0) return null;
    try {
      return buildULS({
        blueprintId: blueprint.id,
        blueprintJson: blueprint.blueprint_json,
        modules,
        scriptOutputs: state.scriptOutputs,
      });
    } catch {
      return null;
    }
  }, [blueprint, modules, state.scriptOutputs]);

  // CLG report across all drafted nodes
  const clgReport = useMemo(() => {
    const scores = modules
      .map((m, i) => ({ nodeId: m.id, score: state.scriptOutputs[i]?.cognitiveLoadScore ?? 0 }))
      .filter((_, i) => state.scriptOutputs[i] !== undefined);
    return assessCLG(scores);
  }, [modules, state.scriptOutputs]);

  const activeCLGOverload = (activeScript?.cognitiveLoadScore ?? 0) > CLG_THRESHOLD;

  useEffect(() => {
    async function loadBlueprint() {
      if (!blueprintId) return;
      try {
        setLoading(true);
        const { data, error: bpError } = await supabase
          .from('blueprint_generator')
          .select('*')
          .eq('id', blueprintId)
          .single();
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
      detail: { modules, activeIdx }
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
          blueprintContext: blueprint?.blueprint_json,
        }),
      });
      const result = await response.json();
      if (result.success) {
        updateState({
          scriptOutputs: { ...state.scriptOutputs, [state.activeNodeIdx]: result.data },
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err: unknown) {
      alert(`Map Failed: ${err instanceof Error ? err.message : 'Unknown Error'}`);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleExportToNova = async () => {
    if (!uls || !blueprintId) return;
    setIsExporting(true);
    setExportStatus(null);
    try {
      const response = await fetch('/api/architect/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId, uls }),
      });
      const result = await response.json();
      if (result.success) {
        setExportStatus({ ok: true, message: 'ULS committed. Blueprint status → ARCHITECTING.' });
      } else if (result.error === 'CLG_THRESHOLD_EXCEEDED') {
        setExportStatus({ ok: false, message: result.message });
      } else {
        setExportStatus({ ok: false, message: result.error || 'Export failed.' });
      }
    } catch (err) {
      setExportStatus({ ok: false, message: String(err) });
    } finally {
      setIsExporting(false);
    }
  };

  const TooltipContent = ({ title, body }: { title: string; body: string }) => (
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
    <Box sx={{ flex: 1, minHeight: '100vh', bgcolor: '#020617', color: '#F8FAFC', overflow: 'hidden', position: 'relative' }}>

      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#A7DADB]/5 blur-[150px] rounded-full" />
      </div>

      {/* --- MAIN WORKSPACE --- */}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', zIndex: 10, position: 'relative', overflow: 'hidden' }}>
        {/* Global HUD Header */}
        <header className="h-24 flex items-center justify-between px-12 z-20 shrink-0 border-b border-white/[0.03] bg-[#020617]/50 backdrop-blur-md">

          {/* INTEGRITY SUITE */}
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
                <div className="flex flex-col gap-1 cursor-help">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#A7DADB]/40">Grounding</span>
                    <span className="text-[9px] font-mono font-black text-white">{activeScript?.groundingScore || 0}/10</span>
                  </div>
                  <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(activeScript?.groundingScore || 0) * 10}%` }} className="h-full bg-[#A7DADB]" />
                  </div>
                </div>
              </Tooltip>
              <Tooltip enterTouchDelay={0} title={<TooltipContent title="Cognitive Velocity" body={`Measures instructional complexity. Scores above ${CLG_THRESHOLD} block Nova handover — simplify content to proceed.`} />}>
                <div className="flex flex-col gap-1 cursor-help">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${activeCLGOverload ? 'text-amber-400/60' : 'text-[#A7DADB]/40'}`}>Cognitive</span>
                    <span className={`text-[9px] font-mono font-black ${activeCLGOverload ? 'text-amber-400' : 'text-white'}`}>{activeScript?.cognitiveLoadScore || 0}/10</span>
                  </div>
                  <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(activeScript?.cognitiveLoadScore || 0) * 10}%` }} className={`h-full ${activeCLGOverload ? 'bg-amber-400' : 'bg-indigo-500'}`} />
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
            {!clgReport.passes && clgReport.violated.length > 0 && (
              <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-400">
                <TriangleAlert size={14} />
                <span className="text-[9px] font-black uppercase tracking-tighter">CLG Overload ({clgReport.violated.length} node{clgReport.violated.length > 1 ? 's' : ''})</span>
              </div>
            )}
            <Tooltip title="View Handover Schema">
              <IconButton aria-label="View Handover Schema" onClick={() => { setShowUlsPreview(true); setExportStatus(null); }} sx={{ color: '#A7DADB', bgcolor: 'rgba(167, 218, 219, 0.05)', border: '1px solid rgba(167, 218, 219, 0.1)', '&:hover': { bgcolor: 'rgba(167, 218, 219, 0.15)' } }}><Code2 size={16} /></IconButton>
            </Tooltip>
            <button
              onClick={() => router.push(`/constellation/vault?blueprintId=${blueprintId}`)}
              title="Knowledge Vault"
              className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-slate-500 hover:text-[#A7DADB] transition-all"
            >
              <Database size={20} />
            </button>
            <button onClick={handleDraftScript} disabled={isDrafting} className="px-8 py-3 bg-[#4F46E5] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-500/20 hover:bg-[#4F46E5]/90 transition-all disabled:opacity-50 flex items-center gap-3">
              {isDrafting ? <CircularProgress size={14} color="inherit" /> : <Workflow size={14} />}
              {isDrafting ? 'Mapping...' : 'Map Constellation'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-20 pb-20 pt-10 custom-scrollbar relative z-10 w-full max-w-full">
          <AnimatePresence mode="wait">
            {activeScript || isDrafting ? (
              <div className="space-y-12 w-full max-w-full">
                <ScriptDraftingWorkspace nodeScript={activeScript?.nodeScript ?? null} semanticDelta={activeScript?.semanticDelta} citations={activeScript?.citations || []} isLoading={isDrafting} nodeId={currentModule?.id || ""} />
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
            <Box sx={{ maxWidth: '1100px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', bgcolor: '#020617', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '60px', p: 10, overflow: 'hidden', boxShadow: '0 0 100px rgba(0,0,0,0.8)' }}>

              {/* Modal Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="w-16 h-16 rounded-3xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center">
                    <Code2 size={32} className="text-[#A7DADB]" />
                  </div>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'white', fontFamily: 'var(--font-quicksand)' }}>Universal Learning Schema</Typography>
                    <Typography variant="caption" sx={{ color: '#A7DADB', fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', opacity: 0.5 }}>V.1.0-GLA HANDOVER PACKET</Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setShowUlsPreview(false)} sx={{ color: '#A7DADB', bgcolor: 'rgba(167, 218, 219, 0.05)', p: 3, borderRadius: '24px', '&:hover': { bgcolor: 'rgba(167, 218, 219, 0.1)' } }}><X size={32} /></IconButton>
              </Box>

              {/* CLG Warning Banner */}
              {!clgReport.passes && (
                <div className="mb-6 px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4 text-amber-300">
                  <TriangleAlert size={18} className="shrink-0" />
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest">CLG Guardrail Violation</span>
                    <p className="text-[11px] mt-1 opacity-80">
                      {clgReport.violated.map(v => `${v.nodeId} (${v.score}/10)`).join(', ')} exceed the {CLG_THRESHOLD}/10 threshold. Nova handover is blocked until cognitive load is reduced.
                    </p>
                  </div>
                </div>
              )}

              {/* Export status feedback */}
              {exportStatus && (
                <div className={`mb-6 px-6 py-4 rounded-2xl flex items-center gap-4 ${exportStatus.ok ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'}`}>
                  <span className="text-[11px] font-black uppercase tracking-widest">{exportStatus.ok ? 'Export Successful' : 'Export Blocked'}</span>
                  <span className="text-[11px] opacity-80">— {exportStatus.message}</span>
                </div>
              )}

              {/* ULS Content */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {uls ? (
                  <div className="space-y-6">
                    {/* Meta + Guardrails */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.04] space-y-4">
                        <span className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em] block">Metadata</span>
                        <div className="space-y-2 text-[12px] font-mono">
                          <div className="flex justify-between"><span className="text-slate-500">polaris_id</span><span className="text-[#A7DADB]">{uls.meta.polaris_id.slice(0, 8)}…</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">alignment</span><span className={uls.meta.strategy_alignment === 'HIGH' ? 'text-emerald-400' : uls.meta.strategy_alignment === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'}>{uls.meta.strategy_alignment}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">nodes</span><span className="text-white">{uls.meta.nodes_completed}/{uls.meta.total_nodes} completed</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">model</span><span className="text-[#A7DADB]">Merrill_First_Principles</span></div>
                        </div>
                      </div>
                      <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.04] space-y-4">
                        <span className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em] block">Guardrails</span>
                        <div className="space-y-2 text-[12px] font-mono">
                          <div className="flex justify-between"><span className="text-slate-500">clg_threshold</span><span className="text-white">{uls.guardrails.clg_threshold}/10</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">max_clg</span><span className={uls.guardrails.max_cognitive_load > CLG_THRESHOLD ? 'text-amber-400' : 'text-white'}>{uls.guardrails.max_cognitive_load}/10</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">clg_passed</span><span className={uls.guardrails.clg_passed ? 'text-emerald-400' : 'text-rose-400'}>{String(uls.guardrails.clg_passed)}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">reading_level</span><span className="text-[#A7DADB]">{uls.guardrails.reading_level}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Architecture Nodes Table */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.04] space-y-4">
                      <span className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em] block">Architecture Nodes</span>
                      <div className="space-y-2">
                        {uls.architecture_nodes.map((node) => (
                          <div key={node.node_id} className="grid grid-cols-7 gap-3 items-center px-4 py-3 rounded-xl bg-black/20 border border-white/[0.03] text-[11px] font-mono">
                            <span className="text-[#A7DADB] font-black">{node.node_id}</span>
                            <span className="text-slate-400 truncate col-span-2">{node.title}</span>
                            <span className="text-indigo-400">{node.mode}</span>
                            <span className="text-slate-300">{node.cognitive_verb}</span>
                            <span className={`text-center ${node.cognitive_load > CLG_THRESHOLD ? 'text-amber-400' : 'text-slate-300'}`}>CLG {node.cognitive_load}</span>
                            <span className={`text-center ${node.synthetic_required ? 'text-rose-400' : 'text-emerald-400'}`}>{node.synthetic_required ? 'synthetic' : 'grounded'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full JSON dump */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.04] space-y-4">
                      <span className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em] block">Full Packet JSON</span>
                      <pre className="text-[#A7DADB]/70 text-[10px] font-mono leading-relaxed overflow-auto max-h-64 custom-scrollbar">{JSON.stringify(uls, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
                    {modules.length === 0 ? 'No modules loaded.' : 'Draft at least one node to generate the ULS.'}
                  </div>
                )}
              </Box>

              {/* Export Footer */}
              <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <button
                  onClick={() => setShowUlsPreview(false)}
                  className="px-8 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/[0.06] transition-all"
                >
                  Close
                </button>
                <button
                  onClick={handleExportToNova}
                  disabled={isExporting || !uls || uls.meta.nodes_completed === 0}
                  className="px-8 py-3 rounded-xl bg-[#4F46E5] text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-[#4F46E5]/90 transition-all disabled:opacity-40 flex items-center gap-3"
                >
                  {isExporting ? <CircularProgress size={14} color="inherit" /> : <Rocket size={14} />}
                  {isExporting ? 'Committing…' : 'Export to Nova'}
                </button>
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default function ArchitectureCanvas() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#020617]"><CircularProgress sx={{ color: '#A7DADB' }} /></div>}>
      <ArchitectureCanvasContent />
    </Suspense>
  );
}
