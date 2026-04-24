'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Brand } from './Brand';
import { UserAvatar } from './UserAvatar';
import {
  IconSidebarToggle,
  Icons,
} from './icons';
import { useSidebar } from '@/lib/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  ChevronRight,
  Workflow, 
  Video, 
  MousePointer2, 
  FileText, 
  MessageSquare, 
  Monitor,
  ArrowRight,
  Brain
} from 'lucide-react';

const quickAccessItems = [
  { title: 'Dashboard', icon: Icons.Dashboard, path: '/dashboard' },
  { title: 'Architecture', icon: Icons.Blueprints, path: '/constellation' },
  { title: 'Asset Ingest', icon: Icons.Assets, path: '/assets' },
];

const solaraSuiteLinks = [
  { name: 'Polaris', path: 'https://polaris.smartslate.io', badge: 'Live', badgeType: 'active' as const, isExternal: true },
  { name: 'Nova', path: '#', badge: 'Coming Soon', badgeType: 'soon' as const },
  { name: 'Orbit', path: '#', badge: 'Coming Soon', badgeType: 'soon' as const },
  { name: 'Spectrum', path: '#', badge: 'Coming Soon', badgeType: 'soon' as const },
];

// --- HELPER FOR CONSTELLATION ICONS ---
const getModalityIcon = (type: string) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('video')) return <Video size={16} />;
  if (t.includes('interactive') || t.includes('scorm') || t.includes('simulation')) return <MousePointer2 size={16} />;
  if (t.includes('case') || t.includes('text') || t.includes('checklist') || t.includes('pdf')) return <FileText size={16} />;
  if (t.includes('audio') || t.includes('podcast')) return <MessageSquare size={16} />;
  return <Monitor size={16} />;
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { collapsed, setCollapsed, isConstellationMode, setIsConstellationMode } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);
  const [dbName, setDbName] = useState<string | null>(null);

  // For Constellation Mode Data (Sync from storage/window)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modules, setModules] = useState<any[]>([]);
  const [activeNodeIdx, setActiveNodeIdx] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();
        
        if (data?.first_name) {
          setDbName(`${data.first_name} ${data.last_name || ''}`.trim());
        }
      }
    };
    fetchProfile();

    // Listener for Constellation Data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleConstellationData = (e: any) => {
      if (e.detail?.modules) setModules(e.detail.modules);
      if (typeof e.detail?.activeIdx === 'number') setActiveNodeIdx(e.detail.activeIdx);
    };
    window.addEventListener('constellation-sidebar-sync', handleConstellationData);
    return () => window.removeEventListener('constellation-sidebar-sync', handleConstellationData);
  }, [user?.id]);

  if (!isMounted) return null;

  const handleNodeClick = (idx: number) => {
    window.dispatchEvent(new CustomEvent('constellation-node-select', { detail: { idx } }));
  };

  const getCapitalizedFullName = (): string => {
    const rawName = dbName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const name = rawName.trim();
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const variants = {
    initial: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 })
  };

  return (
    <aside
      className={`hidden h-screen flex-col md:flex fixed left-0 top-0 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) glass-sidebar ${
        collapsed ? 'w-20' : 'w-[320px]'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center h-20 ${collapsed ? 'justify-center' : 'justify-between px-6'} relative z-20`}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div 
              key={isConstellationMode ? 'constellation-head' : 'global-head'}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              {isConstellationMode ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Workflow size={16} className="text-indigo-400" />
                  </div>
                  <span className="text-sm font-bold tracking-tight text-white uppercase tracking-widest">Neural Trace</span>
                </>
              ) : <Brand />}
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isConstellationMode && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-text-secondary hover:text-white p-2 rounded-lg transition-all"
          >
            <IconSidebarToggle className={`h-5 w-5 transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        <AnimatePresence mode="wait" custom={isConstellationMode ? 1 : -1}>
          {!isConstellationMode ? (
            <motion.nav 
              key="global-nav"
              custom={-1}
              variants={variants}
              initial="initial" animate="animate" exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`px-4 py-4 space-y-8 ${collapsed ? 'flex flex-col items-center' : ''}`}
            >
              {/* Quick Access */}
              <div className="space-y-3">
                {!collapsed && <h2 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Platform</h2>}
                <div className="space-y-1">
                  {quickAccessItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <button
                        key={item.title}
                        onClick={() => router.push(item.path)}
                        title={collapsed ? item.title : ''}
                        className={`group flex items-center gap-4 w-full rounded-xl transition-all duration-300 ${
                          collapsed ? 'justify-center h-12 w-12' : 'px-4 py-3'
                        } ${
                          isActive ? 'bg-indigo-500/10 text-indigo-400 font-bold' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                        }`}
                      >
                        <item.icon size={collapsed ? 22 : 20} className="shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Neural Portal Trigger (Visible only on Architecture route) */}
              {!collapsed && pathname === '/constellation' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="px-3"
                >
                   <button 
                     onClick={() => setIsConstellationMode(true)}
                     className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-transparent border border-indigo-500/20 hover:border-indigo-500/40 transition-all group relative overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                     <Brain size={18} className="text-indigo-400 group-hover:scale-110 transition-transform relative z-10" />
                     <div className="flex flex-col text-left relative z-10">
                        <span className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest">Active Canvas</span>
                        <span className="text-xs font-bold text-white uppercase tracking-tighter">Return to Neural Trace</span>
                     </div>
                     <ArrowRight size={14} className="ml-auto text-indigo-400 group-hover:translate-x-1 transition-transform relative z-10" />
                   </button>
                </motion.div>
              )}

              {/* Solara Suite */}
              <div className="space-y-3">
                {!collapsed && <h2 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Solara Suite</h2>}
                <div className="space-y-1">
                  {solaraSuiteLinks.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => item.isExternal ? window.open(item.path, '_blank') : (item.path !== '#' && router.push(item.path))}
                      disabled={item.badgeType === 'soon'}
                      className={`group flex items-center justify-between w-full rounded-xl transition-all duration-300 ${
                        collapsed ? 'hidden' : 'px-4 py-3 text-slate-500 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border ${
                        item.badgeType === 'active' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 bg-slate-900 text-slate-600'
                      }`}>{item.badge}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.nav>
          ) : (
            <motion.nav 
              key="constellation-nav"
              custom={1}
              variants={variants}
              initial="initial" animate="animate" exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="px-4 py-4 space-y-2"
            >
              {modules.map((mod, i) => {
                const isActive = activeNodeIdx === i;
                return (
                  <button 
                    key={mod.id} 
                    onClick={() => handleNodeClick(i)}
                    className={`w-full group relative flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-500
                      ${isActive ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}
                    `}
                  >
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-500
                      ${isActive ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-900/50 border-white/5 text-slate-500 group-hover:border-white/10'}
                    `}>
                      {getModalityIcon(mod.targetModality)}
                    </div>
                    {!collapsed && (
                      <div className="flex flex-col text-left overflow-hidden">
                        <span className={`text-[10px] font-mono font-bold tracking-widest ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>{mod.id}</span>
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{mod.title}</span>
                      </div>
                    )}
                    {isActive && <motion.div layoutId="nodeActive" className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-full" />}
                  </button>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-white/5 bg-slate-950/20 backdrop-blur-md">
        {!collapsed ? (
          <div className="space-y-4">
            <button
              onClick={() => router.push('/profile')}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group"
            >
              <div className="relative">
                <UserAvatar avatarUrl={user?.user_metadata?.avatar_url} sizeClass="w-10 h-10" />
                <div className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-[#0F172A]" />
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{getCapitalizedFullName()}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </button>
            
            <div className="flex items-center gap-2">
               <button onClick={signOut} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                 <Icons.Logout size={14} /> Log Out
               </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
             <UserAvatar avatarUrl={user?.user_metadata?.avatar_url} sizeClass="w-9 h-9" />
             <button onClick={() => setCollapsed(false)} className="text-slate-500 hover:text-white transition-colors">
               <ChevronRight size={20} />
             </button>
          </div>
        )}
      </div>
    </aside>
  );
}
