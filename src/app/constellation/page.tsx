"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CircularProgress, 
  Box,
  IconButton,
  Tooltip,
  Fade,
  Modal
} from '@mui/material';
import { 
  Database,
  Code2,
  X,
  Sparkles,
  ShieldCheck,
  Workflow,
  Fingerprint,
  Search,
  GitBranch,
  Layout,
  History,
  Settings2,
  ScrollText,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useConstellationPersistence } from '@/lib/hooks/useConstellationPersistence';
import { useSidebar } from '@/lib/SidebarContext';
import ScriptDraftingWorkspace from '@/components/blueprints/ScriptDraftingWorkspace';
import { KnowledgeVaultModal } from '@/components/blueprints/KnowledgeVaultModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// --- TYPES & CONSTANTS ---

interface Constraint {
  category: string;
  requirement: string;
  impact_level: string;
  source_id: string;
}

interface KnowledgeLedger {
  master_blueprint_md: string;
  subject_matter_md: string;
  strategic_alignment_md: string;
  constraints: Constraint[];
}

interface Blueprint {
  id: string;
  blueprint_json: Record<string, unknown>;
  user_id: string;
}

const COLORS = {
  background: '#020617',
  accent: '#A7DADB',
  action: '#4F46E5',
  glass: 'rgba(255, 255, 255, 0.02)',
  border: 'rgba(167, 218, 219, 0.1)',
};

// --- SUB-COMPONENTS ---

interface AgentStatusItemProps {
  name: string;
  icon: React.ElementType;
  progress: number;
  status: 'ready' | 'active' | 'pending' | 'standby';
  task: string;
}

const AgentStatusItem = ({ name, icon: Icon, progress, status, task }: AgentStatusItemProps) => (
  <div className="flex-1 px-6 py-3 rounded-2xl border border-[#A7DADB]/10 bg-white/[0.01] backdrop-blur-md relative overflow-hidden group">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <Icon size={14} className={(status === 'active' || status === 'ready') ? 'text-[#A7DADB]' : 'text-slate-600'} />
        <span className="text-[11px] font-black uppercase tracking-widest text-white/80">{name}</span>
      </div>
      {status === 'active' && <div className="w-1 h-1 rounded-full bg-[#A7DADB] shadow-[0_0_8px_#A7DADB] animate-pulse" />}
      {status === 'ready' && <div className="w-1 h-1 rounded-full bg-[#A7DADB] shadow-[0_0_4px_#A7DADB]" />}
    </div>
    <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden mb-2">
      <motion.div 
        initial={{ width: 0 }} 
        animate={{ width: `${progress}%` }} 
        className={`h-full ${(status === 'active' || status === 'ready') ? 'bg-[#A7DADB]' : 'bg-slate-800'}`} 
      />
    </div>
    <p className="text-[8px] font-mono uppercase text-slate-500 tracking-tighter truncate">{task}</p>
  </div>
);

// --- MAIN PAGE CONTENT ---

