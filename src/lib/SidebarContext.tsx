"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type SidebarContextType = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isConstellationMode: boolean;
  setIsConstellationMode: (isConstellationMode: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isConstellationMode, setIsConstellationMode] = useState(false);
  const [isInitialized, setIsMounted] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    const savedMode = localStorage.getItem('sidebar-mode');
    
    if (savedCollapsed !== null) setCollapsed(savedCollapsed === 'true');
    if (savedMode !== null) setIsConstellationMode(savedMode === 'true');
    
    setIsMounted(true);
  }, []);

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', val.toString());
    }
  };

  const handleSetMode = (val: boolean) => {
    setIsConstellationMode(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-mode', val.toString());
    }
  };

  return (
    <SidebarContext.Provider value={{ 
      collapsed, 
      setCollapsed: handleSetCollapsed, 
      isConstellationMode, 
      setIsConstellationMode: handleSetMode 
    }}>
      {isInitialized ? children : <div className="bg-[#020617] min-h-screen" />}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
