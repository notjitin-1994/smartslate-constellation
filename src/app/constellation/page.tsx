// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
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
  AlertCircle
} from 'lucide-react';
import { 
  Box, 
  Typography, 
  Tooltip, 
  IconButton,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSidebar } from '@/lib/SidebarContext';

// --- DESIGN SYSTEM CONSTANTS ---
const COLORS = {
  bg: '#020C1B',
  primary: '#7C69F5',
  secondary: '#A7DADB',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  glassBorder: 'rgba(124, 105, 245, 0.15)',
  glassBg: 'rgba(124, 105, 245, 0.04)',
};

const glassStyles = {
  background: COLORS.glassBg,
  backdropFilter: 'blur(12px)',
  border: `1px solid ${COLORS.glassBorder}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
};

// --- HELPERS ---

/**
 * Extracts human-readable modules from the complex questionnaire structure
 */
const extractModules = (blueprint: any) => {
  if (!blueprint) return [];
  
  // 1. Check for standard blueprint_json modules
  const bj = blueprint.blueprint_json || {};
  const directModules = bj.curriculum_modules || bj.modules || [];
  if (directModules.length > 0) return directModules;

  // 2. Extract from dynamic_questions (Section 3: Content Scope)
  const dq = blueprint.dynamic_questions || [];
  const section3 = dq.find((s: any) => s.id === 's3');
  if (section3) {
    const moduleQuestion = section3.questions?.find((q: any) => q.id === 's3_q1');
    if (moduleQuestion && moduleQuestion.answer) {
      // Split newline-separated list into array of module objects
      return moduleQuestion.answer
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => ({
          title: line.replace(/^\d+[\.\)]\s*/, '').trim(), // Remove leading numbers
          description: 'Strategic module mapped from Polaris strategy questionnaire.'
        }));
    }
  }

  return [];
};

/**
 * Extracts target persona from static answers
 */
const extractPersona = (blueprint: any) => {
  const sa = blueprint?.static_answers || {};
  return sa.section_1_role_experience?.current_role || 'General Professional';
};

/**
 * Extracts primary objective
 */
const extractObjective = (blueprint: any) => {
  const sa = blueprint?.static_answers || {};
  const bj = blueprint?.blueprint_json || {};
  return bj.objective || sa.section_3_learning_gap?.learning_gap_description || 'No strategic objective defined.';
};

// --- COMPONENTS ---

const BlueprintPanel = ({ blueprint }: { blueprint: any }) => {
  const modules = extractModules(blueprint);
  const objective = extractObjective(blueprint);
  const persona = extractPersona(blueprint);
  
  return (
    <Box
      sx={{
        width: '350px',
        height: '100%',
        p: 3,
        overflowY: 'auto',
        borderRight: `1px solid ${COLORS.glassBorder}`,
        background: 'linear-gradient(180deg, rgba(2, 12, 27, 0.8) 0%, rgba(2, 12, 27, 0.4) 100%)',
      }}
    >
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="overline" sx={{ color: COLORS.secondary, fontWeight: 700, letterSpacing: '0.1em' }}>
          Polaris Blueprint
        </Typography>
        <Box sx={{ px: 1, py: 0.2, borderRadius: '4px', border: `1px solid ${COLORS.secondary}44`, fontSize: '10px', color: COLORS.secondary }}>
          V.4-ALPHA
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <section>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Target size={14} color={COLORS.primary} />
            <Typography variant="subtitle2" sx={{ color: COLORS.textPrimary }}>Strategic Objective</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.6, fontSize: '0.85rem' }}>
            {objective}
          </Typography>
        </section>

        <Divider sx={{ borderColor: 'rgba(124, 105, 245, 0.1)' }} />

        <section>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <BookOpen size={14} color={COLORS.primary} />
            <Typography variant="subtitle2" sx={{ color: COLORS.textPrimary }}>Strategy Modules</Typography>
          </Box>
          {modules.map((mod: any, i: number) => (
            <Box key={i} sx={{ mb: 2, p: 1.5, borderRadius: '8px', ...glassStyles, border: '1px solid rgba(124, 105, 245, 0.05)' }}>
              <Typography variant="caption" sx={{ color: COLORS.secondary, display: 'block', mb: 0.5 }}>Module 0{i + 1}</Typography>
              <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontSize: '0.8rem' }}>{mod.title}</Typography>
            </Box>
          ))}
          {modules.length === 0 && (
             <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>No modules found in strategy.</Typography>
          )}
        </section>

        <section>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Users size={14} color={COLORS.primary} />
            <Typography variant="subtitle2" sx={{ color: COLORS.textPrimary }}>Target Persona</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: '0.85rem' }}>
            {persona}
          </Typography>
        </section>
      </Box>
    </Box>
  );
};

const InstructionalNode = ({ index, isActive, onSelect, title }: { index: number, isActive: boolean, onSelect: () => void, title: string }) => {
  return (
    <Box
      component={motion.div}
      whileHover={{ x: 4 }}
      onClick={onSelect}
      sx={{
        p: 2,
        mb: 2,
        cursor: 'pointer',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        position: 'relative',
        ...glassStyles,
        borderColor: isActive ? COLORS.primary : COLORS.glassBorder,
        background: isActive ? 'rgba(124, 105, 245, 0.08)' : COLORS.glassBg,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 600 }}>
          NODE 0{index + 1}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Neural Path Active">
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.secondary, boxShadow: `0 0 8px ${COLORS.secondary}` }} />
          </Tooltip>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: COLORS.textPrimary, mb: 1, fontWeight: 500, lineClamp: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.6 }}>
          <Type size={12} color={COLORS.textSecondary} />
          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Analysis Active</Typography>
        </Box>
      </Box>

      {isActive && (
        <Box
          component={motion.div}
          layoutId="nodeGlow"
          sx={{
            position: 'absolute',
            inset: -1,
            borderRadius: '12px',
            border: `1px solid ${COLORS.primary}`,
            boxShadow: `0 0 15px ${COLORS.primary}33`,
            zIndex: -1
          }}
        />
      )}
    </Box>
  );
};

function ArchitectureCanvasContent() {
  const searchParams = useSearchParams();
  const blueprintId = searchParams.get('blueprintId');
  const [loading, setLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<any>(null);
  const [activeNode, setActiveNode] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: COLORS.bg }}>
        <CircularProgress sx={{ color: COLORS.primary, mb: 3 }} />
        <Typography sx={{ color: COLORS.textSecondary, fontMono: 'monospace', fontSize: '10px', letterSpacing: '0.2em' }}>
          INITIALIZING ARCHITECTURAL ENGINE...
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

  const modules = extractModules(blueprint);
  const currentModule = modules[activeNode] || null;

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      bgcolor: COLORS.bg, 
      color: COLORS.textPrimary,
      fontFamily: '"Quicksand", "Lato", sans-serif',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        flex: 1, 
        mr: 2, 
        my: 2, 
        display: 'flex', 
        ...glassStyles, 
        borderRadius: '24px', 
        overflow: 'hidden' 
      }}>
        {/* LEFT PANE: Polaris Reference */}
        <BlueprintPanel blueprint={blueprint} />

        {/* RIGHT PANE: Architecture Canvas */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${COLORS.glassBorder}`
          }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Architecture Canvas</Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                Constructing instructional flow for <span className="text-[#A7DADB] font-bold">{blueprint?.title || 'Standalone Architecture'}</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                size="small"
                startIcon={<Share2 size={16} />}
                sx={{ 
                  color: COLORS.textSecondary, 
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  '&:hover': { color: COLORS.textPrimary }
                }}
              >
                Export
              </Button>
              <Box sx={{ position: 'relative' }}>
                <Button
                  variant="contained"
                  startIcon={<Sparkles size={16} />}
                  sx={{
                    bgcolor: COLORS.primary,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    px: 3,
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      transition: 'all 0.5s',
                    },
                    '&:hover::after': {
                      left: '100%',
                      transition: 'all 0.5s',
                    }
                  }}
                >
                  Finalize Architecture
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Dual Panel Content */}
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Storyboard Nodes Scroll */}
            <Box sx={{ 
              width: '320px', 
              p: 3, 
              overflowY: 'auto', 
              borderRight: `1px solid ${COLORS.glassBorder}`,
              background: 'rgba(2, 12, 27, 0.2)'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="overline" sx={{ color: COLORS.textSecondary }}>Strategic Nodes</Typography>
                <IconButton size="small" sx={{ color: COLORS.primary }}>
                  <Plus size={18} />
                </IconButton>
              </Box>
              
              {modules.map((mod: any, i: number) => (
                <InstructionalNode 
                  key={i} 
                  index={i} 
                  isActive={activeNode === i} 
                  onSelect={() => setActiveNode(i)}
                  title={mod.title || mod.name || `Node 0${i+1}`}
                />
              ))}

              {modules.length === 0 && (
                <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
                  <Layers size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
                  <Typography variant="caption">Ready for Ingestion</Typography>
                </Box>
              )}
            </Box>

            {/* Script & Asset Mapping Workspace */}
            <Box sx={{ flex: 1, p: 4, overflowY: 'auto', position: 'relative' }}>
              <AnimatePresence mode="wait">
                <Box
                  key={activeNode}
                  component={motion.div}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
                        {currentModule?.title || '[Select Strategic Node]'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box sx={{ px: 1, py: 0.5, borderRadius: '4px', border: `1px solid ${COLORS.primary}44`, fontSize: '10px', color: COLORS.primary }}>
                          ARCHITECTING
                        </Box>
                        <Box sx={{ px: 1, py: 0.5, borderRadius: '4px', border: `1px solid ${COLORS.secondary}44`, fontSize: '10px', color: COLORS.secondary }}>
                          READY FOR RAG
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Script Editor Simulation */}
                  <Box sx={{ 
                    minHeight: '300px', 
                    p: 3, 
                    borderRadius: '16px', 
                    ...glassStyles, 
                    border: '1px solid rgba(124, 105, 245, 0.1)',
                    position: 'relative'
                  }}>
                    <Typography variant="overline" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>
                      Architecture Logic
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: COLORS.textPrimary, 
                        lineHeight: 1.8, 
                        fontSize: '1rem',
                        '& .highlight': {
                          background: `linear-gradient(90deg, ${COLORS.primary}33, transparent)`,
                          borderLeft: `2px solid ${COLORS.primary}`,
                          px: 1,
                          py: 0.5,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: `linear-gradient(90deg, ${COLORS.primary}66, transparent)`,
                            boxShadow: `0 0 20px ${COLORS.primary}22`
                          }
                        }
                      }}
                    >
                      {currentModule?.description || 'Select a node from the strategy to initialize the architectural drafting engine. Constellation will map this node to your ingested organizational data.'}
                    </Typography>

                    {/* AI Glow Element */}
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 20, 
                      right: 20, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      p: 1,
                      px: 2,
                      borderRadius: '20px',
                      background: `linear-gradient(135deg, ${COLORS.primary}22, ${COLORS.secondary}22)`,
                      border: `1px solid ${COLORS.primary}44`,
                      backdropFilter: 'blur(4px)'
                    }}>
                      <Sparkles size={14} color={COLORS.secondary} />
                      <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 600 }}>Engine Ready</Typography>
                    </Box>
                  </Box>

                  {/* Asset Map Section */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" sx={{ color: COLORS.textSecondary, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Database size={14} /> Local Data Grounding
                    </Typography>
                    <Box sx={{ 
                      p: 4, 
                      borderRadius: '16px', 
                      border: '1px dashed rgba(167, 218, 219, 0.2)',
                      textAlign: 'center',
                      background: 'rgba(167, 218, 219, 0.02)'
                    }}>
                       <Plus size={24} color={COLORS.secondary} style={{ margin: '0 auto 12px' }} />
                       <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                         Upload organizational assets (SOPs, Manuals, PDFs) to ground this module.
                       </Typography>
                       <Button 
                        size="small" 
                        sx={{ mt: 2, color: COLORS.secondary, textTransform: 'none' }}
                        onClick={() => router.push('/assets')}
                       >
                         Initialize Ingest Engine
                       </Button>
                    </Box>
                  </Box>
                </Box>
              </AnimatePresence>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Atmospheric Radial Gradients */}
      <Box sx={{
        position: 'fixed',
        top: '10%',
        right: '5%',
        width: '400px',
        height: '400px',
        background: `radial-gradient(circle, ${COLORS.primary}11 0%, transparent 70%)`,
        zIndex: -1,
        pointerEvents: 'none'
      }} />
      <Box sx={{
        position: 'fixed',
        bottom: '5%',
        left: '20%',
        width: '300px',
        height: '300px',
        background: `radial-gradient(circle, ${COLORS.secondary}08 0%, transparent 70%)`,
        zIndex: -1,
        pointerEvents: 'none'
      }} />
    </Box>
  );
}

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
