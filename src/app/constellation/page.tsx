// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileCode, 
  Layers, 
  SearchCheck, 
  Sparkles, 
  Plus, 
  Share2, 
  Target, 
  BookOpen, 
  Users, 
  ChevronRight,
  Database,
  Type,
  AlertCircle,
  Clock,
  ExternalLink,
  CheckCircle2,
  BrainCircuit,
  Zap,
  ShieldCheck,
  Code2,
  ArrowRightLeft
} from 'lucide-react';
import { 
  Box, 
  Typography, 
  Tooltip, 
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Chip,
  LinearProgress,
  Grid
} from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

// --- HELPERS ---

/**
 * Maps Polaris Bloom's levels to Instructional Scaffolding intensities
 */
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

/**
 * Extracts and enriches module data for the ULS
 */
const extractEnrichedModules = (blueprint: any) => {
  if (!blueprint) return [];
  
  const bj = blueprint.blueprint_json || {};
  const modules = bj.content_outline?.modules || [];
  
  return modules.map((mod: any, i: number) => ({
    ...mod,
    id: `NODE_0${i + 1}`,
    pedagogicalMode: i === 0 ? 'ACTIVATION' : mod.assessment ? 'APPLICATION' : 'DEMONSTRATION',
    cognitiveLoad: Math.floor(Math.random() * 4) + 3, // Mocked CLG score
    scaffolding: mapScaffolding(bj.learning_objectives?.objectives?.[0]?.title || 'apply'),
    assetGroundingStatus: 'LINKED'
  }));
};

// --- SUB-COMPONENTS ---

const StatBadge = ({ icon: Icon, label, value, color = COLORS.primary }: any) => (
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
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{ position: 'absolute', inset: 0, background: COLORS.secondary, borderRadius: '50%', filter: 'blur(8px)', zIndex: -1 }}
      />
    </Box>
    <Box>
      <Typography variant="overline" sx={{ color: COLORS.secondary, display: 'block', lineHeight: 1, fontWeight: 700 }}>
        Generative Learning Architect
      </Typography>
      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
        Status: <span style={{ color: COLORS.success }}>{status}</span>
      </Typography>
    </Box>
  </Box>
);