function ArchitectureCanvasContent() {
  const searchParams = useSearchParams();
  const blueprintId = searchParams.get('blueprintId');
  
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [ledger, setLedger] = useState<KnowledgeLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  
  const { setIsConstellationMode } = useSidebar();
  const { state, updateState } = useConstellationPersistence(blueprintId);

  // Initialize UI
  useEffect(() => {
    setIsConstellationMode(true);
  }, [setIsConstellationMode]);

  const modules = useMemo(() => {
    const outline = blueprint?.blueprint_json?.content_outline as Record<string, unknown> | undefined;
    const raw = (outline?.modules as Record<string, unknown>[]) || [];
    return raw.map((m) => ({
      ...m,
      id: (m.module_id as string) || (m.id as string) || 'NO_ID',
      title: (m.title as string) || 'Untitled Node',
      description: (m.description as string) || '',
      targetModality: (m.delivery_method as string) || (m.targetModality as string) || 'TEXT'
    }));
  }, [blueprint]);

  const activeIdx = Math.min(Math.max(0, state.activeNodeIdx), Math.max(0, modules.length - 1));
  const currentModule = modules[activeIdx] || null;
  const activeScript = state.scriptOutputs[state.activeNodeIdx];

  // Data Fetching
  const loadWorkspace = useCallback(async () => {
    if (!blueprintId) return;
    try {
      setLoading(true);
      
      const { data: bp, error: bpError } = await supabase
        .from('blueprint_generator')
        .select('*')
        .eq('id', blueprintId)
        .single();
      
      if (bpError) throw bpError;
      setBlueprint(bp as Blueprint);

      const { data: kl } = await supabase
        .from('knowledge_ledgers')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .single();
      
      if (kl) {
        setLedger({
          master_blueprint_md: kl.master_blueprint_md,
          subject_matter_md: kl.subject_matter_md,
          strategic_alignment_md: kl.strategic_alignment_md,
          constraints: kl.constraints as Constraint[]
        });
      }

      if (!kl) {
        await fetch('/api/ingest/harvest-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprintId, blueprintJson: bp.blueprint_json })
        });
      }

    } catch (err) {
      console.error('[Orchestrator] Initialization Error:', err);
    } finally {
      setLoading(false);
    }
  }, [blueprintId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Sidebar Sync
  useEffect(() => {
    if (!modules.length) return;
    window.dispatchEvent(new CustomEvent('constellation-sidebar-sync', {
      detail: { modules, activeIdx }
    }));
  }, [modules, activeIdx]);

  useEffect(() => {
    const handleNodeSelect = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[Orchestrator] Received node select event:', customEvent.detail);
      if (customEvent.detail !== undefined && customEvent.detail.idx !== undefined) {
        updateState({ activeNodeIdx: Number(customEvent.detail.idx) });
      }
    };
    window.addEventListener('constellation-node-select', handleNodeSelect);
    return () => window.removeEventListener('constellation-node-select', handleNodeSelect);
  }, [updateState]);

  const handleMapConstellation = async () => {
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
          targetModality: currentModule.targetModality,
          blueprintId
        }),
      });
      const result = await response.json();
      if (result.success) {
        updateState({ 
          scriptOutputs: { ...state.scriptOutputs, [state.activeNodeIdx]: result.data } 
        });
      }
    } catch (err) {
      console.error('[Orchestrator] Map Failed:', err);
    } finally {
      setIsDrafting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617]">
      <div className="relative">
        <CircularProgress sx={{ color: COLORS.accent }} size={60} thickness={1.5} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Workflow size={24} className="text-[#A7DADB] animate-pulse" />
        </div>
      </div>
      <p className="mt-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Initializing Prism Architect</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-[#F8FAFC] overflow-hidden relative font-sans">
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#A7DADB]/5 blur-[180px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full" />
      </div>

      <header className="h-24 shrink-0 border-b border-white/[0.03] bg-[#020617]/40 backdrop-blur-xl px-12 flex items-center justify-between gap-12 z-50">
        <div className="flex flex-1 items-center gap-4">
           <AgentStatusItem 
             name="Analyst" icon={Search} progress={ledger ? 100 : 80} 
             status={ledger ? 'ready' : 'active'} task={ledger ? 'Strategic Apex Ready' : 'Distilling Blueprint...'} 
           />
           <AgentStatusItem 
             name="Mapper" icon={GitBranch} progress={isDrafting ? 45 : (activeScript ? 100 : 0)} 
             status={isDrafting ? 'active' : (activeScript ? 'ready' : 'pending')} task={isDrafting ? 'Structuring logic...' : 'Awaiting trigger'} 
           />
           <AgentStatusItem 
             name="Storyboarder" icon={Layout} progress={isDrafting ? 20 : (activeScript ? 100 : 0)} 
             status={isDrafting ? 'active' : (activeScript ? 'ready' : 'pending')} task={isDrafting ? 'Designing visuals...' : 'Brand agnostic mode'} 
           />
           <AgentStatusItem 
             name="Sentinel" icon={ShieldCheck} progress={isDrafting ? 10 : (activeScript ? 100 : 0)} 
             status={isDrafting ? 'active' : (activeScript ? 'ready' : 'pending')} task="Audit: On standby" 
           />
        </div>

        <div className="flex items-center gap-6">
           <Tooltip title="Knowledge Verification">
             <button 
               onClick={() => setIsVerificationOpen(true)}
               className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${activeScript ? 'border-[#A7DADB]/30 bg-[#A7DADB]/5 text-[#A7DADB]' : 'border-white/5 bg-white/[0.02] text-slate-600'}`}
             >
                <Fingerprint size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{activeScript ? 'Verified' : 'Verify'}</span>
             </button>
           </Tooltip>
           
           <div className="h-8 w-[1px] bg-white/5" />
           
           <button 
             onClick={() => setIsVaultOpen(true)}
             className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 hover:text-[#A7DADB] hover:border-[#A7DADB]/20 transition-all"
           >
              <Database size={20} />
           </button>

           <button 
             onClick={handleMapConstellation}
             disabled={isDrafting || !currentModule}
             className="px-10 py-3.5 bg-[#4F46E5] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 flex items-center gap-3"
           >
             {isDrafting ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
             {isDrafting ? 'Synthesizing...' : 'Map Constellation'}
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10 p-12 custom-scrollbar">
         <AnimatePresence mode="wait">
            {activeScript || isDrafting ? (
              <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-screen-2xl mx-auto">
                 <ScriptDraftingWorkspace 
                   content={activeScript?.script || ""} 
                   semanticDelta={activeScript?.semanticDelta} 
                   citations={activeScript?.citations || []} 
                   deliverables={activeScript?.deliverables || []}
                   auditLog={activeScript?.auditLog || []}
                   isLoading={isDrafting} 
                   nodeId={currentModule?.id || ""} 
                 />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center text-center">
                 <div className="w-32 h-32 rounded-[3rem] bg-[#A7DADB]/5 border border-[#A7DADB]/10 flex items-center justify-center mb-12 relative">
                    <div className="absolute inset-0 bg-[#A7DADB]/10 blur-2xl animate-pulse" />
                    <Workflow size={48} className="text-[#A7DADB] relative z-10" />
                 </div>
                 <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-6">
                   {currentModule?.title || 'Prism Architect'}
                 </h2>
                 <p className="text-slate-500 max-w-md text-sm font-medium uppercase tracking-[0.2em] leading-relaxed">
                   Click &quot;Map Constellation&quot; to initialize multi-agent orchestration for this specific node.
                 </p>
                 <div className="mt-16 flex items-center gap-8 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                    <div className="flex items-center gap-3">
                       <ShieldCheck size={14} className="text-[#A7DADB]" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Grounding: 100% Target</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Code2 size={14} className="text-[#A7DADB]" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Schema: ULS-GLA</span>
                    </div>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </main>

      <KnowledgeVaultModal 
        isOpen={isVaultOpen} 
        onClose={() => setIsVaultOpen(false)} 
        blueprintId={blueprintId || ""} 
        blueprintContext={blueprint?.blueprint_json || {}} 
      />

      <Modal 
        open={isVerificationOpen} 
        onClose={() => setIsVerificationOpen(false)}
        closeAfterTransition
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: { backdropFilter: 'blur(32px)', bgcolor: 'rgba(2, 6, 23, 0.95)' }
          }
        }}
      >
        <Fade in={isVerificationOpen}>
          <Box sx={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            width: '95%', maxWidth: '1000px', maxHeight: '85vh', bgcolor: '#020617', 
            border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '48px', 
            p: 10, outline: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
             <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center">
                      <ShieldCheck size={28} className="text-[#A7DADB]" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Integrity Sentinel</h3>
                      <p className="text-[9px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Knowledge Alignment Pass</p>
                   </div>
                </div>
                <IconButton onClick={() => setIsVerificationOpen(false)} sx={{ color: '#A7DADB' }}><X /></IconButton>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-20">
                
                <section className="space-y-6">
                   <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                      <History size={14} /> Semantic Strategic Alignment
                   </div>
                   <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 prose prose-invert prose-sm max-w-none shadow-inner">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {ledger?.strategic_alignment_md || "Waiting for constellation mapping to complete integrity pass..."}
                      </ReactMarkdown>
                   </div>
                </section>

                {activeScript?.auditLog && activeScript.auditLog.length > 0 && (
                   <section className="space-y-6">
                      <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                         <ShieldAlert size={14} /> Sentinel Compliance Audit
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                         {activeScript.auditLog.map((log: string, i: number) => (
                           <div key={i} className="flex gap-4 items-start p-6 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-[#A7DADB]/20 transition-all">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#A7DADB] mt-1.5" />
                              <span className="text-[12px] font-bold text-slate-400">{log}</span>
                           </div>
                         ))}
                      </div>
                   </section>
                )}

                {activeScript?.schematic && (
                   <section className="space-y-6">
                      <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                         <Workflow size={14} /> Tactical Schematic (Architect)
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/[0.03] overflow-hidden">
                         <pre className="text-[10px] text-[#A7DADB]/80 font-mono whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(activeScript.schematic, null, 2)}
                         </pre>
                      </div>
                   </section>
                )}

                {activeScript?.state && (
                   <section className="space-y-6">
                      <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                         <Database size={14} /> Global Constellation State (Memory)
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/[0.03] overflow-hidden">
                         <pre className="text-[10px] text-indigo-300/80 font-mono whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(activeScript.state, null, 2)}
                         </pre>
                      </div>
                   </section>
                )}

                <section className="space-y-6">
                   <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                      <ScrollText size={14} /> Source Knowledge Ledger (Atomic Facts)
                   </div>
                   <div className="p-10 rounded-[2.5rem] bg-black/40 border border-white/[0.03] prose prose-invert prose-sm max-w-none text-slate-400">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {ledger?.subject_matter_md || "No subject matter facts ingested for this blueprint."}
                      </ReactMarkdown>
                   </div>
                </section>

                {ledger?.constraints && (
                  <section className="space-y-6">
                     <div className="flex items-center gap-4 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
                        <Settings2 size={14} /> Strategic Constraints Harvested
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        {ledger.constraints.map((c: Constraint, i: number) => (
                          <div key={i} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col gap-2">
                             <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black text-[#A7DADB] uppercase tracking-widest">{c.category}</span>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${c.impact_level === 'HIGH' ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-800 text-slate-500'}`}>{c.impact_level}</span>
                             </div>
                             <p className="text-xs text-slate-300 font-medium leading-relaxed">{c.requirement}</p>
                          </div>
                        ))}
                     </div>
                  </section>
                )}
             </div>
          </Box>
        </Fade>
      </Modal>

    </div>
  );
}

export default function ArchitectureCanvas() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#020617]"><CircularProgress sx={{ color: COLORS.accent }} /></div>}>
      <ArchitectureCanvasContent />
    </Suspense>
  );
}
