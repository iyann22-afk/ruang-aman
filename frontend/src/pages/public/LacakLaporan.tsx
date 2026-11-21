import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { TrackedReport } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { ToastAlert } from '../../components/feedback/ToastAlert.js';

export const LacakLaporan: React.FC = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackedReport | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setError('Masukkan kode pelacakan laporan Anda');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.trackReport(trackingCode.trim());
      setResult(data);
    } catch (err: any) {
      setError(
        err.message ||
          'Kode pelacakan tidak ditemukan. Pastikan format penulisan sesuai (contoh: RA-2026-F9X2K1).'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F9F91] border border-[#0F9F91]/20">
          <Search className="w-3.5 h-3.5" />
          <span>Pelacakan Kasus Real-Time</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17324D]">Lacak Status Laporan</h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Masukkan kode unik yang Anda terima saat mengirimkan laporan untuk melihat perkembangan
          penanganan oleh Tim Satgas dan Guru BK.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-white/70 shadow-lg">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="Contoh: RA-2026-F9X2K1"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white/90 text-sm font-mono tracking-wider focus:ring-2 focus:ring-[#0F9F91] outline-hidden shadow-xs uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-lg disabled:opacity-50 transition-all shrink-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mencari...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Cek Status</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>Format: RA-YYYY-XXXXXX</span>
          <span className="flex items-center gap-1 text-[#0F9F91]">
            <Lock className="w-3 h-3" />
            <span>Pencarian Aman &amp; Terlindungi</span>
          </span>
        </div>
      </div>

      {error && (
        <ToastAlert
          type="error"
          title="Laporan Tidak Ditemukan"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* TRACKING RESULTS VIEW */}
      {result && (
        <div className="rounded-3xl glass-panel p-6 sm:p-10 border border-white/80 shadow-xl space-y-8 animate-fadeIn">
          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Kode Pelacakan Resmi
              </span>
              <h2 className="text-2xl font-mono font-black text-[#17324D] tracking-wide">
                {result.tracking_code}
              </h2>
            </div>
            <div>
              <StatusBadge status={result.status} size="lg" />
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#0F9F91]" />
                Kategori Kasus
              </span>
              <p className="text-sm font-bold text-[#17324D]">{result.category_name}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0F9F91]" />
                Tanggal Masuk
              </span>
              <p className="text-sm font-bold text-[#17324D]">
                {new Date(result.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0F9F91]" />
                Lokasi Kejadian
              </span>
              <p className="text-sm font-bold text-[#17324D]">{result.incident_location}</p>
            </div>
          </div>

          {/* Status Progression Timeline */}
          <div className="space-y-6 pt-4">
            <h3 className="text-base font-bold text-[#17324D] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0F9F91]" />
              <span>Linimasa Progres Penanganan</span>
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#CCFBF1]">
              {result.timeline.map((item, index) => (
                <div key={index} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                      index === 0 ? 'bg-[#0F9F91] ring-4 ring-[#CCFBF1]' : 'bg-slate-300'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    </div>

                    {item.public_message ? (
                      <div className="mt-2 p-3 rounded-xl bg-[#E0F2FE]/40 border border-sky-100 flex items-start gap-2.5">
                        <MessageSquare className="w-4 h-4 text-[#0F9F91] shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 leading-relaxed">
                          <strong>Catatan Petugas:</strong> {item.public_message}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Laporan sedang diproses sesuai SOP penanganan kekerasan sekolah.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Footnote Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#0F9F91] shrink-0 mt-0.5" />
            <span>
              <strong>Perlindungan Privasi Pelapor:</strong> Halaman pelacakan publik ini sengaja
              tidak menampilkan identitas nama pelapor, kronologi penuh, atau bukti dokumen demi
              menjaga kerahasiaan Anda jika perangkat diakses orang lain.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
