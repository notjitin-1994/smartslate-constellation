// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState } from 'react';
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
  Type
} from 'lucide-react';
import { 
  Box, 
  Typography, 
  Tooltip, 
  IconButton,
  Button,
  Divider,
  TextField
} from '@mui/material';

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

// --- COMPONENTS ---

const NavigationSidebar = () => {
  const navItems = [
    { icon: <Database size={18} />, label: 'Asset Ingest' },
    { icon: <FileCode size={18} />, label: 'ScriptGen' },
    { icon: <Layers size={18} />, label: 'Storyboard' },
    { icon: <SearchCheck size={18} />, label: 'Gap Analysis' },
  ];

  return (
    <Box
      component={motion.div}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      sx={{
        width: '64px',
        height: 'calc(100vh - 32px)',
        m: 2,
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 3,
        gap: 4,
        position: 'fixed',
        left: 0,
        zIndex: 100,
        ...glassStyles,
      }}
    >
      <Box sx={{ color: COLORS.secondary, mb: 2 }}>
        <LayoutDashboard size={24} />
      </Box>
      {navItems.map((item, index) => (
        <Tooltip key={index} title={item.label} placement="right">
          <IconButton
            sx={{
              color: index === 2 ? COLORS.primary : COLORS.textSecondary,
              transition: 'all 0.3s ease',
              '&:hover': { color: COLORS.primary, background: 'rgba(124, 105, 245, 0.1)' },
              position: 'relative'
            }}
          >
            {item.icon}
            {index === 2 && (
              <Box
                component={motion.div}
                layoutId="navIndicator"
                sx={{
                  position: 'absolute',
                  right: -8,
                  width: '3px',
                  height: '20px',
                  background: COLORS.primary,
                  borderRadius: '0 4px 4px 0',
                  boxShadow: `0 0 10px ${COLORS.primary}`
                }}
              />
            )}
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
};

const BlueprintPanel = () => {
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
            <Typography variant="subtitle2" sx={{ color: COLORS.textPrimary }}>[Objective Title]</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.6, fontSize: '0.85rem' }}>
            [Description of the strategic learning objective mapped from the original Polaris ingest.]
          </Typography>
        </section>

        <Divider sx={{ borderColor: 'rgba(124, 105, 245, 0.1)' }} />

        <section>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <BookOpen size={14} color={COLORS.primary} />
            <Typography variant="subtitle2" sx={{ color: COLORS.textPrimary }}>Curriculum Modules</Typography>
          </Box>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ mb: 2, p: 1.5, borderRadius: '8px', ...glassStyles, border: '1px solid rgba(124, 105, 245, 0.05)' }}>
              <Typography variant="caption" sx={{ color: COLORS.secondary, display: 'block', mb: 0.5 }}>Module 0{i}</Typography>
              <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontSize: '0.8rem' }}>[Module Title Placeholder]</Typography>
            </Box>
          ))}
        </section>

        <section>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Users size={14} color={COLORS.primary} />
            <Typography variant="subtitle2" sx={{ color: COLORS.textPrimary }}>Target Audience</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: '0.85rem' }}>
            [Defined Persona Group]
          </Typography>
        </section>
      </Box>
    </Box>
  );
};

const InstructionalNode = ({ index, isActive, onSelect }: { index: number, isActive: boolean, onSelect: () => void }) => {
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
          MOMENT 0{index + 1}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Asset Linked">
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.secondary, boxShadow: `0 0 8px ${COLORS.secondary}` }} />
          </Tooltip>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: COLORS.textPrimary, mb: 1, fontWeight: 500 }}>
        [Instructional Moment Title]
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.6 }}>
          <Type size={12} color={COLORS.textSecondary} />
          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>[Duration]</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.6 }}>
          <Database size={12} color={COLORS.textSecondary} />
          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{index % 2 === 0 ? '2' : '1'} Assets</Typography>
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

import { useSidebar } from '@/lib/SidebarContext';

export default function ArchitectureCanvas() {
  const [activeNode, setActiveNode] = useState(0);
  const { collapsed } = useSidebar();

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
        <BlueprintPanel />

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
                Constructing instructional flow from Polaris intelligence
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
                <Typography variant="overline" sx={{ color: COLORS.textSecondary }}>Flow Sequences</Typography>
                <IconButton size="small" sx={{ color: COLORS.primary }}>
                  <Plus size={18} />
                </IconButton>
              </Box>
              
              {[0, 1, 2, 3, 4].map((i) => (
                <InstructionalNode 
                  key={i} 
                  index={i} 
                  isActive={activeNode === i} 
                  onSelect={() => setActiveNode(i)}
                />
              ))}
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
                        [Instructional Moment 0{activeNode + 1}]
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box sx={{ px: 1, py: 0.5, borderRadius: '4px', border: `1px solid ${COLORS.primary}44`, fontSize: '10px', color: COLORS.primary }}>
                          SCRIPTING
                        </Box>
                        <Box sx={{ px: 1, py: 0.5, borderRadius: '4px', border: `1px solid ${COLORS.secondary}44`, fontSize: '10px', color: COLORS.secondary }}>
                          ASSET LINKED
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
                      Script Draft
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
                      [Narrative content here. Constellation analyzes the Polaris Blueprint to generate technical scripts.] 
                      <span className="highlight">
                        [Highlighted AI-suggested instructional segment with glow effect]
                      </span> 
                      [Continue script generation based on organizational assets.]
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
                      <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 600 }}>AI Refinement Active</Typography>
                    </Box>
                  </Box>

                  {/* Asset Map Section */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" sx={{ color: COLORS.textSecondary, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Database size={14} /> Linked Organizational Assets
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {[1, 2].map((a) => (
                        <Box 
                          key={a}
                          sx={{ 
                            p: 2, 
                            borderRadius: '12px', 
                            ...glassStyles, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            width: '240px',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                          }}
                        >
                          <Box sx={{ p: 1, borderRadius: '8px', background: 'rgba(167, 218, 219, 0.1)' }}>
                            <FileCode size={20} color={COLORS.secondary} />
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block', color: COLORS.textPrimary, fontWeight: 600 }}>[Asset_File_Name.pdf]</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Source: Polaris Ingest</Typography>
                          </Box>
                        </Box>
                      ))}
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
