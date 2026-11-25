import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { AdminReportListItem, ReportCategory } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import { useAuth } from '../../contexts/AuthContext.js';

export const DaftarLaporan: React.FC = () => {
  const { admin } = useAuth();
  const [reports, setReports] = useState<AdminReportListItem[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [reportsData, categoriesData] = await Promise.all([
        apiClient.getAdminReports({
          status: selectedStatus,
          category_id: selectedCategory,
          identity_mode: selectedMode,
          search: search.trim(),
        }),
        apiClient.getCategories(),
      ]);

      setReports(reportsData.items);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStatus, selectedCategory, selectedMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#17324D] tracking-tight">
            {admin?.role === 'counselor' ? 'Laporan Ditugaskan kepada Anda' : 'Daftar Seluruh Laporan'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {admin?.role === 'counselor'
              ? 'Anda bertindak sebagai Guru BK / Konselor. Hanya laporan yang didelegasikan khusus kepada Anda yang ditampilkan demi kerahasiaan kasus.'
              : 'Manajemen verifikasi kasus, pengalihan investigasi, dan sesi konseling sekolah.'}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {admin?.role === 'counselor' && (
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2.5">
          <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Hak Akses Terbatas (Konselor):</strong> Anda hanya berwenang melihat laporan kasus yang ditugaskan kepada Anda. Laporan lain diproteksi demi perlindungan privasi.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan kode laporan, lokasi, atau nama..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0F9F91] outline-hidden bg-slate-50/50 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0F9F91] hover:bg-[#0B7A6F] shrink-0"
          >
            Cari
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Status Penanganan</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-hidden focus:ring-2 focus:ring-[#0F9F91]"
            >
              <option value="all">Semua Status</option>
              <option value="submitted">Laporan Baru (submitted)</option>
              <option value="under_review">Sedang Ditinjau (under_review)</option>
              <option value="need_more_info">Perlu Info Tambahan (need_more_info)</option>
              <option value="referred">Dirujuk (referred)</option>
              <option value="resolved">Selesai Ditangani (resolved)</option>
              <option value="closed">Ditutup (closed)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Kategori Perundungan</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-hidden focus:ring-2 focus:ring-[#0F9F91]"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Identity Mode Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Mode Identitas</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-hidden focus:ring-2 focus:ring-[#0F9F91]"
            >
              <option value="all">Semua Mode</option>
              <option value="anonymous">Hanya Anonim</option>
              <option value="identified">Hanya Teridentifikasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-[#0F9F91] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Memuat daftar laporan...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-[#17324D]">Tidak Ada Laporan Ditemukan</h4>
            <p className="text-xs text-slate-500">
              Tidak ada data yang cocok dengan kriteria filter saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Kode Lacak</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Tanggal Kejadian</th>
                  <th className="py-3 px-4">Lokasi</th>
                  <th className="py-3 px-4">Identitas</th>
                  <th className="py-3 px-4">Guru BK</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#17324D]">
                      {report.tracking_code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0F9F91]">
                      {report.category_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{report.incident_date}</td>
                    <td className="py-3.5 px-4 truncate max-w-[180px]">{report.incident_location}</td>
                    <td className="py-3.5 px-4">
                      <IdentityBadge mode={report.identity_mode} />
                    </td>
                    <td className="py-3.5 px-4">
                      {report.assigned_admin_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-purple-50 text-purple-700 border border-purple-200">
                          <UserCheck className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate max-w-[120px]">{report.assigned_admin_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum ditugaskan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/laporan/${report.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F9F91] hover:bg-[#0B7A6F] text-white font-bold transition-all shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Periksa Kasus</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
