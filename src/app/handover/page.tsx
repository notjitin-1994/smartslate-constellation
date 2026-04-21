// REQUIRED DEPENDENCIES:
// - lucide-react (npm install lucide-react)
// - framer-motion (npm install framer-motion)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Button, 
  IconButton, 
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Compass, 
  Zap, 
  Layers, 
  PlusCircle, 
  ChevronRight, 
  Orbit, 
  ShieldCheck, 
  CreditCard,
  Cpu,
  LayoutGrid,
  Settings,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// --- DESIGN SYSTEM CONSTANTS ---
const COLORS = {
  background: '#020C1B',
  primary: '#7C69F5',
  secondary: '#A7DADB',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  glass: 'rgba(124, 105, 245, 0.04)',
  glassBorder: 'rgba(124, 105, 245, 0.15)',
};

const glassStyles = {
  background: COLORS.glass,
  backdropFilter: 'blur(12px)',
  border: `1px solid ${COLORS.glassBorder}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
};

// --- SUB-COMPONENTS ---

const StatusBadge = ({ text }: { text: string }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      px: 1.5,
      py: 0.25,
      borderRadius: '4px',
      background: 'rgba(167, 218, 219, 0.1)',
      border: `1px solid ${COLORS.secondary}33`,
      color: COLORS.secondary,
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    }}
  >
    {text}
  </Box>
);

const BlueprintCard = ({ title, date, active = false }: { title: string; date: string; active?: boolean }) => (
  <motion.div
    whileHover={{ scale: 1.02, translateY: -4 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
    <Box
      sx={{
        ...glassStyles,
        p: 2.5,
        borderRadius: '12px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        minHeight: '130px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&:hover': {
          borderColor: COLORS.primary,
          background: 'rgba(124, 105, 245, 0.08)',
        },
        ...(active && {
          borderColor: COLORS.primary,
          boxShadow: `0 0 20px ${COLORS.primary}22`,
        })
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Cpu size={18} color={COLORS.secondary} />
          <StatusBadge text="V.4-ALPHA" />
        </Box>
        <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
        {date}
      </Typography>
    </Box>
  </motion.div>
);

const HandoverTrigger = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <Box sx={{ position: 'relative', width: 'fit-content' }}>
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 4, repeat: Infinity }}
      style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        right: '-5%',
        bottom: '-10%',
        borderRadius: '100px',
        border: `1px solid ${COLORS.primary}33`,
        pointerEvents: 'none',
      }}
    />
    <Button
      onClick={onClick}
      variant="contained"
      sx={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #5a48d1 100%)`,
        color: 'white',
        px: 4,
        py: 1.5,
        borderRadius: '100px',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.85rem',
        boxShadow: `0 4px 20px ${COLORS.primary}44`,
        overflow: 'hidden',
        '&:hover': {
          background: COLORS.primary,
        },
      }}
    >
      {label}
    </Button>
  </Box>
);

// --- MAIN PAGE COMPONENT ---

type PageState = 'has_blueprints' | 'no_blueprints' | 'no_sub' | 'loading' | 'error';