function ArchitectureCanvasContent() {
  const searchParams = useSearchParams();
  const blueprintId = searchParams.get('blueprintId');
  const [loading, setLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<any>(null);
  const [activeNodeIdx, setActiveNodeIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showUlsPreview, setShowUlsPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBlueprint = async () => {
      if (!blueprintId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: bpError } = await supabase
          .from('blueprint_generator')
          .select('*')
          .eq('id', blueprintId)
          .single();

        if (bpError) throw bpError;
        setBlueprint(data);
      } catch (err: any) {
        console.error('Canvas Fetch Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlueprint();
  }, [blueprintId]);

  const modules = useMemo(() => extractEnrichedModules(blueprint), [blueprint]);
  const currentModule = modules[activeNodeIdx] || null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: COLORS.bg }}>
        <CircularProgress sx={{ color: COLORS.primary, mb: 3 }} />
        <Typography sx={{ color: COLORS.textSecondary, fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em' }}>
          INITIALIZING GENERATIVE ARCHITECT...
        </Typography>
      </Box>
    );
  }

  if (error || (!blueprint && blueprintId)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: COLORS.bg, p: 4, textAlign: 'center' }}>
        <AlertCircle size={48} className="text-red-500 mb-6" />
        <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>Handover Protocol Interrupted</Typography>
        <Typography sx={{ color: COLORS.textSecondary, mb: 4, maxWidth: '400px' }}>{error || 'Strategic blueprint not found in Solara network.'}</Typography>
        <Button variant="outlined" onClick={() => router.push('/handover')} sx={{ color: COLORS.secondary, borderColor: COLORS.secondary }}>
          Return to Gateway
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      bgcolor: COLORS.bg, 
      color: COLORS.textPrimary,
      fontFamily: '"Quicksand", "Lato", sans-serif',
      overflow: 'hidden'
    }}>
      {/* --- LEFT NAVIGATION: Polaris Strategy Trace --- */}
      <Box sx={{ width: '288px', borderRight: `1px solid ${COLORS.glassBorder}`, p: 3, display: 'flex', flexDirection: 'column' }}>
        <HandoverStatus status="ARCHITECTING" />
        
        <Typography variant="overline" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>Strategy Trace</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(124, 105, 245, 0.05)', border: '1px solid rgba(124, 105, 245, 0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Target size={14} color={COLORS.primary} />
              <Typography variant="caption" sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>STRATEGIC GOAL</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: '0.75rem', lineHeight: 1.5 }}>
              {blueprint?.blueprint_json?.executive_summary?.content?.substring(0, 150)}...
            </Typography>
          </Box>

          <Box sx={{ p: 2, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Users size={14} color={COLORS.primary} />
              <Typography variant="caption" sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>PERSONA CONTEXT</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {blueprint?.blueprint_json?.target_audience?.demographics?.roles?.map((r: string, i: number) => (
                <Chip key={i} label={r} size="small" sx={{ fontSize: '9px', height: '20px', bgcolor: 'rgba(167, 218, 219, 0.1)', color: COLORS.secondary }} />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />

          <Typography variant="overline" sx={{ color: COLORS.textSecondary, mb: 1, display: 'block' }}>Neural Nodes</Typography>
          {modules.map((mod: any, i: number) => (
            <Box
              key={i}
              onClick={() => setActiveNodeIdx(i)}
              sx={{
                p: 1.5,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: `1px solid ${activeNodeIdx === i ? COLORS.primary : 'transparent'}`,
                bgcolor: activeNodeIdx === i ? 'rgba(124, 105, 245, 0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: COLORS.secondary, fontSize: '10px' }}>{mod.id}</Typography>
                <Zap size={10} color={activeNodeIdx === i ? COLORS.primary : COLORS.textSecondary} />
              </Box>
              <Typography variant="body2" sx={{ color: activeNodeIdx === i ? 'white' : COLORS.textSecondary, fontWeight: activeNodeIdx === i ? 600 : 400, fontSize: '0.8rem' }}>
                {mod.title}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* --- CENTER: The Architecture Workspace --- */}
      <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}>
              {currentModule?.title}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
              Architectural Node Sequencing for <span style={{ color: COLORS.secondary }}>{blueprint?.title}</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<Code2 size={16} />}
              onClick={() => setShowUlsPreview(true)}
              sx={{ borderColor: COLORS.glassBorder, color: COLORS.textSecondary, textTransform: 'none', borderRadius: '8px' }}
            >
              ULS Preview
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Sparkles size={16} />}
              sx={{ bgcolor: COLORS.primary, textTransform: 'none', borderRadius: '8px', px: 3 }}
            >
              Commit to Nova
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* ISL: Instructional Strategy Layer */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ ...glassStyles, p: 3, borderRadius: '20px', mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.secondary }}>
                  <BrainCircuit size={16} /> Instructional Strategy Layer (ISL)
                </Typography>
                <Chip label={currentModule?.pedagogicalMode} size="small" sx={{ bgcolor: COLORS.primary, color: 'white', fontWeight: 700, fontSize: '10px' }} />
              </Box>
              
              <Typography variant="body1" sx={{ color: 'white', mb: 4, lineHeight: 1.7 }}>
                {currentModule?.description}
              </Typography>

              <Typography variant="overline" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>Neural Interaction Graph</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {currentModule?.learning_activities?.map((act: any, idx: number) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(124, 105, 245, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Activity size={18} color={COLORS.primary} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 700 }}>{act.type}</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{act.duration}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>{act.activity}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* CLG: Cognitive Load Guardrails */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ ...glassStyles, p: 3, borderRadius: '20px' }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.secondary, mb: 3 }}>
                  <ShieldCheck size={16} /> Cognitive Guardrails (CLG)
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Cognitive Load Score</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 700 }}>{currentModule?.cognitiveLoad}/10</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={currentModule?.cognitiveLoad * 10} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary } }} />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <StatBadge icon={Layers} label="SCAFFOLDING" value={currentModule?.scaffolding} />
                  <StatBadge icon={CheckCircle2} label="ASSET GROUNDING" value={currentModule?.assetGroundingStatus} color={COLORS.success} />
                  <StatBadge icon={ArrowRightLeft} label="SEMANTIC DELTA" value="RESOLVED" color={COLORS.success} />
                </Box>
              </Box>

              <Box sx={{ ...glassStyles, p: 3, borderRadius: '20px', border: `1px dashed ${COLORS.secondary}44` }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.secondary, mb: 2 }}>
                  <Database size={16} /> Knowledge Harvesting
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>
                  Inject local SOPs or manuals to ground this architectural node in organizational truth.
                </Typography>
                <Button fullWidth variant="outlined" size="small" sx={{ borderColor: COLORS.secondary, color: COLORS.secondary, textTransform: 'none' }}>
                  Open MCP Ingest
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* --- ULS SCHEMA OVERLAY --- */}
      <AnimatePresence>
        {showUlsPreview && (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            sx={{ position: 'fixed', inset: 0, zIndex: 1000, bgcolor: 'rgba(2, 12, 27, 0.9)', backdropFilter: 'blur(20px)', p: 6, display: 'flex', justifyContent: 'center' }}
          >
            <Box sx={{ maxWidth: '800px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Code2 size={24} color={COLORS.primary} />
                  <Box>
                    <Typography variant="h6">Universal Learning Schema (ULS)</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Machine-Executable Handover Packet for Nova</Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setShowUlsPreview(false)} sx={{ color: 'white' }}>
                  <ChevronRight />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', p: 3, overflow: 'auto' }}>
                <pre style={{ margin: 0, color: COLORS.secondary, fontSize: '12px', fontFamily: 'monospace' }}>
                  {JSON.stringify({
                    uls_version: "1.0-GLA",
                    meta: { polaris_id: blueprintId, strategy_alignment: "HIGH" },
                    pedagogical_model: "Merrill_First_Principles",
                    active_node: {
                      node_id: currentModule?.id,
                      mode: currentModule?.pedagogicalMode,
                      cognitive_load: currentModule?.cognitiveLoad,
                      scaffolding: currentModule?.scaffolding,
                      asset_grounding: currentModule?.assetGroundingStatus
                    },
                    full_sequence: modules.map((m: any) => ({ id: m.id, mode: m.pedagogicalMode }))
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

import { Activity } from 'lucide-react';

export default function ArchitectureCanvas() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: COLORS.bg }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    }>
      <ArchitectureCanvasContent />
    </Suspense>
  );
}
