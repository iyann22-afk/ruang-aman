import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileQuestion,
  Share2,
} from 'lucide-react';
import { ReportStatus } from '../../types/index.js';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  const getStatusConfig = (s: ReportStatus) => {
    switch (s) {
      case 'submitted':
        return {
          label: 'Laporan Baru',
          icon: Clock,
          colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'under_review':
        return {
          label: 'Sedang Ditinjau',
          icon: Eye,
          colorClass: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'need_more_info':
        return {
          label: 'Perlu Bukti Tambahan',
          icon: FileQuestion,
          colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case 'referred':
        return {
          label: 'Dirujuk (Konseling/Satgas)',
          icon: Share2,
          colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'resolved':
        return {
          label: 'Selesai Ditangani',
          icon: CheckCircle2,
          colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'closed':
        return {
          label: 'Selesai & Diarsipkan',
          icon: AlertCircle,
          colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      default:
        return {
          label: s,
          icon: Clock,
          colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs ${config.colorClass} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