export default function IntegratedHandoverPage() {
  const [appState, setAppState] = useState<PageState>('loading');
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setAppState('loading');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAppState('no_sub'); // Or redirect to Polaris login
        return;
      }

      // 1. Fetch User Profile for Subscription Status
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Check if user has active subscription
      if (!profile.subscription_tier || profile.subscription_tier === 'free') {
         // In some cases 'free' is still a sub, but let's assume 'no_sub' UI for upsell
         // as per instructions if they don't have polaris subscription
         // setAppState('no_sub'); 
      }

      // 2. Fetch Blueprints
      const { data: bps, error: bpError } = await supabase
        .from('blueprint_generator')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (bpError) throw bpError;

      setBlueprints(bps || []);

      if (bps && bps.length > 0) {
        setAppState('has_blueprints');
      } else {
        setAppState('no_blueprints');
      }

    } catch (err: any) {
      console.error('Handover Error:', err);
      setError(err.message);
      setAppState('error');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: COLORS.primary, mb: 2 }} />
            <Typography sx={{ color: COLORS.textSecondary, fontMono: 'monospace', fontSize: '0.8rem' }}>
              INITIALIZING HANDOVER PROTOCOL...
            </Typography>
          </Box>
        );

      case 'error':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, textAlign: 'center' }}>
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Connection Interrupted</Typography>
            <Typography sx={{ color: COLORS.textSecondary, mb: 4, maxWidth: '400px' }}>{error}</Typography>
            <Button variant="outlined" onClick={fetchData} sx={{ color: COLORS.secondary, borderColor: COLORS.secondary }}>
              Retry Handover
            </Button>
          </Box>
        );

      case 'has_blueprints':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            key="has_blueprints"
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ color: COLORS.textPrimary, fontWeight: 700, mb: 1, fontSize: '1.25rem' }}>
                Architecture Canvas
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                Select a Polaris blueprint to initialize the strategic handover.
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {blueprints.map((bp, idx) => (
                <Grid key={bp.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <BlueprintCard 
                    title={bp.title || bp.blueprint_json?.title || 'Untitled Blueprint'} 
                    date={new Date(bp.created_at).toLocaleDateString()} 
                    active={idx === 0} 
                  />
                </Grid>
              ))}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box
                  onClick={() => window.location.href = 'http://localhost:3000/blueprint/new'}
                  sx={{
                    ...glassStyles,
                    height: '100%',
                    minHeight: '130px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    borderStyle: 'dashed',
                    cursor: 'pointer',
                    color: COLORS.textSecondary,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: COLORS.secondary, color: COLORS.secondary }
                  }}
                >
                  <PlusCircle size={24} style={{ marginBottom: '8px' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Create New in Polaris</Typography>
                </Box>
              </Grid>
            </Grid>
          </motion.div>
        );

      case 'no_sub':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            key="no_sub"
          >
            <Box
              sx={{
                ...glassStyles,
                borderRadius: '24px',
                p: 6,
                position: 'relative',
                overflow: 'hidden',
                background: `radial-gradient(circle at top right, ${COLORS.primary}11, transparent), ${COLORS.glass}`,
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, right: 0, opacity: 0.1, p: 4 }}>
                <Orbit size={200} color={COLORS.secondary} />
              </Box>

              <Grid container spacing={6} alignItems="center">
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ mb: 2 }}>
                    <StatusBadge text="Subscription Required" />
                  </Box>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 800, 
                      color: 'white', 
                      mb: 2, 
                      fontSize: '2.5rem',
                      background: `linear-gradient(to right, #FFF, ${COLORS.secondary})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Unlock Strategic Handover
                  </Typography>
                  <Typography variant="body1" sx={{ color: COLORS.textSecondary, mb: 4, lineHeight: 1.7, maxWidth: '500px' }}>
                    Access Polaris architecture blueprints and seamless data integration with a premium subscription.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => window.location.href = 'http://localhost:3000/pricing'}
                      endIcon={<ArrowUpRight size={18} />}
                      sx={{
                        bgcolor: COLORS.secondary,
                        color: COLORS.background,
                        px: 4,
                        py: 1.5,
                        fontWeight: 700,
                        borderRadius: '8px',
                        '&:hover': { bgcolor: '#8dbfc1' }
                      }}
                    >
                      View Pricing
                    </Button>
                    <Button
                      onClick={() => setAppState('no_blueprints')}
                      sx={{ color: 'white', textTransform: 'none' }}
                    >
                      Build from Scratch
                    </Button>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {['Strategic Alignment', 'Automated Storyboarding', 'Asset Enrichment'].map((feat) => (
                        <Box key={feat} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)' }}>
                          <ShieldCheck size={20} color={COLORS.primary} />
                          <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>{feat}</Typography>
                        </Box>
                      ))}
                   </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        );

      case 'no_blueprints':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            key="no_blueprints"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 0' }}
          >
            <Box sx={{ mb: 3, p: 3, borderRadius: '50%', background: `radial-gradient(circle, ${COLORS.primary}22 0%, transparent 70%)` }}>
              <Layers size={48} color={COLORS.primary} />
            </Box>
            <Typography variant="h5" sx={{ color: COLORS.textPrimary, fontWeight: 700, mb: 2 }}>
              Your Constellation is Empty
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.textSecondary, mb: 4, maxWidth: '400px' }}>
              Initialize your first Polaris Blueprint to begin the architectural handover process.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                startIcon={<PlusCircle size={20} />}
                onClick={() => window.location.href = 'http://localhost:3000/blueprint/new'}
                sx={{
                  color: COLORS.secondary,
                  border: `1px solid ${COLORS.secondary}44`,
                  px: 3,
                  py: 1,
                  borderRadius: '8px',
                  '&:hover': { background: `${COLORS.secondary}11` }
                }}
              >
                Create Blueprint
              </Button>
              <Button
                onClick={() => setAppState('has_blueprints')} // For testing/demo
                sx={{ color: 'white', textTransform: 'none' }}
              >
                Build from Scratch
              </Button>
            </Box>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: COLORS.background, 
      display: 'flex',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* MAIN CONTENT AREA */}
      <Box sx={{ flexGrow: 1, p: { xs: 4, md: 8 } }}>
        <Container maxWidth="lg">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </Container>
      </Box>

      {/* ATMOSPHERIC BACKGROUND DECOR */}
      <Box
        sx={{
          position: 'fixed',
          top: '10%',
          right: '5%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${COLORS.primary}11 0%, transparent 70%)`,
          filter: 'blur(80px)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}
