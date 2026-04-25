/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  sizeClass?: string;
  avatarUrl?: string | null;
}

export const UserAvatar = ({ 
  sizeClass = "w-10 h-10",
  avatarUrl 
}: UserAvatarProps) => {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <div className={`${sizeClass} relative rounded-full overflow-hidden border border-[#A7DADB]/20 bg-black/40`}>
        <img 
          src={avatarUrl} 
          alt="User" 
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-[#A7DADB]/10 border border-[#A7DADB]/20 text-[#A7DADB] shadow-inner`}>
      <User size={sizeClass.includes('w-10') ? 20 : 16} />
    </div>
  );
};
