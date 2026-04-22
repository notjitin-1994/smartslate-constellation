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

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);
  const [quickAccessOpen, setQuickAccessOpen] = useState(true);
  const [solaraSuiteOpen, setSolaraSuiteOpen] = useState(false);
  const [dbName, setDbName] = useState<string | null>(null);

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
  }, [user?.id]);

  if (!isMounted) return null;

  const getFullName = (): string => {
    if (dbName) return dbName;
    const rawName =
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      (user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : null) ||
      user?.email?.split('@')[0] ||
      'User';
    return rawName.trim();
  };

  const getCapitalizedFullName = (): string => {
    const name = getFullName();
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const handleNavigation = (path: string, isExternal: boolean = false) => {
    if (isExternal) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      router.push(path);
    }
  };

  return (
    <aside
      className={`hidden h-screen flex-col md:flex fixed left-0 top-0 z-50 transition-all duration-300 ease-out glass-sidebar ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Header with Brand & Toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2 py-3' : 'justify-between px-6 py-5'} sticky top-0 z-20`}>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Brand />
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-text-secondary hover:text-foreground hover:bg-foreground/5 p-2 rounded-lg transition-all ${
            collapsed ? 'h-8 w-8' : 'h-9 w-9'
          }`}
        >
          <IconSidebarToggle className={`h-5 w-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        {!collapsed ? (
          <nav className="px-4 py-4 space-y-6">
            {/* Quick Access Section */}
            <div className="space-y-1.5">
              <button
                onClick={() => setQuickAccessOpen(!quickAccessOpen)}
                className="w-full flex items-center justify-between px-3 py-1 text-primary hover:text-foreground transition-colors group"
              >
                <h2 className="font-heading text-xs font-bold tracking-wider uppercase">
                  Quick Access
                </h2>
                <Icons.ChevronRight 
                  size={12} 
                  className={`transition-transform duration-300 ${quickAccessOpen ? 'rotate-90' : ''}`} 
                />
              </button>
              <AnimatePresence initial={false}>
                {quickAccessOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden space-y-1"
                  >
                    {quickAccessItems.map((item) => {
                      const isActive = pathname === item.path;
                      return (
                        <button
                          key={item.title}
                          onClick={() => router.push(item.path)}
                          className={`group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-all duration-200 relative ${
                            isActive ? 'bg-primary/10 text-primary shadow-sm font-bold' : 'text-text-secondary hover:bg-white/5 hover:text-foreground active:scale-[0.98]'
                          }`}
                        >
                          <item.icon size={20} className="shrink-0" />
                          <span className="flex-1 truncate text-left">{item.title}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Solara Suite Section */}
            <div className="space-y-1.5">
              <button
                onClick={() => setSolaraSuiteOpen(!solaraSuiteOpen)}
                className="w-full flex items-center justify-between px-3 py-1 text-primary hover:text-foreground transition-colors group"
              >
                <h2 className="font-heading text-xs font-bold tracking-wider uppercase">
                  Solara Suite
                </h2>
                <Icons.ChevronRight 
                  size={12} 
                  className={`transition-transform duration-300 ${solaraSuiteOpen ? 'rotate-90' : ''}`} 
                />
              </button>
              <AnimatePresence initial={false}>
                {solaraSuiteOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden space-y-1"
                  >
                    {solaraSuiteLinks.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => item.isExternal ? window.open(item.path, '_blank') : (item.path !== '#' && router.push(item.path))}
                        disabled={item.badgeType === 'soon'}
                        className="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all duration-200 text-text-secondary hover:bg-white/5 hover:text-foreground disabled:text-text-disabled disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        <span className="truncate flex-1 text-left">{item.name}</span>
                        <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 ${
                          item.badgeType === 'active' ? 'border-primary/40 bg-primary/10 text-primary shadow-primary/20 shadow' : 'text-text-disabled border-neutral-700 bg-neutral-800'
                        }`}>
                          {item.badge}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        ) : (
          <nav className="flex flex-col items-center space-y-4 py-6">
            {quickAccessItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <motion.div key={item.title} whileHover={{ x: 3 }}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    title={item.title}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(167,218,219,0.15)]' 
                        : 'text-text-secondary hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                  </button>
                </motion.div>
              );
            })}
          </nav>
        )}
      </div>

      {/* Footer Section */}
      <div className="mt-auto w-full p-4 relative z-10 border-t border-white/10 bg-surface/50 backdrop-blur-sm">
        {collapsed ? (
          <div className="flex flex-col items-center gap-4 px-2 py-4">
            <button 
              onClick={() => window.open('https://polaris.smartslate.io/pricing', '_blank')}
              className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-white shadow-sm hover:bg-secondary/90 transition-all active:scale-95"
            >
              <Icons.Pro size={16} />
            </button>
            <UserAvatar user={user} sizeClass="w-8 h-8" />
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => window.open('https://polaris.smartslate.io/pricing', '_blank')}
              className="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 text-secondary hover:bg-secondary/10 active:scale-[0.98]"
            >
              <span className="truncate">Subscribe to Constellation</span>
              <Icons.Pro size={16} className="shrink-0" />
            </button>
            
            <button
              onClick={() => router.push('/profile')}
              className="group hover:bg-white/5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="relative">
                <UserAvatar user={user} sizeClass="w-9 h-9" textClass="text-sm font-bold" />
                <div className="bg-success absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-foreground truncate text-sm font-semibold leading-tight">
                  {getCapitalizedFullName()}
                </p>
                <p className="text-text-secondary truncate text-xs leading-tight mt-0.5">{user?.email}</p>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => router.push('/settings')}
                className="group flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-foreground hover:bg-white/5 rounded-lg transition-all active:scale-[0.98]"
              >
                <Icons.Settings size={18} className="shrink-0" />
                <span className="truncate">Settings</span>
              </button>
              <button 
                onClick={signOut}
                className="group flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-error hover:bg-error/5 rounded-lg transition-all active:scale-[0.98]"
              >
                <Icons.Logout size={18} className="shrink-0" />
                <span className="truncate">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
