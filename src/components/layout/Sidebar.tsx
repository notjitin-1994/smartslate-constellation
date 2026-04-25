/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Brain,
  LayoutDashboard,
  ChevronLeft
} from 'lucide-react';

const quickAccessItems = [
  { title: 'Dashboard', icon: Icons.Dashboard, path: '/dashboard' },
  { title: 'Architecture', icon: Icons.Blueprints, path: '/constellation' },
  { title: 'Knowledge Vault', icon: Icons.Assets, path: '/vault' },
];

const solaraSuiteLinks = [
  { name: 'Polaris', path: 'https://polaris.smartslate.io', badge: 'Live', badgeType: 'active' as const, isExternal: true },
  { name: 'Nova', path: '#', badge: 'Coming Soon', badgeType: 'soon' as const },
  { name: 'Orbit', path: '#', badge: 'Coming Soon', badgeType: 'soon' as const },
  { name: 'Spectrum', path: '#', badge: 'Coming Soon', badgeType: 'soon' as const },
];

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
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [activeNodeIdx, setActiveNodeIdx] = useState<number>(0);

  // --- SECTION EXPANSION STATE ---
  const [platformExpanded, setPlatformExpanded] = useState(true);
  const [solaraSuiteExpanded, setSolaraSuiteExpanded] = useState(false);

  useEffect(() => {
    if (pathname === '/constellation') {
      const savedMode = localStorage.getItem('sidebar-mode');
      if (savedMode === null) {
        setIsConstellationMode(true);
      }
    }
  }, [pathname, setIsConstellationMode]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    setIsMounted(true);
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          if (profile.first_name) setDbName(`${profile.first_name} ${profile.last_name || ''}`.trim());
          if (profile.avatar_url) {
            if (profile.avatar_url.startsWith('http')) {
              setDbAvatarUrl(profile.avatar_url);
            } else {
              const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
              setDbAvatarUrl(data?.publicUrl || null);
            }
          }
        }

        if (!dbAvatarUrl) {
          const meta = user.user_metadata || {};
          const metaUrl = meta.avatar_url || meta.picture || meta.avatarURL;
          if (metaUrl) setDbAvatarUrl(metaUrl);
          else if (meta.avatar_path) {
             const { data } = supabase.storage.from('public-assets').getPublicUrl(meta.avatar_path);
             setDbAvatarUrl(data?.publicUrl || null);
          }
        }
      } catch (err) {
        console.error('[Sidebar] Profile Sync Error:', err);
      }
    };
    fetchProfile();

    const handleConstellationData = (e: any) => {
      if (e.detail?.modules) setModules(e.detail.modules);
      if (typeof e.detail?.activeIdx === 'number') {
        setActiveNodeIdx(e.detail.activeIdx);
        const pageOfNode = Math.floor(e.detail.activeIdx / itemsPerPage) + 1;
        setCurrentPage(pageOfNode);
      }
    };
    window.addEventListener('constellation-sidebar-sync', handleConstellationData);
    return () => window.removeEventListener('constellation-sidebar-sync', handleConstellationData);
  }, [user?.id, user?.user_metadata, dbAvatarUrl]);

  if (!isMounted) return null;

  const handleNodeClick = (idx: number) => {
    window.dispatchEvent(new CustomEvent('constellation-node-select', { detail: { idx } }));
  };

  const formatText = (txt: string) => txt.replace(/_/g, ' ');

  const variants = {
    initial: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -100 : 100, opacity: 0 })
  };

  const totalPages = Math.ceil(modules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentModulesSlice = modules.slice(startIndex, startIndex + itemsPerPage);

  const getPaginationNumbers = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === 1) return [1, 2, 3];
    if (currentPage === totalPages) return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  };

  return (
    <aside
      className={`hidden h-screen flex-col md:flex relative z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) glass-sidebar shrink-0 ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      <div className={`flex items-center h-20 ${collapsed ? 'justify-center' : 'justify-between px-6'} relative z-20`}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key={isConstellationMode ? 'constellation-head' : 'global-head'}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              {isConstellationMode ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-[#A7DADB]/10 flex items-center justify-center border border-[#A7DADB]/20">
                    <Workflow size={16} className="text-[#A7DADB]" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Neural Trace</span>
                </>
              ) : <Brand />}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-slate-500 hover:text-[#A7DADB] p-2 rounded-lg transition-all ${collapsed ? 'w-8 h-8 flex items-center justify-center' : ''}`}
        >
          <IconSidebarToggle className={`h-5 w-5 transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        <AnimatePresence mode="wait" custom={isConstellationMode ? 1 : -1}>
          {!isConstellationMode ? (
            <motion.nav
              key="global-nav"
              custom={-1}
              variants={variants}
              initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`px-4 py-4 space-y-6 ${collapsed ? 'flex flex-col items-center' : ''}`}
            >
              {/* PLATFORM SECTION (Expanded by default) */}
              <div className="space-y-3">
                {!collapsed && (
                  <button 
                    onClick={() => setPlatformExpanded(!platformExpanded)}
                    className="w-full px-3 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group/head"
                  >
                    Platform
                    <ChevronRight size={12} className={`transition-transform duration-300 ${platformExpanded ? 'rotate-90' : ''} group-hover/head:text-[#A7DADB]`} />
                  </button>
                )}
                <AnimatePresence>
                  {(platformExpanded || collapsed) && (
                    <motion.div 
                      initial={collapsed ? { opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={collapsed ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`space-y-1 ${collapsed ? 'flex flex-col items-center' : 'overflow-hidden'}`}
                    >
                      {quickAccessItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                          <button
                            key={item.title}
                            onClick={() => router.push(item.path)}
                            title={collapsed ? item.title : ''}
                            className={`group flex items-center transition-all duration-300 ${
                              collapsed ? 'justify-center h-10 w-10 rounded-xl' : 'px-4 py-3 gap-4 w-full rounded-xl'
                            } ${
                              isActive ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-white/[0.03] hover:text-[#A7DADB]'
                            }`}
                          >
                            <item.icon size={collapsed ? 20 : 18} className="shrink-0" />
                            {!collapsed && <span className="text-[13px] font-bold tracking-tight">{item.title}</span>}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SOLARA SUITE SECTION (Collapsed by default) */}
              <div className="space-y-3">
                {!collapsed && (
                  <button 
                    onClick={() => setSolaraSuiteExpanded(!solaraSuiteExpanded)}
                    className="w-full px-3 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group/head"
                  >
                    Solara Suite
                    <ChevronRight size={12} className={`transition-transform duration-300 ${solaraSuiteExpanded ? 'rotate-90' : ''} group-hover/head:text-[#A7DADB]`} />
                  </button>
                )}
                <AnimatePresence>
                  {(solaraSuiteExpanded || collapsed) && (
                    <motion.div 
                      initial={collapsed ? { opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={collapsed ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`space-y-1 ${collapsed ? 'flex flex-col items-center' : 'overflow-hidden'}`}
                    >
                      {solaraSuiteLinks.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => item.isExternal ? window.open(item.path, '_blank') : (item.path !== '#' && router.push(item.path))}
                          disabled={item.badgeType === 'soon'}
                          className={`group flex items-center transition-all duration-300 ${
                            collapsed ? 'justify-center h-10 w-10 rounded-xl' : 'px-4 py-3 gap-4 w-full rounded-xl justify-between'
                          } ${collapsed ? 'text-slate-600' : 'text-slate-500 hover:bg-white/[0.03] hover:text-[#A7DADB]'}`}
                        >
                          {collapsed ? (
                            <Monitor size={18} />
                          ) : (
                            <>
                              <span className="text-[13px] font-bold">{item.name}</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full border ${
                                item.badgeType === 'active' ? 'border-[#A7DADB]/20 bg-[#A7DADB]/5 text-[#A7DADB]' : 'border-slate-800 bg-slate-900 text-slate-600'
                              }`}>{item.badge}</span>
                            </>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.nav>
          ) : (
            <motion.nav
              key="constellation-nav"
              custom={1}
              variants={variants}
              initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`px-4 py-4 space-y-2 flex-1 flex flex-col ${collapsed ? 'items-center' : ''}`}
            >
              <div className="flex-1 space-y-2">
                {currentModulesSlice.map((mod, relativeIdx) => {
                  const absoluteIdx = startIndex + relativeIdx;
                  const isActive = activeNodeIdx === absoluteIdx;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleNodeClick(absoluteIdx)}
                      className={`group relative flex items-center transition-all duration-300
                        ${collapsed ? 'justify-center h-11 w-11 rounded-xl' : 'p-3.5 gap-4 w-full rounded-2xl'}
                        ${isActive ? 'bg-[#4F46E5]/10 border border-[#4F46E5]/20' : 'hover:bg-white/[0.03] border border-transparent'}
                      `}
                    >
                      <div className={`shrink-0 flex items-center justify-center border transition-all duration-500
                        ${collapsed ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl'}
                        ${isActive ? 'bg-[#4F46E5]/20 border-[#4F46E5]/40 text-[#4F46E5]' : 'bg-slate-900/50 border-[#A7DADB]/10 text-slate-500 group-hover:border-[#A7DADB]/30'}
                      `}>
                        {getModalityIcon(mod.targetModality)}
                      </div>
                      {!collapsed && (
                        <div className="flex flex-col text-left overflow-hidden">
                          <span className={`text-[10px] font-mono font-bold tracking-widest ${isActive ? 'text-[#4F46E5]' : 'text-slate-600'}`}>{formatText(mod.id)}</span>
                          <span className={`text-[11px] font-bold truncate ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{formatText(mod.title)}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className={`mt-auto pt-6 border-t border-white/[0.03] flex items-center gap-2 ${collapsed ? 'flex-col' : 'justify-center'}`}>
                   {!collapsed && (
                     <button 
                       disabled={currentPage === 1}
                       onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                       className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 disabled:opacity-20 transition-all"
                     >
                       <ChevronLeft size={16} />
                     </button>
                   )}
                   
                   <div className={`flex items-center gap-1.5 ${collapsed ? 'flex-col' : ''}`}>
                      {getPaginationNumbers().map(num => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                            currentPage === num 
                              ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/20' 
                              : 'text-slate-600 hover:text-[#A7DADB] hover:bg-white/[0.03]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                   </div>

                   {!collapsed && (
                     <button 
                       disabled={currentPage === totalPages}
                       onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                       className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 disabled:opacity-20 transition-all"
                     >
                       <ChevronRight size={16} />
                     </button>
                   )}
                </div>
              )}
            </motion.nav>
          )}
        </AnimatePresence>

        {!collapsed && isConstellationMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-6 mt-4">
            <button
              onClick={() => setIsConstellationMode(false)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-[#A7DADB]/10 hover:border-[#A7DADB]/30 transition-all group relative"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-[#A7DADB]/10 flex items-center justify-center">
                <LayoutDashboard size={16} className="text-slate-400 group-hover:text-[#A7DADB]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Platform</span>
                <span className="text-[11px] font-bold text-slate-300 group-hover:text-white uppercase">Exit Trace</span>
              </div>
            </button>
          </motion.div>
        )}

        {collapsed && isConstellationMode && (
          <div className="flex flex-col items-center pb-6 mt-4">
             <button onClick={() => setIsConstellationMode(false)} className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-500 hover:text-[#A7DADB] transition-all">
                <LayoutDashboard size={18} />
             </button>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-white/[0.03] bg-[#020617]/50 backdrop-blur-md space-y-4">
        {/* ACTIVE CANVAS TRIGGER (Relocated above Profile) */}
        {!collapsed && !isConstellationMode && pathname === '/constellation' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
              <button
                onClick={() => setIsConstellationMode(true)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#A7DADB]/5 border border-[#A7DADB]/20 hover:border-[#A7DADB]/40 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#A7DADB]/[0.02] group-hover:bg-[#A7DADB]/[0.05] transition-colors" />
                <Brain size={18} className="text-[#A7DADB] group-hover:scale-110 transition-transform relative z-10" />
                <div className="flex flex-col text-left relative z-10">
                  <span className="text-[9px] font-black text-[#A7DADB]/60 uppercase tracking-widest">Active Canvas</span>
                  <span className="text-[11px] font-bold text-white uppercase">Neural Trace</span>
                </div>
                <ArrowRight size={14} className="ml-auto text-[#A7DADB]/40 group-hover:translate-x-1 transition-transform relative z-10" />
              </button>
          </motion.div>
        )}

        {collapsed && !isConstellationMode && pathname === '/constellation' && (
          <div className="flex flex-col items-center mb-2">
             <button onClick={() => setIsConstellationMode(true)} className="w-10 h-10 rounded-xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 flex items-center justify-center text-[#A7DADB] hover:bg-[#A7DADB]/20 transition-all shadow-[0_0_15px_rgba(167,218,219,0.1)]" title="Active Canvas">
                <Brain size={18} />
             </button>
          </div>
        )}

        {!collapsed ? (
          <div className="space-y-4">
            <button className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.03] transition-all group">
              <div className="relative">
                <UserAvatar avatarUrl={dbAvatarUrl} sizeClass="w-10 h-10" />
                <div className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-[#020617]" />
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{dbName || user?.email?.split('@')[0]}</p>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter truncate">{user?.email}</p>
              </div>
            </button>
            <button onClick={signOut} className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all">
              Log Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
             <UserAvatar avatarUrl={dbAvatarUrl} sizeClass="w-9 h-9" />
             <button onClick={signOut} className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all" title="Log Out">
               <Icons.Logout size={18} />
             </button>
          </div>
        )}
      </div>
    </aside>
  );
}
