"use client";

import React from 'react';
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/lib/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { usePathname } from 'next/navigation';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  if (isAuthPage) {
    return <main className="w-full h-full">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 transition-all duration-500 ease-in-out relative overflow-y-auto custom-scrollbar">
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
