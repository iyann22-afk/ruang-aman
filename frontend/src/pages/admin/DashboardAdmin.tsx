import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  FileText,
  PieChart,
  RefreshCw,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { DashboardSummary } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';

export const DashboardAdmin: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const data = await apiClient.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Laporan',
      value: summary?.total_reports || 0,
      icon: FileSpreadsheet,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Laporan Baru',
      value: summary?.new_reports || 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Sedang Ditinjau',
      value: summary?.under_review || 0,
      icon: Eye,
      color: 'from-sky-500 to-cyan-500',
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50',
    },
    {
      label: 'Dirujuk (BK/Satgas)',
      value: summary?.referred || 0,
      icon: Share2,
      color: 'from-purple-500 to-indigo-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Selesai Ditangani',
      value: summary?.resolved || 0,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#17324D] tracking-tight">Dashboard Ringkasan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantauan kasus kekerasan dan tindak lanjut pendampingan real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
          <Link
            to="/admin/laporan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F9F91] hover:bg-[#0B7A6F] shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Kelola Laporan</span>
          </Link>
        </div>
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 truncate">{stat.label}</span>
                <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#17324D] tracking-tight">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Category Distribution Progress Bars */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#17324D] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#0F9F91]" />
              <span>Distribusi Kategori Perundungan</span>
            </h3>
          </div>

          <div className="space-y-4">
            {summary?.category_breakdown.map((cat, index) => {
              const total = summary.total_reports || 1;
              const percentage = Math.round((cat.count / total) * 100);

              return (
                <div key={index} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">{cat.category}</span>
                    <span className="text-slate-500 font-mono">
                      {cat.count} kasus ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0F9F91] to-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Reports Table */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#17324D] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0F9F91]" />
              <span>Laporan Terbaru Masuk</span>
            </h3>
            <Link
              to="/admin/laporan"
              className="text-xs font-semibold text-[#0F9F91] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Kode</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Identitas</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {summary?.recent_reports && summary.recent_reports.length > 0 ? (
                  summary.recent_reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#17324D]">
                        {report.tracking_code}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{report.incident_date}</td>
                      <td className="py-3 px-3">
                        <IdentityBadge mode={report.identity_mode} />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={report.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/admin/laporan/${report.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0F9F91] hover:text-white text-slate-700 font-bold transition-colors inline-block"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      Belum ada laporan yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Audit Activities */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-[#17324D] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0F9F91]" />
            <span>Aktivitas Mutasi Status Terkini</span>
          </h3>
          <Link
            to="/admin/riwayat-status"
            className="text-xs font-semibold text-[#0F9F91] hover:underline"
          >
            Lihat Riwayat Lengkap
          </Link>
        </div>

        <div className="space-y-3">
          {summary?.recent_activities && summary.recent_activities.length > 0 ? (
            summary.recent_activities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={act.new_status} size="sm" />
                    <span className="font-semibold text-slate-700">
                      {act.public_message || 'Status diperbarui oleh petugas'}
                    </span>
                  </div>
                  {act.internal_note && (
                    <p className="text-[11px] text-slate-500 italic pl-1">
                      Catatan internal: "{act.internal_note}"
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(act.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  WIB
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">Belum ada riwayat perubahan status.</p>
          )}
        </div>
      </div>
    </div>
  );
};
