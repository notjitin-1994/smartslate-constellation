// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Grid, 
  Typography, 
  Button
} from '@mui/material';
import { 
  Layers, 
  Plus, 
  Calendar, 
  Activity, 
  ChevronRight, 
  Telescope,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

// --- Design System Constants ---

const COLORS = {
  background: '#020C1B',
  primary: '#7C69F5',
  secondary: '#A7DADB',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  glassBorder: 'rgba(124, 105, 245, 0.15)',
  glassBg: 'rgba(124, 105, 245, 0.04)',
};

const glassStyles = {
  background: COLORS.glassBg,
  backdropFilter: 'blur(16px)',
  border: `1px solid ${COLORS.glassBorder}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
};

// --- Sub-components ---

const AlphaBadge = () => (
  <Box
    sx={{
      px: 1,
      py: 0.25,
      borderRadius: '4px',
      background: 'rgba(167, 218, 219, 0.1)',
      border: `1px solid ${COLORS.secondary}44`,
      display: 'inline-flex',
      alignItems: 'center',
    }}
  >
    <Typography
      variant="caption"
      sx={{
        color: COLORS.secondary,
        fontWeight: 700,
        fontSize: '0.65rem',
        letterSpacing: '0.05em',
        fontFamily: 'monospace',
      }}
    >
      V.4-ALPHA
    </Typography>
  </Box>
);

const BlueprintCard = ({ title, date, usage, index }: { title: string, date: string, usage: string, index: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ height: '100%' }}
    >
      <Box
        sx={{
          ...glassStyles,
          height: '100%',
          p: 2.5,
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: `${COLORS.primary}88`,
            transform: 'translateY(-4px)',
            boxShadow: `0 0 30px ${COLORS.primary}15`,
          }
        }}
      >
        {/* Constellation Node Background Effect */}
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '150px',
            height: '150px',
            background: `radial-gradient(circle, ${COLORS.primary}10 0%, transparent 70%)`,
            zIndex: 0,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${COLORS.primary}15`,
                border: `1px solid ${COLORS.primary}33`,
              }}
            >
              <Layers size={16} color={COLORS.primary} />
            </Box>
            <AlphaBadge />
          </Box>

          <Typography
            variant="subtitle1"
            sx={{
              color: COLORS.textPrimary,
              fontWeight: 600,
              mb: 1,
              fontSize: '0.95rem',
              lineHeight: 1.2
            }}
          >
            {title}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={12} color={COLORS.textSecondary} />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.75rem' }}>
                {date}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Activity size={12} color={COLORS.textSecondary} />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.75rem' }}>
                {usage} [usage]
              </Typography>
            </Box>
          </Box>

          <Button
            fullWidth
            variant="contained"
            endIcon={<ChevronRight size={14} />}
            sx={{
              bgcolor: isHovered ? COLORS.primary : 'rgba(124, 105, 245, 0.08)',
              color: isHovered ? '#FFF' : COLORS.primary,
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              py: 1,
              borderRadius: '6px',
              border: `1px solid ${COLORS.primary}33`,
              transition: 'all 0.3s ease',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: COLORS.primary,
                boxShadow: `0 0 15px ${COLORS.primary}44`,
              }
            }}
          >
            Select & Architect
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
};

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{ width: '100%' }}
  >
    <Box
      sx={{
        ...glassStyles,
        borderRadius: '16px',
        p: 6,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: `radial-gradient(circle at center, rgba(124, 105, 245, 0.08) 0%, ${COLORS.glassBg} 100%)`,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          background: `rgba(124, 105, 245, 0.1)`,
          border: `1px solid ${COLORS.primary}33`,
          boxShadow: `0 0 40px ${COLORS.primary}10`,
        }}
      >
        <Telescope size={32} color={COLORS.primary} />
      </Box>
      
      <Typography variant="h6" sx={{ color: COLORS.textPrimary, mb: 1, fontWeight: 600 }}>
        [Deep Space Awaits]
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: COLORS.textSecondary, 
          maxWidth: '400px', 
          mb: 4,
          lineHeight: 1.6
        }}
      >
        Initialize your architecture by creating your first blueprint in Polaris. 
        Your strategic data trajectory begins here.
      </Typography>

      <Button
        variant="outlined"
        startIcon={<Plus size={18} />}
        sx={{
          color: COLORS.secondary,
          borderColor: `${COLORS.secondary}44`,
          textTransform: 'none',
          px: 4,
          py: 1.5,
          borderRadius: '8px',
          '&:hover': {
            borderColor: COLORS.secondary,
            background: `${COLORS.secondary}08`,
          }
        }}
      >
        Initialize Polaris Ingest
      </Button>
    </Box>
  </motion.div>
);

// --- Main Export ---

export default function BlueprintSelectionGrid({ 
  blueprints = [] 
}: { 
  blueprints?: Array<{ id: string, title: string, date: string, usage: string }> 
}) {
  return (
    <Box
      sx={{
        minHeight: '400px',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Sparkles size={20} color={COLORS.secondary} />
            <Typography 
              variant="overline" 
              sx={{ 
                color: COLORS.secondary, 
                letterSpacing: '0.2em',
                fontWeight: 600
              }}
            >
              Architecture Ingest
            </Typography>
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              color: COLORS.textPrimary, 
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}
          >
            [Select Blueprint]
          </Typography>
        </Box>

        {blueprints.length > 0 && (
          <Button
            startIcon={<Plus size={16} />}
            sx={{
              color: COLORS.textSecondary,
              fontSize: '0.8rem',
              '&:hover': { color: COLORS.textPrimary }
            }}
          >
            Add Ingest
          </Button>
        )}
      </Box>

      <AnimatePresence mode="wait">
        {blueprints.length === 0 ? (
          <EmptyState key="empty" />
        ) : (
          <Grid container spacing={3} key="grid">
            {blueprints.map((bp, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={bp.id}>
                <BlueprintCard 
                  title={bp.title} 
                  date={bp.date} 
                  usage={bp.usage} 
                  index={idx}
                />
              </Grid>
            ))}
            
            {/* Strategic Marketing Space Card */}
            <Grid size={{ xs: 12, md: 8, lg: 6 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Box
                  sx={{
                    ...glassStyles,
                    p: 3,
                    height: '100%',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 3,
                    alignItems: 'center',
                    background: `linear-gradient(135deg, ${COLORS.glassBg} 0%, rgba(167, 218, 219, 0.03) 100%)`,
                    border: `1px dashed ${COLORS.primary}44`,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: COLORS.secondary }}>
                      Pro Guidance
                    </Typography>
                    <Typography variant="body1" sx={{ color: COLORS.textPrimary, fontWeight: 600, mb: 1 }}>
                      Optimize Cognitive Trajectory
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block', mb: 2 }}>
                      Unlock high-fidelity architectural maps by upgrading your Polaris sync level.
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ArrowUpRight size={14} />}
                      sx={{ color: COLORS.primary, p: 0, minWidth: 0, textTransform: 'none' }}
                    >
                      Explore Tiers
                    </Button>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        )}
      </AnimatePresence>
    </Box>
  );
}
