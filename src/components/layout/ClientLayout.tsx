"use client";

import React from 'react';
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "@/lib/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { usePathname } from 'next/navigation';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  if (isAuthPage) {
    return <main className="w-full h-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main 
        className="flex-1 transition-all duration-500 ease-in-out"
        style={{ paddingLeft: collapsed ? '80px' : '320px' }}
      >
        {children}
      </main>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <LayoutContent>
          {children}
        </LayoutContent>
      </SidebarProvider>
    </AuthProvider>
  );
}
