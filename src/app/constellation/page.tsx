// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled

"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Sparkles, 
  Target, 
  Database,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  ShieldCheck,
  Code2,
  Activity,
  FileText,
  Video,
  Monitor,
  MousePointer2,
  MessageSquare,
  Users,
  Trophy,
  ClipboardCheck,
  Lightbulb,
  Workflow,
  X
} from 'lucide-react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Chip, 
  LinearProgress, 
  IconButton,
  Tooltip
} from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { KnowledgeVaultModal } from '@/components/blueprints/KnowledgeVaultModal';
import ScriptDraftingWorkspace from '@/components/blueprints/ScriptDraftingWorkspace';
import { ScriptOutput } from '@/lib/services/instructionalArchitectService';

// --- BOLD DEEP SPACE DESIGN SYSTEM ---
const COLORS = {
  bg: '#020617', // Deeper slate
  surface: '#0F172A',
  surfaceHighlight: '#1E293B',
  primary: '#818CF8', // Indigo glow
  primaryGlow: 'rgba(129, 140, 248, 0.4)',
  secondary: '#38BDF8', // Cyan accents
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBg: 'rgba(15, 23, 42, 0.6)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
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

// --- HELPERS ---
const mapScaffolding = (bloomLevel: string) => {
  const map: Record<string, string> = {
    'remember': 'LOW',
    'understand': 'LOW',
    'apply': 'MEDIUM',
    'analyze': 'MEDIUM',
    'evaluate': 'HIGH',
    'create': 'HIGH'
  };
  return map[bloomLevel?.toLowerCase()] || 'MEDIUM';
};

const getModalityIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('video')) return <Video size={16} />;
  if (t.includes('interactive') || t.includes('scorm') || t.includes('simulation')) return <MousePointer2 size={16} />;
  if (t.includes('case') || t.includes('text') || t.includes('checklist') || t.includes('pdf')) return <FileText size={16} />;
  if (t.includes('audio') || t.includes('podcast')) return <MessageSquare size={16} />;
  return <Monitor size={16} />;
};

const extractEnrichedModules = (blueprint: Blueprint | null): ModuleData[] => {
  if (!blueprint) return [];
  const bj = blueprint.blueprint_json || {};
  const modules = bj.content_outline?.modules || [];
  const globalModalities = bj.instructional_strategy?.modalities || [];

  return modules.map((mod: Record<string, unknown>, i: number) => {
    const deliveryMethod = String(mod.delivery_method || '').toLowerCase();
    
    const matchedModality = globalModalities.find((m: { type: string; rationale: string; allocation_percent: number }) => {
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
      scaffolding: mapScaffolding(bj.learning_objectives?.objectives?.[0]?.title || 'apply'),
      assetGroundingStatus: 'PENDING',
      targetModality: matchedModality.type,
      modalityRationale: matchedModality.rationale
    };
  });
};

// --- SUB-COMPONENTS ---
const StatBadge = ({ icon: Icon, label, value, color = COLORS.primary }: { icon: React.ElementType, label: string, value: string, color?: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/40 shadow-inner">
      <Icon size={16} color={color} />
    </div>
    <div>
      <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">{label}</span>
      <span className="block text-sm text-white font-semibold">{value}</span>
    </div>
  </div>
);

const HandoverStatus = ({ status }: { status: string }) => (
  <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20">
    <div className="relative flex items-center justify-center w-10 h-10">
      <BrainCircuit size={24} className="text-indigo-400 z-10" />
      <motion.div 
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }} 
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} 
        className="absolute inset-0 bg-indigo-500 rounded-full blur-md z-0" 
      />
    </div>
    <div>
      <h3 className="text-xs text-indigo-300 uppercase tracking-widest font-bold mb-1">Generative Architect</h3>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold text-emerald-400">{status}</span>
      </div>
    </div>
  </div>
);

