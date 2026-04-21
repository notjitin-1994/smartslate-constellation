"use client";

import React from 'react';
import { 
  LayoutGrid, 
  Layers, 
  Database, 
  SearchCheck, 
  FileCode, 
  Zap, 
  Navigation, 
  Telescope, 
  Ship, 
  Crown, 
  Sparkles,
  User,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';

export function IconSidebarToggle({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M9 5v14" />
    </svg>
  );
}

export const Icons = {
  Dashboard: LayoutGrid,
  Blueprints: Layers,
  Assets: Database,
  GapAnalysis: SearchCheck,
  ScriptGen: FileCode,
  User: User,
  Pro: Zap,
  Navigation: Navigation,
  Telescope: Telescope,
  Ship: Ship,
  Crown: Crown,
  AI: Sparkles,
  Settings: Settings,
  Logout: LogOut,
  ChevronRight: ChevronRight
};
