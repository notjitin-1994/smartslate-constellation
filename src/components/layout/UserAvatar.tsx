"use client";

import React from 'react';
import { User } from 'lucide-react';
import Image from 'next/image';

interface UserAvatarProps {
  sizeClass?: string;
  avatarUrl?: string | null;
}

export const UserAvatar = ({ 
  sizeClass = "w-10 h-10",
  avatarUrl 
}: UserAvatarProps) => {
  if (avatarUrl) {
    return (
      <div className={`${sizeClass} relative rounded-full overflow-hidden border border-[rgba(124,105,245,0.2)]`}>
        <Image 
          src={avatarUrl} 
          alt="User Avatar" 
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-[#7C69F5]/20 border border-[#7C69F5]/40 text-[#7C69F5]`}>
      <User size={sizeClass.includes('w-8') ? 16 : 20} />
    </div>
  );
};