function ArchitectureCanvasContent() {
  const searchParams = useSearchParams();
  const blueprintId = searchParams.get('blueprintId');
  const [loading, setLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [activeNodeIdx, setActiveNodeIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUlsPreview, setShowUlsPreview] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [scriptOutputs, setScriptOutputs] = useState<Record<number, ScriptOutput>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchBlueprint = async () => {
      if (!blueprintId) { setLoading(false); return; }
      try {
        setLoading(true);
        const { data, error: bpError } = await supabase.from('blueprint_generator').select('*').eq('id', blueprintId).single();
        if (bpError) throw bpError;
        setBlueprint(data as Blueprint);
      } catch (err: unknown) {
        console.error('Canvas Fetch Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      } finally { setLoading(false); }
    };
    fetchBlueprint();
  }, [blueprintId]);

  const baseModules = useMemo(() => extractEnrichedModules(blueprint), [blueprint]);
  const modules = useMemo(() => {
    return baseModules.map((mod, idx) => {
      const output = scriptOutputs[idx];
      if (!output) return mod;
      return {
        ...mod,
        cognitiveLoad: output.cognitiveLoadScore,
        assetGroundingStatus: output.hallucinationFlag ? 'WARNING' : 'RESOLVED',
        groundingTypes: output.groundingTypes
      };
    });
  }, [baseModules, scriptOutputs]);

  const currentModule = activeNodeIdx !== null ? modules[activeNodeIdx] : null;

  const handleDraftScript = async () => {
    if (!currentModule || !blueprintId || activeNodeIdx === null) return;
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
        setScriptOutputs(prev => ({ ...prev, [activeNodeIdx]: result.data }));
      } else {
        throw new Error(result.error);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Drafting Failed';
      alert(`Drafting Failed: ${errorMessage}`);
    } finally { setIsDrafting(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617]">
      <CircularProgress sx={{ color: COLORS.primary, mb: 4 }} size={60} thickness={2} />
      <span className="text-xs text-indigo-400 font-mono tracking-[0.3em] uppercase animate-pulse">Initializing Generative Architect</span>
    </div>
  );

  if (error || (!blueprint && blueprintId)) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-8 text-center">
      <AlertCircle size={64} className="text-red-500 mb-6" />
      <h2 className="text-2xl font-bold text-white mb-4">Handover Protocol Interrupted</h2>
      <p className="text-slate-400 mb-8 max-w-md">The strategic blueprint could not be loaded. Please ensure the blueprint ID is correct and you have access.</p>
      <button onClick={() => router.push('/handover')} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
        Return to Gateway
      </button>
    </div>
  );

  const bj = blueprint?.blueprint_json || {};
  const activeScript = activeNodeIdx !== null ? scriptOutputs[activeNodeIdx] : null;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden relative selection:bg-indigo-500/30">
      {/* Immersive Deep Space Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      {/* Left Sidebar: Navigation & Context */}
      <div className="w-[340px] flex flex-col border-r border-white/5 bg-[#0F172A]/80 backdrop-blur-xl z-10 shadow-2xl relative">
        <div className="p-6 pb-2">
          <HandoverStatus status="SYSTEM ONLINE" />
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 space-y-8">
          
          {/* Blueprint Meta Context */}
          <div className="space-y-4">
            <h4 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold px-2 flex items-center gap-2">
              <Target size={12} /> Strategic Context
            </h4>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-colors cursor-pointer group" onClick={() => setActiveNodeIdx(null)}>
              <h5 className="text-sm font-bold text-indigo-300 mb-2 group-hover:text-indigo-200 transition-colors">Blueprint Overview</h5>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {bj.executive_summary?.content || 'No executive summary provided.'}
              </p>
            </div>
          </div>

          {/* Neural Nodes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                <Workflow size={12} /> Neural Nodes
              </h4>
              <span className="text-[10px] font-mono text-slate-600">{modules.length} TOTAL</span>
            </div>
            
            <div className="space-y-2">
              {modules.map((mod: ModuleData, i: number) => {
                const isActive = activeNodeIdx === i;
                return (
                  <button 
                    key={mod.id} 
                    onClick={() => setActiveNodeIdx(i)} 
                    className={`w-full text-left p-3.5 rounded-xl transition-all duration-300 border flex flex-col gap-2 relative overflow-hidden group
                      ${isActive 
                        ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                        : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/10'
                      }`}
                  >
                    {isActive && <motion.div layoutId="activeNodeIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                    
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-mono font-bold tracking-wider ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {mod.id}
                      </span>
                      <div className="flex items-center gap-2">
                        {mod.groundingTypes?.includes('pdf') && <FileText size={12} className="text-cyan-400/70" />}
                        {mod.groundingTypes?.includes('video') && <Video size={12} className="text-indigo-400/70" />}
                        <div className={`p-1 rounded-md ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                          {getModalityIcon(mod.targetModality)}
                        </div>
                      </div>
                    </div>
                    
                    <h5 className={`text-sm leading-snug font-semibold ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {mod.title}
                    </h5>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col z-10 overflow-hidden relative">
        {/* Top App Bar */}
        <header className="h-16 border-b border-white/5 bg-[#0F172A]/40 backdrop-blur-md flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">{blueprint?.title || 'Constellation Canvas'}</h1>
              <span className="text-[10px] text-slate-400 font-mono">v4.0.0-ALPHA</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsVaultOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all group"
            >
              <Database size={16} className="text-indigo-400 group-hover:animate-pulse" />
              Knowledge Vault
            </button>
            <button 
              onClick={() => setShowUlsPreview(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-100 transition-all"
            >
              <Code2 size={16} />
              Export ULS
            </button>
          </div>
        </header>

        {/* Dynamic Canvas Body */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <AnimatePresence mode="wait">
            {activeNodeIdx === null ? (
              // --- BLUEPRINT DASHBOARD VIEW ---
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                <div className="text-center mb-12 mt-8">
                  <h2 className="text-4xl font-extrabold text-white tracking-tighter mb-4">Strategic Architecture Overview</h2>
                  <p className="text-lg text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
                    Polaris has defined the high-level strategy. Constellation will now translate these parameters into granular, machine-executable instructional nodes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Audience Card */}
                  <div className="col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 text-indigo-400 mb-2">
                      <Users size={20} />
                      <h3 className="font-bold uppercase tracking-wider text-xs">Target Audience</h3>
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Primary Roles</span>
                        <div className="flex flex-wrap gap-2">
                          {bj.target_audience?.demographics?.roles?.map((r: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 rounded-md bg-white/5 text-xs text-slate-300 border border-white/5">{r}</span>
                          )) || <span className="text-slate-500 text-sm italic">Not specified</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Experience Level</span>
                        <div className="flex flex-wrap gap-2">
                          {bj.target_audience?.demographics?.experience_levels?.map((r: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-xs text-indigo-300 border border-indigo-500/20">{r}</span>
                          )) || <span className="text-slate-500 text-sm italic">Not specified</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modalities Card */}
                  <div className="col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 text-cyan-400 mb-2">
                      <Layers size={20} />
                      <h3 className="font-bold uppercase tracking-wider text-xs">Instructional Strategy</h3>
                    </div>
                    <div className="space-y-3 flex-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {bj.instructional_strategy?.modalities?.map((m: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-semibold text-slate-200">{m.type}</span>
                            <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{m.allocation_percent || m.percentage}%</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug">{m.rationale}</p>
                        </div>
                      )) || <span className="text-slate-500 text-sm italic">No modalities defined.</span>}
                    </div>
                  </div>

                  {/* Metrics Card */}
                  <div className="col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                      <Trophy size={20} />
                      <h3 className="font-bold uppercase tracking-wider text-xs">Success Metrics</h3>
                    </div>
                    <div className="space-y-3 flex-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {bj.success_metrics?.metrics?.slice(0,3).map((m: any, i: number) => (
                        <div key={i} className="flex flex-col gap-1 border-l-2 border-emerald-500/30 pl-3 py-1">
                          <span className="text-xs text-slate-300 font-medium">{m.metric}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Target: {m.target}</span>
                        </div>
                      )) || <span className="text-slate-500 text-sm italic">No metrics defined.</span>}
                    </div>
                  </div>

                  {/* Assessment Strategy Full Width */}
                  <div className="col-span-1 md:col-span-3 p-6 rounded-2xl bg-gradient-to-r from-white/[0.02] to-transparent border border-white/5 flex flex-col md:flex-row gap-8 items-center">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                       <ClipboardCheck size={28} className="text-slate-300" />
                     </div>
                     <div>
                       <h3 className="font-bold uppercase tracking-wider text-xs text-slate-400 mb-2">Assessment Overview</h3>
                       <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
                         {bj.assessment_strategy?.overview || 'No assessment overview provided.'}
                       </p>
                     </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              // --- MODULE ARCHITECT VIEW ---
              <motion.div 
                key="module-view"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full gap-6"
              >
                {/* Node Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold tracking-widest border border-indigo-500/30">
                        {currentModule?.id}
                      </span>
                      <Chip label={currentModule?.pedagogicalMode} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em' }} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 leading-tight">
                      {currentModule?.title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                      {currentModule?.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    {/* Modality Pill */}
                    <Tooltip title={currentModule?.modalityRationale || 'Mapped based on delivery method.'} placement="top" arrow>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] border border-white/10 shadow-lg cursor-help">
                        <div className="text-indigo-400">
                          {getModalityIcon(currentModule?.targetModality || '')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5">Target Modality</span>
                          <span className="text-sm text-slate-200 font-semibold leading-none">{currentModule?.targetModality}</span>
                        </div>
                      </div>
                    </Tooltip>

                    <Button 
                      variant="contained" 
                      onClick={handleDraftScript} 
                      disabled={isDrafting} 
                      className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50"
                      startIcon={isDrafting ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />}
                    >
                      {activeScript ? 'Re-Draft Script' : 'Draft Script'}
                    </Button>
                  </div>
                </div>

                {/* Node Content Split */}
                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px]">
                  
                  {/* Left Column: Context & Guardrails */}
                  <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"><ShieldCheck size={14}/> Cognitive Guardrails</h3>
                      
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cognitive Load</span>
                          <span className="text-xs font-mono font-bold text-indigo-400">{currentModule?.cognitiveLoad || 0}/10</span>
                        </div>
                        <LinearProgress variant="determinate" value={(currentModule?.cognitiveLoad || 0) * 10} sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary } }} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <StatBadge icon={Layers} label="Scaffolding" value={currentModule?.scaffolding || "MED"} color={COLORS.secondary} />
                        <StatBadge icon={CheckCircle2} label="Grounding" value={currentModule?.assetGroundingStatus || "PEND"} color={currentModule?.assetGroundingStatus === 'RESOLVED' ? COLORS.success : COLORS.warning} />
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex-1 overflow-y-auto custom-scrollbar">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4"><Activity size={14}/> Interaction Graph</h3>
                      <div className="space-y-3">
                        {currentModule?.learning_activities?.length ? currentModule.learning_activities.map((act: { type: string; duration: string; activity: string }, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-black/20 border border-white/5 relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-700 group-hover:bg-cyan-500 transition-colors" />
                            <div className="flex justify-between items-start mb-1.5 pl-2">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{act.type}</span>
                              <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{act.duration}</span>
                            </div>
                            <p className="text-xs text-slate-300 pl-2 leading-relaxed">{act.activity}</p>
                          </div>
                        )) : (
                          <p className="text-xs text-slate-500 italic">No specific interactions mapped.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Drafting Workspace */}
                  <div className="flex-1 rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl relative">
                     {activeScript || isDrafting ? (
                        <ScriptDraftingWorkspace 
                          scriptTitle={currentModule?.title || ""}
                          content={activeScript?.script || ""}
                          groundingScore={activeScript?.groundingScore || 0}
                          hallucinationFlag={activeScript?.hallucinationFlag || false}
                          semanticDelta={activeScript?.semanticDelta}
                          citations={activeScript?.citations || []}
                          isLoading={isDrafting}
                          onCommit={() => alert('ULS Exported to Nova Stage')}
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <Lightbulb size={24} className="text-slate-400" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Workspace Idle</h3>
                          <p className="text-slate-400 text-sm max-w-sm">
                            Click &quot;Draft Script&quot; to unleash the Generative Learning Architect. It will analyze your Knowledge Vault and draft a production-ready script tailored to the {currentModule?.targetModality} modality.
                          </p>
                        </div>
                      )}
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <KnowledgeVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} blueprintId={blueprintId || ""} blueprintContext={blueprint?.blueprint_json} />

      {/* ULS Overlay */}
      <AnimatePresence>
        {showUlsPreview && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} sx={{ position: 'fixed', inset: 0, zIndex: 1000, bgcolor: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(20px)', p: 6, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ maxWidth: '800px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Code2 size={24} className="text-indigo-400" />
                  </div>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Universal Learning Schema (ULS)</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Machine-Executable Handover Packet</Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setShowUlsPreview(false)} sx={{ color: 'white', bgcolor: 'white/5', '&:hover': { bgcolor: 'white/10' } }}><X size={20} /></IconButton>
              </Box>
              <Box sx={{ flex: 1, bgcolor: '#020617', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', p: 4, overflow: 'auto', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
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
                    full_sequence: modules.map((m: ModuleData) => ({ id: m.id, mode: m.pedagogicalMode, modality: m.targetModality }))
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
  return <Suspense fallback={
    <div className="flex items-center justify-center min-h-screen bg-[#020617]">
      <CircularProgress sx={{ color: '#818CF8' }} />
    </div>
  }><ArchitectureCanvasContent /></Suspense>;
}
