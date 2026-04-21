"use client";

import React, { memo } from 'react';
import Link from 'next/link';

export const Brand = memo(function Brand() {
  return (
    <Link
      href="/dashboard"
      className="group hover:bg-foreground/5 focus-visible:ring-primary/50 relative -mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
    >
      {/* Subtle glow effect on hover */}
      <div
        className="bg-primary/5 absolute inset-0 rounded-xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="relative">
        <img
          src="/logo.png"
          alt="Smartslate"
          className="relative h-7 w-auto drop-shadow-sm transition-all duration-300 select-none group-hover:scale-[1.02] group-hover:drop-shadow-md"
          draggable="false"
        />
      </div>
    </Link>
  );
});

Brand.displayName = 'Brand';
