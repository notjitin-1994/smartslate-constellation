// REQUIRED DEPENDENCIES:
// - lucide-react (npm install lucide-react)
// - framer-motion (npm install framer-motion)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Layers, 
  Zap, 
  ShieldCheck,
  Compass,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// --- DESIGN SYSTEM CONSTANTS ---
const COLORS = {
  background: '#020C1B',
  primary: '#7C69F5',
  secondary: '#A7DADB',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  glassBg: 'rgba(124, 105, 245, 0.04)',
  glassBorder: 'rgba(124, 105, 245, 0.15)',
};

const glassStyles = {
  background: COLORS.glassBg,
  backdropFilter: 'blur(12px)',
  border: `1px solid ${COLORS.glassBorder}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
};

// --- ANIMATIONS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }
};

// --- SUB-COMPONENTS ---

const HandoverTrigger = ({ onClick, children, className = "" }: any) => (
  <button
    onClick={onClick}
    className={`group relative px-6 py-2.5 rounded-full overflow-hidden transition-all duration-300 ${className}`}
    style={{ background: COLORS.primary }}
  >
    <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-scan" />
    <div className="absolute inset-0 border border-white/20 rounded-full scale-100 group-hover:scale-110 transition-transform duration-500" />
    <span className="relative flex items-center gap-2 text-white font-medium text-sm">
      {children}
    </span>
  </button>
);

const BlueprintCard = ({ blueprint, onSelect }: any) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4, borderColor: 'rgba(124, 105, 245, 0.4)' }}
    className="group relative flex flex-col p-6 rounded-xl h-full cursor-pointer transition-colors"
    style={glassStyles}
    onClick={() => onSelect(blueprint.id)}
  >
    <div className="absolute inset-0 opacity-10 pointer-events-none" 
      style={{ backgroundImage: `radial-gradient(${COLORS.primary} 1px, transparent 1px)`, backgroundSize: '16px 16px' }} 
    />

    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <Layers size={18} className="text-[#7C69F5]" />
      </div>
      <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded bg-white/5 border border-white/10 text-[#A7DADB]">
        V.4-ALPHA
      </span>
    </div>

    <div className="flex-grow relative z-10">
      <h3 className="text-[15px] font-semibold text-[#E2E8F0] mb-1 line-clamp-1">{blueprint.title || 'Untitled Blueprint'}</h3>
      <p className="text-[12px] text-[#94A3B8] line-clamp-2 leading-relaxed">
        {blueprint.blueprint_json?.objective || 'Strategic architectural template for solara learning nodes.'}
      </p>
    </div>

    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
      <span className="text-[10px] text-[#94A3B8] font-mono uppercase tracking-tighter">
        IDENT: {new Date(blueprint.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
      </span>
      <div className="flex items-center gap-1 text-[#7C69F5] group-hover:gap-2 transition-all">
        <span className="text-[10px] font-bold uppercase tracking-widest">Select</span>
        <ChevronRight size={14} />
      </div>
    </div>

    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
  </motion.div>
);

// --- MAIN PAGE COMPONENT ---

type PageState = 'loading' | 'error' | 'marketing' | 'guidance' | 'selection';

export default function HandoverGateway() {
  const [appState, setAppState] = useState<PageState>('loading');
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 6;
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setAppState('loading');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAppState('marketing');
        return;
      }

      // Fetch User Profile for Sub Check
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.subscription_tier || profile.subscription_tier === 'free') {
        // Marketing mode for free users if required
      }

      // Fetch Blueprints
      const { data: bps, error: bpError } = await supabase
        .from('blueprint_generator')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (bpError) throw bpError;

      setBlueprints(bps || []);
      setAppState(bps && bps.length > 0 ? 'selection' : 'guidance');

    } catch (err: any) {
      console.error('Handover Error:', err);
      setError(err.message);
      setAppState('error');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(blueprints.length / itemsPerPage);
  const paginatedBlueprints = useMemo(() => {
    const start = page * itemsPerPage;
    return blueprints.slice(start, start + itemsPerPage);
  }, [blueprints, page]);

  const onSelectBlueprint = (id: string) => {
    router.push(`/constellation?blueprintId=${id}`);
  };

  return (
    <div className="min-h-screen w-full py-16 px-6 font-sans selection:bg-[#7C69F5]/30" style={{ backgroundColor: COLORS.background }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] bg-[#7C69F5]/10" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] bg-[#A7DADB]/5" />
      </div>

      <Container maxWidth="lg" className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-[1px] bg-[#7C69F5]" />
              <span className="text-[#7C69F5] text-[10px] font-bold tracking-[0.2em] uppercase">Architecture Gateway</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#E2E8F0] tracking-tight mb-4 font-heading">
              Blueprint <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C69F5] to-[#A7DADB]">Selection</span>
            </h1>
            <p className="text-[#94A3B8] text-sm leading-relaxed max-w-md">
              Select a Polaris Strategy to transform into a high-fidelity Constellation Architecture. Precision mapping for cognitive trajectory.
            </p>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <HandoverTrigger onClick={() => window.location.href = 'https://polaris.smartslate.io/dashboard'}>
              <Plus size={16} />
              Create New Blueprint
            </HandoverTrigger>
          </motion.div>
        </div>

        {/* Content States */}
        <AnimatePresence mode="wait">
          {appState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <CircularProgress sx={{ color: COLORS.primary, mb: 3 }} />
              <Typography sx={{ color: COLORS.textSecondary, fontMono: 'monospace', fontSize: '10px', tracking: '0.2em' }}>
                INITIALIZING HANDOVER PROTOCOL...
              </Typography>
            </motion.div>
          )}

          {appState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <AlertCircle size={48} className="text-red-500 mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">Connection Interrupted</h2>
              <p className="text-[#94A3B8] text-sm max-w-xs mb-8">{error}</p>
              <Button 
                onClick={fetchData} 
                variant="outlined" 
                sx={{ color: COLORS.secondary, borderColor: COLORS.secondary, borderRadius: 'full' }}
              >
                Retry Handover
              </Button>
            </motion.div>
          )}

          {appState === 'marketing' && (
            <motion.div
              key="marketing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full p-8 md:p-12 rounded-2xl overflow-hidden relative"
              style={glassStyles}
            >
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
                <svg viewBox="0 0 400 400" className="w-full h-full text-[#7C69F5]">
                  <path d="M0,200 Q100,50 200,200 T400,200" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>

              <div className="relative z-10 max-w-lg">
                <div className="flex items-center gap-2 mb-6 text-[#A7DADB]">
                  <ShieldCheck size={20} />
                  <span className="text-xs font-bold tracking-widest uppercase">Premium Capability</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-6 leading-tight">
                  Unlock the full power of <br />
                  <span className="text-[#7C69F5]">Strategic Architecture.</span>
                </h2>
                <p className="text-[#94A3B8] text-sm mb-8">
                  Connect your strategic Polaris intent directly to the production-grade Constellation storyboard engine.
                </p>
                <Button 
                  variant="outlined" 
                  onClick={() => window.location.href = 'https://polaris.smartslate.io/pricing'}
                  sx={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: '100px', px: 4, fontWeight: 700 }}
                >
                  UPGRADE ACCESS
                </Button>
              </div>
            </motion.div>
          )}

          {appState === 'guidance' && (
            <motion.div
              key="guidance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
              style={glassStyles}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[#7C69F5]/10 border border-[#7C69F5]/20">
                <Compass className="text-[#7C69F5] animate-pulse" size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#E2E8F0] mb-2 font-heading">Initialize Your First Strategy</h2>
              <p className="text-[#94A3B8] text-sm max-w-xs mb-8">
                Your architectural canvas is currently empty. Define a Polaris Blueprint to begin the handover process.
              </p>
              <HandoverTrigger onClick={() => window.location.href = 'https://polaris.smartslate.io/dashboard'}>
                <Sparkles size={16} />
                Generate My First Blueprint
              </HandoverTrigger>
            </motion.div>
          )}

          {appState === 'selection' && (
            <motion.div
              key="selection"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {paginatedBlueprints.map((blueprint) => (
                <BlueprintCard 
                  key={blueprint.id} 
                  blueprint={blueprint} 
                  onSelect={onSelectBlueprint} 
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Logic */}
        {appState === 'selection' && totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 flex justify-center items-center gap-4"
          >
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-full border border-white/10 text-[#94A3B8] disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    page === i ? 'bg-[#7C69F5] w-6' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            <button 
              disabled={page === totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-full border border-white/10 text-[#94A3B8] disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {/* Footer Meta */}
        <div className="mt-16 flex items-center justify-between border-t border-white/5 pt-8">
          <div className="flex items-center gap-4 text-[10px] text-[#94A3B8] tracking-widest uppercase font-medium">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              Sync: Secure
            </span>
            <span>Protocols: AES-256</span>
          </div>
          <p className="text-[10px] text-[#94A3B8]/60 font-mono">
            CONST_VER_8.1.2_SS
          </p>
        </div>
      </Container>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: skewX(-12deg) translateX(-100%); }
          100% { transform: skewX(-12deg) translateX(250%); }
        }
        .animate-scan {
          animation: scan 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>
    </div>
  );
}
