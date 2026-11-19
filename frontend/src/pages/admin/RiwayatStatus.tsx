import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  History,
  Lock,
  MessageSquare,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { ReportStatusHistory } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';

export const RiwayatStatus: React.FC = () => {
  const [histories, setHistories] = useState<ReportStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistories = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getStatusHistory();
      setHistories(data);
    } catch (err) {
      console.error('Failed to load status histories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistories();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#17324D] tracking-tight">Audit Trail Riwayat Status</h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekam jejak kepatuhan SOP penanganan kasus dan mutasi status oleh tim berwenang.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistories}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Main Audit Trail Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-[#0F9F91] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Memuat riwayat audit trail...</p>
          </div>
        ) : histories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-[#17324D]">Belum Ada Aktivitas Audit</h4>
            <p className="text-xs text-slate-500">
              Riwayat mutasi status akan tercatat otomatis setiap ada aksi perubahan status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kode Kasus</th>
                  <th className="py-3 px-4">Status Baru</th>
                  <th className="py-3 px-4">Pesan Transparan Publik</th>
                  <th className="py-3 px-4">Catatan Rahasia Internal</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {histories.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#17324D] whitespace-nowrap">
                      {item.tracking_code || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={item.new_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      {item.public_message ? (
                        <span>{item.public_message}</span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      {item.internal_note ? (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono text-[11px]">
                          {item.internal_note}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/laporan/${item.report_id}`}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-[#0F9F91] hover:text-white text-slate-700 font-bold transition-colors inline-block"
                      >
                        Kasus
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
