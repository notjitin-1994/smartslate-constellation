// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Compass, 
  PlusCircle, 
  Sparkles, 
  Orbit, 
  Layers, 
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// --- Design System Constants ---
const COLORS = {
  background: '#020C1B',
  surface: '#0d1b2a',
  primaryCTA: '#7C69F5', // Vibrant Indigo
  accent: '#A7DADB',    // Cyan/Teal
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.06)',
};

const glassStyles = {
  background: 'rgba(13, 27, 42, 0.55)',
  backdropFilter: 'blur(18px)',
  border: `1px solid ${COLORS.border}`,
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
};

// --- Animations ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

// --- Sub-Components ---

const BackgroundConstellation = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#A7DADB]/5 blur-[120px] rounded-full" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#A7DADB]/5 blur-[120px] rounded-full" />
    <svg className="absolute inset-0 w-full h-full opacity-20">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={COLORS.accent} strokeWidth="0.5" strokeOpacity="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.07]"
    >
      <Orbit className="w-full h-full text-[#A7DADB]" strokeWidth={0.5} />
    </motion.div>
  </div>
);

const LoadingOverlay = () => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020C1B]"
  >
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="w-24 h-24 border-t-2 border-r-2 border-[#A7DADB] rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-2 h-2 bg-[#A7DADB] rounded-full shadow-[0_0_15px_#A7DADB]" />
      </motion.div>
    </div>
    <motion.p
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="mt-8 text-[10px] tracking-[0.4em] uppercase font-bold text-[#A7DADB]"
    >
      SYNCHRONIZING CONSTELLATION...
    </motion.p>
  </motion.div>
);

const RecommendationBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute top-0 right-6 -translate-y-1/2 px-4 py-1 rounded-full bg-[#7C69F5] shadow-[0_0_15px_rgba(124,105,245,0.6)] z-20"
  >
    <div className="flex items-center gap-1.5 text-white">
      <Sparkles size={12} fill="white" />
      <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Recommended Path</span>
    </div>
  </motion.div>
);

const ActionCard = ({ 
  title, 
  description, 
  icon, 
  isPrimaryCTA = false, 
  recommended = false, 
  external = false, 
  onClick 
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isPrimaryCTA?: boolean;
  recommended?: boolean;
  external?: boolean;
  onClick?: () => void;
}) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    onClick={onClick}
    className="group relative cursor-pointer h-full"
  >
    {recommended && <RecommendationBanner />}

    <div 
      style={glassStyles}
      className={`relative h-full p-8 rounded-2xl flex flex-col transition-all duration-500 overflow-hidden ${
        isPrimaryCTA ? 'ring-1 ring-[#7C69F5]/30' : 'hover:border-[#A7DADB]/30'
      }`}
    >
      <div 
        className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: isPrimaryCTA ? COLORS.primaryCTA : COLORS.accent }}
      />
      
      <div className="flex justify-between items-start mb-12">
        <div 
          className="p-3 rounded-xl transition-colors duration-500"
          style={{ 
            background: isPrimaryCTA ? 'rgba(124, 105, 245, 0.1)' : 'rgba(167, 218, 219, 0.05)',
            border: `1px solid ${isPrimaryCTA ? 'rgba(124, 105, 245, 0.2)' : 'rgba(167, 218, 219, 0.1)'}`
          }}
        >
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ 
            size?: number, 
            color?: string,
            strokeWidth?: number 
          }>, { 
            size: 24, 
            color: isPrimaryCTA ? COLORS.primaryCTA : COLORS.accent,
            strokeWidth: 1.5 
          }) : icon}
        </div>
        {external && <ArrowUpRight size={18} className="text-[#94A3B8] group-hover:text-[#A7DADB] transition-colors" />}
      </div>

      <div className="mt-auto">
        <h3 
          className="text-lg font-bold mb-2 tracking-tight font-heading text-[#E2E8F0]"
        >
          {title}
        </h3>
        <p 
          className="text-xs leading-relaxed text-[#94A3B8] opacity-70"
        >
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);

