"use client";

import React, { createContext, useContext, useState } from 'react';

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
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, isConstellationMode, setIsConstellationMode }}>
      {children}
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
