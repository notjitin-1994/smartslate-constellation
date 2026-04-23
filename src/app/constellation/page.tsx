// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Sparkles, 
  Target, 
  ChevronRight,
  Database,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  Zap,
  ShieldCheck,
  Code2,
  Activity,
  FileText,
  Video,
  Monitor,
  MousePointer2,
  MessageSquare,
  Info
} from 'lucide-react';
import { 
  Box, 
  Typography, 
  Button, 
  Divider, 
  CircularProgress, 
  Chip, 
  LinearProgress, 
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { KnowledgeVaultModal } from '@/components/blueprints/KnowledgeVaultModal';
import ScriptDraftingWorkspace from '@/components/blueprints/ScriptDraftingWorkspace';
import { ScriptOutput } from '@/lib/services/instructionalArchitectService';

// --- DESIGN SYSTEM CONSTANTS ---
const COLORS = {
  bg: '#020C1B',
  primary: '#7C69F5',
  secondary: '#A7DADB',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  glassBorder: 'rgba(124, 105, 245, 0.15)',
  glassBg: 'rgba(124, 105, 245, 0.04)',
  success: '#10B981',
  warning: '#F59E0B'
};

const glassStyles = {
  background: COLORS.glassBg,
  backdropFilter: 'blur(12px)',
  border: `1px solid ${COLORS.glassBorder}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
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
  blueprint_json?: {
    executive_summary?: { content: string };
    target_audience?: { demographics?: { roles: string[] } };
    learning_objectives?: { objectives?: Array<{ title: string }> };
    content_outline?: { modules: Record<string, unknown>[] };
    instructional_strategy?: {
      modalities?: Array<{ type: string; rationale: string; allocation_percent: number }>;
    };
  };
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
  const bj = blueprint.blueprint_json || { 
    content_outline: { modules: [] }, 
    learning_objectives: { objectives: [] },
    instructional_strategy: { modalities: [] }
  };
  const modules = bj.content_outline?.modules || [];
  const globalModalities = bj.instructional_strategy?.modalities || [];

  return modules.map((mod: Record<string, unknown>, i: number) => {
    const deliveryMethod = String(mod.delivery_method || '').toLowerCase();
    
    // Intelligent Modality Matcher: Find best fit from global modalities
    const matchedModality = globalModalities.find((m: { type: string; rationale: string; allocation_percent: number }) => 
      deliveryMethod.includes(m.type.toLowerCase()) || 
      m.type.toLowerCase().includes(deliveryMethod)
    ) || globalModalities[0] || { type: 'Standard eLearning', rationale: 'Default delivery method.' };

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

const StatBadge = ({ icon: Icon, label, value, color = COLORS.primary }: { icon: React.ElementType, label: string, value: string, color?: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.02)', p: 1, px: 1.5, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
    <Icon size={14} color={color} />
    <Box>
      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block', fontSize: '10px', lineHeight: 1 }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem' }}>{value}</Typography>
    </Box>
  </Box>
);

const HandoverStatus = ({ status }: { status: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
    <Box sx={{ position: 'relative' }}>
      <BrainCircuit size={20} color={COLORS.secondary} />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', inset: 0, background: COLORS.secondary, borderRadius: '50%', filter: 'blur(8px)', zIndex: -1 }} />
    </Box>
    <Box>
      <Typography variant="overline" sx={{ color: COLORS.secondary, display: 'block', lineHeight: 1, fontWeight: 700 }}>Generative Learning Architect</Typography>
      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Status: <span style={{ color: COLORS.success }}>{status}</span></Typography>
    </Box>
  </Box>
);

function ArchitectureCanvasContent() {
  const searchParams = useSearchParams();
  const blueprintId = searchParams.get('blueprintId');
  const [loading, setLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [activeNodeIdx, setActiveNodeIdx] = useState(0);
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
  
  // Merge AI output with base modules
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

  const currentModule = modules[activeNodeIdx] || null;

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
          targetModality: currentModule.targetModality, // Added modality context
          blueprintId
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
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: COLORS.bg }}>
      <CircularProgress sx={{ color: COLORS.primary, mb: 3 }} />
      <Typography sx={{ color: COLORS.textSecondary, fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em' }}>INITIALIZING GENERATIVE ARCHITECT...</Typography>
    </Box>
  );

  if (error || (!blueprint && blueprintId)) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: COLORS.bg, p: 4, textAlign: 'center' }}>
      <AlertCircle size={48} className="text-red-500 mb-6" />
      <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>Handover Protocol Interrupted</Typography>
      <Button variant="outlined" onClick={() => router.push('/handover')} sx={{ color: COLORS.secondary, borderColor: COLORS.secondary }}>Return to Gateway</Button>
    </Box>
  );

  const activeScript = scriptOutputs[activeNodeIdx];

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: COLORS.bg, color: COLORS.textPrimary, fontFamily: '"Quicksand", "Lato", sans-serif', overflow: 'hidden' }}>
      <Box sx={{ width: '288px', borderRight: `1px solid ${COLORS.glassBorder}`, p: 3, display: 'flex', flexDirection: 'column' }}>
        <HandoverStatus status="ARCHITECTING" />
        <Typography variant="overline" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>Strategy Trace</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(124, 105, 245, 0.05)', border: '1px solid rgba(124, 105, 245, 0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Target size={14} color={COLORS.primary} /><Typography variant="caption" sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>STRATEGIC GOAL</Typography></Box>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: '0.75rem', lineHeight: 1.5 }}>{blueprint?.blueprint_json?.executive_summary?.content?.substring(0, 150)}...</Typography>
          </Box>
          <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
          <Typography variant="overline" sx={{ color: COLORS.textSecondary, mb: 1, display: 'block' }}>Neural Nodes</Typography>
          {modules.map((mod: ModuleData, i: number) => (
            <Box key={i} onClick={() => setActiveNodeIdx(i)} sx={{ p: 1.5, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease', border: `1px solid ${activeNodeIdx === i ? COLORS.primary : 'transparent'}`, bgcolor: activeNodeIdx === i ? 'rgba(124, 105, 245, 0.1)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: COLORS.secondary, fontSize: '10px' }}>{mod.id}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {getModalityIcon(mod.targetModality)}
                  <div className="w-1 h-1 rounded-full bg-white/20 mx-1" />
                  {mod.groundingTypes?.includes('pdf') && <FileText size={10} color={COLORS.secondary} />}
                  {mod.groundingTypes?.includes('video') && <Video size={10} color={COLORS.primary} />}
                  <Zap size={10} color={activeNodeIdx === i ? COLORS.primary : COLORS.textSecondary} />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: activeNodeIdx === i ? 'white' : COLORS.textSecondary, fontWeight: activeNodeIdx === i ? 600 : 400, fontSize: '0.8rem' }}>{mod.title}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}>{currentModule?.title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Modality: <span style={{ color: COLORS.secondary, fontWeight: 700 }}>{currentModule?.targetModality}</span></Typography>
               <Tooltip title={currentModule?.modalityRationale}>
                 <IconButton size="small" sx={{ color: COLORS.textSecondary }}><Info size={14} /></IconButton>
               </Tooltip>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Code2 size={16} />} onClick={() => setShowUlsPreview(true)} sx={{ borderColor: COLORS.glassBorder, color: COLORS.textSecondary, textTransform: 'none', borderRadius: '8px' }}>ULS Preview</Button>
            <Button variant="contained" onClick={handleDraftScript} disabled={isDrafting} startIcon={isDrafting ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />} sx={{ bgcolor: COLORS.primary, textTransform: 'none', borderRadius: '8px', px: 3 }}>{activeScript ? 'Re-Draft Script' : 'Draft Script'}</Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
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
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ ...glassStyles, p: 3, borderRadius: '20px', mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.secondary }}><BrainCircuit size={16} /> Instructional Strategy Layer (ISL)</Typography><Chip label={currentModule?.pedagogicalMode} size="small" sx={{ bgcolor: COLORS.primary, color: 'white', fontWeight: 700, fontSize: '10px' }} /></Box>
                  <Typography variant="body1" sx={{ color: 'white', mb: 4, lineHeight: 1.7 }}>{currentModule?.description}</Typography>
                  <Typography variant="overline" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>Neural Interaction Graph</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {currentModule?.learning_activities?.map((act: { type: string; duration: string; activity: string }, idx: number) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(124, 105, 245, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Activity size={18} color={COLORS.primary} /></Box>
                        <Box sx={{ flex: 1 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 700 }}>{act.type}</Typography><Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{act.duration}</Typography></Box><Typography variant="body2" sx={{ color: COLORS.textPrimary }}>{act.activity}</Typography></Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ ...glassStyles, p: 3, borderRadius: '20px' }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.secondary, mb: 3 }}><ShieldCheck size={16} /> Cognitive Guardrails (CLG)</Typography>
                    <Box sx={{ mb: 3 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Cognitive Load Score</Typography><Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 700 }}>{currentModule?.cognitiveLoad || 0}/10</Typography></Box><LinearProgress variant="determinate" value={(currentModule?.cognitiveLoad || 0) * 10} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary } }} /></Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <StatBadge icon={Layers} label="SCAFFOLDING" value={currentModule?.scaffolding || "MEDIUM"} />
                      <StatBadge icon={CheckCircle2} label="ASSET GROUNDING" value={currentModule?.assetGroundingStatus || "PENDING"} color={currentModule?.assetGroundingStatus === 'RESOLVED' ? COLORS.success : COLORS.warning} />
                    </Box>
                  </Box>
                  <Box sx={{ ...glassStyles, p: 3, borderRadius: '20px', border: `1px dashed ${COLORS.secondary}44` }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.secondary, mb: 2 }}><Database size={16} /> Knowledge Harvesting</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>Ground this node in organizational truth.</Typography>
                    <Button fullWidth variant="outlined" onClick={() => setIsVaultOpen(true)} size="small" sx={{ borderColor: COLORS.secondary, color: COLORS.secondary, textTransform: 'none', borderRadius: '8px' }}>Open Knowledge Vault</Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>

      <KnowledgeVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} blueprintId={blueprintId || ""} />

      <AnimatePresence>
        {showUlsPreview && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} sx={{ position: 'fixed', inset: 0, zIndex: 1000, bgcolor: 'rgba(2, 12, 27, 0.9)', backdropFilter: 'blur(20px)', p: 6, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ maxWidth: '800px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Code2 size={24} color={COLORS.primary} /><Box><Typography variant="h6">Universal Learning Schema (ULS)</Typography><Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Machine-Executable Handover Packet</Typography></Box></Box><IconButton onClick={() => setShowUlsPreview(false)} sx={{ color: 'white' }}><ChevronRight /></IconButton></Box>
              <Box sx={{ flex: 1, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', p: 3, overflow: 'auto' }}>
                <pre style={{ margin: 0, color: COLORS.secondary, fontSize: '12px', fontFamily: 'monospace' }}>
                  {JSON.stringify({
                    uls_version: "1.0-GLA",
                    meta: { polaris_id: blueprintId, strategy_alignment: "HIGH" },
                    active_node: {
                      node_id: currentModule?.id,
                      mode: currentModule?.pedagogicalMode,
                      modality: currentModule?.targetModality,
                      script: activeScript?.script,
                      grounding: activeScript?.groundingScore,
                      cognitive_load: currentModule?.cognitiveLoad
                    },
                    full_sequence: modules.map((m: ModuleData) => ({ id: m.id, mode: m.pedagogicalMode, modality: m.targetModality }))
                  }, null, 2)}
                </pre>
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default function ArchitectureCanvas() {
  return <Suspense fallback={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: COLORS.bg }}><CircularProgress sx={{ color: COLORS.primary }} /></Box>}><ArchitectureCanvasContent /></Suspense>;
}
