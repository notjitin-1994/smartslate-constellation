"use client";

import React from 'react';
import { Icons } from './icons';

interface UserAvatarProps {
  user?: any;
  sizeClass?: string;
  textClass?: string;
}

export const UserAvatar = ({ user, sizeClass = "w-8 h-8", textClass = "text-xs" }: UserAvatarProps) => {
  return (
    <div className={`relative flex-shrink-0 ${sizeClass} rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center overflow-hidden`}>
      <div className="absolute inset-0 bg-secondary blur-sm opacity-20" />
      <Icons.User className={`text-secondary relative z-10`} size={sizeClass.includes('w-9') ? 18 : 16} />
    </div>
  );
};
