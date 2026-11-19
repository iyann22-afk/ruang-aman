import React from 'react';
import { Shield, User } from 'lucide-react';
import { IdentityMode } from '../../types/index.js';

interface IdentityBadgeProps {
  mode: IdentityMode;
}

export const IdentityBadge: React.FC<IdentityBadgeProps> = ({ mode }) => {
  if (mode === 'anonymous') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <Shield className="w-3 h-3 text-[#0F9F91]" />
        <span>Anonim (Rahasia)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#CCFBF1]/50 text-[#0F9F91] border border-[#0F9F91]/20">
      <User className="w-3 h-3 text-[#0F9F91]" />
      <span>Teridentifikasi</span>
    </span>
  );
};