// --- MAIN PAGE COMPONENT ---

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasBlueprints, setHasBlueprints] = useState(false);
  const [isPolarisUser, setIsPolarisUser] = useState(false);
  const [firstName, setFirstName] = useState('');

  const checkUserStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, first_name')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.first_name) {
        setFirstName(profile.first_name);
      }

      const hasSub = profile?.subscription_tier && profile.subscription_tier !== 'free';
      setIsPolarisUser(!!hasSub);

      const { count } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      setHasBlueprints(!!(count && count > 0));

    } catch (error: unknown) {
      console.error('Dashboard logic error:', error);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }, [router]);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  const displayFirstName = firstName || ((): string => {
    const rawName =
      (user?.user_metadata?.first_name as string) ||
      (user?.user_metadata?.name as string) ||
      (user?.user_metadata?.full_name as string) ||
      (user?.email as string) ||
      'User';
    const name = rawName.toString().trim().split(' ')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  })();

  const showHandoverBranch = isPolarisUser && hasBlueprints;

  return (
    <div className="relative min-h-screen bg-[#020C1B] text-[#E2E8F0] selection:bg-[#7C69F5]/30 p-6 md:p-12 lg:px-20 lg:py-16 overflow-x-hidden">
      <BackgroundConstellation />
      
      <AnimatePresence>
        {loading && <LoadingOverlay key="loader" />}
      </AnimatePresence>

      {!loading && (
        <main className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-10"
          >
            {/* Hero Section */}
            <section className="max-w-4xl text-left">
              <motion.h1 
                variants={itemVariants}
                className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-white mb-4"
              >
                Welcome back, <span className="text-[#A7DADB]">{displayFirstName}</span>.
              </motion.h1>

              <motion.p 
                variants={itemVariants}
                className="text-sm md:text-lg text-white/60 leading-relaxed font-light max-w-2xl border-l border-[#A7DADB]/20 pl-6"
              >
                Your architectural protocol — <span className="text-[#A7DADB] font-medium">ingest</span> organizational data, <span className="text-[#A7DADB] font-medium">orchestrate</span> instructional storyboards, and <span className="text-[#A7DADB] font-medium">bridge</span> the gap between strategic intent and content creation.
              </motion.p>
            </section>

            {/* Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {showHandoverBranch ? (
                <>
                  <div className="md:col-span-7">
                    <ActionCard 
                      isPrimaryCTA
                      recommended
                      title="Create from Polaris Blueprints"
                      description="Leverage your existing organizational intelligence to generate high-fidelity architectural storyboards with AI-driven precision."
                      icon={<Sparkles />}
                      onClick={() => router.push('/handover')}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <ActionCard 
                      title="Start from Scratch"
                      description="Initiate a raw protocol without pre-existing blueprints. Full creative autonomy for unique strategic content."
                      icon={<Layers />}
                      onClick={() => router.push('/constellation')}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-7">
                    <ActionCard 
                      isPrimaryCTA
                      external
                      title="Subscribe to Polaris"
                      description="Unlock the full architectural potential. Connect your organizational data and enable blueprint-based generation."
                      icon={<Zap />}
                      onClick={() => window.open('https://polaris.smartslate.io/pricing', '_blank')}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <ActionCard 
                      title="Create from Scratch"
                      description="Enter the manual creation interface to build your instructional storyboard from the ground up."
                      icon={<PlusCircle />}
                      onClick={() => router.push('/constellation')}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Metadata Footer */}
            <motion.footer 
              variants={itemVariants}
              className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/5"
            >
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-[#A7DADB]/20 bg-[#0d1b2a] flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-[#A7DADB]/5 flex items-center justify-center text-[9px] text-[#A7DADB]/60 font-mono">
                        0{i}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#94A3B8]/80 tracking-widest uppercase font-medium">
                  Active Nodes: 03
                </p>
              </div>
              
              <div className="flex items-center gap-8">
                <button className="text-[10px] text-[#94A3B8]/60 hover:text-[#A7DADB] transition-colors tracking-widest uppercase font-bold flex items-center gap-2">
                  <Compass size={12} /> Documentation
                </button>
                <div className="h-3 w-[1px] bg-white/5" />
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  <span className="text-[9px] font-mono text-[#94A3B8]/60">CONSTELLATION.v4</span>
                </div>
              </div>
            </motion.footer>
          </motion.div>
        </main>
      )}

      {/* Cinematic Overlays */}
      <div className="fixed top-0 left-0 w-full h-24 bg-gradient-to-b from-[#020C1B] to-transparent z-20 pointer-events-none opacity-40" />
      <div className="fixed bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#020C1B] to-transparent z-20 pointer-events-none opacity-40" />
    </div>
  );
}
