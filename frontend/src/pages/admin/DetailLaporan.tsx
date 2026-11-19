import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  History,
  Lock,
  MapPin,
  MessageSquare,
  Shield,
  ShieldAlert,
  User,
  UserX,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { AdminReportDetail, ReportStatus } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import { ToastAlert } from '../../components/feedback/ToastAlert.js';

export const DetailLaporan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AdminReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Status Change Form State
  const [newStatus, setNewStatus] = useState<ReportStatus>('under_review');
  const [publicMessage, setPublicMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiClient.getAdminReportDetail(id);
      setReport(data);
      setNewStatus(data.status);
    } catch (err: any) {
      console.error('Failed to load report detail', err);
      setToast({ type: 'error', message: err.message || 'Laporan tidak ditemukan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setUpdating(true);
    setToast(null);

    try {
      await apiClient.updateReportStatus(id, {
        status: newStatus,
        public_message: publicMessage.trim() || undefined,
        internal_note: internalNote.trim() || undefined,
      });

      setToast({ type: 'success', message: 'Status laporan berhasil diperbarui.' });
      setPublicMessage('');
      setInternalNote('');
      await fetchDetail();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal memperbarui status.' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-64 bg-white rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-[#17324D]">Laporan Tidak Ditemukan</h3>
        <button
          type="button"
          onClick={() => navigate('/admin/laporan')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Laporan</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/laporan"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl sm:text-2xl font-black text-[#17324D]">
                {report.tracking_code}
              </span>
              <IdentityBadge mode={report.identity_mode} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dikirim pada{' '}
              {new Date(report.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </p>
          </div>
        </div>

        <StatusBadge status={report.status} size="lg" />
      </div>

      {toast && (
        <ToastAlert
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Grid: Details (Left) + Status Modifier (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col (8 cols): Incident Details & Evidences */}
        <div className="lg:col-span-7 space-y-6">
          {/* Box 1: Core Incident Info */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-[#17324D] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-[#0F9F91]" />
              <span>Rincian Insiden Kejadian</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-slate-400 font-medium">Kategori Kasus:</span>
                <p className="font-bold text-[#17324D] text-sm">{report.category_name}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-slate-400 font-medium">Tanggal Peristiwa:</span>
                <p className="font-bold text-[#17324D] text-sm">{report.incident_date}</p>
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-slate-400 font-medium">Lokasi / Tempat Kejadian:</span>
                <p className="font-bold text-[#17324D] text-sm">{report.incident_location}</p>
              </div>
            </div>

            {/* Reporter Information (Internal Only) */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Informasi Pelapor (Hanya Internal Petugas)
              </span>
              {report.identity_mode === 'anonymous' ? (
                <p className="text-xs text-slate-600 italic">
                  Pelapor memilih <strong>Mode Anonim</strong>. Tidak ada identitas diri atau kontak
                  yang tersimpan di sistem.
                </p>
              ) : (
                <div className="text-xs text-slate-800 space-y-1 font-medium">
                  <p>
                    Nama Siswa:{' '}
                    <strong className="text-[#17324D]">
                      {report.reporter_name || 'Tidak ada'}
                    </strong>
                  </p>
                  <p>
                    Kontak / WhatsApp:{' '}
                    <strong className="text-[#17324D]">
                      {report.reporter_contact || 'Tidak ada'}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            {/* Chronology Text */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 block">Kronologi Kejadian:</span>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                {report.chronology}
              </div>
            </div>
          </div>

          {/* Box 2: Attached Evidence Files */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#17324D] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCheck className="w-4 h-4 text-[#0F9F91]" />
              <span>Lampiran Bukti ({report.evidences?.length || 0})</span>
            </h3>

            {report.evidences && report.evidences.length > 0 ? (
              <div className="space-y-3">
                {report.evidences.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-3">
                      <p className="font-bold text-[#17324D] truncate">{ev.original_filename}</p>
                      <p className="text-[10px] text-slate-500">
                        {(ev.file_size_bytes / (1024 * 1024)).toFixed(2)} MB • {ev.mime_type}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-slate-200 font-semibold text-slate-700 text-[10px] shrink-0">
                      Private Storage (Demo)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Tidak ada lampiran bukti yang disertakan.</p>
            )}
          </div>
        </div>

        {/* Right Col (5 cols): Status Change Action & Audit Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Box: Update Status */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-[#17324D] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-4 h-4 text-[#0F9F91]" />
              <span>Perbarui Status Kasus</span>
            </h3>

            <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Pilih Status Baru</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-[#17324D] focus:ring-2 focus:ring-[#0F9F91] outline-hidden"
                >
                  <option value="submitted">Laporan Baru (submitted)</option>
                  <option value="under_review">Sedang Ditinjau (under_review)</option>
                  <option value="need_more_info">Perlu Info Tambahan (need_more_info)</option>
                  <option value="referred">Dirujuk ke Guru BK (referred)</option>
                  <option value="resolved">Selesai Ditangani (resolved)</option>
                  <option value="closed">Ditutup / Diarsipkan (closed)</option>
                </select>
              </div>

              {/* Public Message for Reporter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1">
                  <span>Pesan Publik untuk Pelapor</span>
                  <span className="text-[10px] text-emerald-600 font-normal">
                    (Dapat dilihat di Lacak Laporan)
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={publicMessage}
                  onChange={(e) => setPublicMessage(e.target.value)}
                  placeholder="Contoh: Laporan telah kami terima dan Guru BK akan menjadwalkan mediasi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-[#0F9F91]"
                ></textarea>
              </div>

              {/* Internal Confidential Note */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1">
                  <span>Catatan Rahasia Internal Tim</span>
                  <span className="text-[10px] text-rose-500 font-normal">
                    (Rahasia, TIDAK pernah dilihat pelapor)
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Contoh: Periksa rekaman CCTV kantin jam 12.30 dan panggil wali kelas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-[#0F9F91]"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#0F9F91] hover:bg-[#0B7A6F] transition-colors shadow-xs disabled:opacity-50"
              >
                {updating ? 'Memperbarui...' : 'Simpan Pembaruan Kasus'}
              </button>
            </form>
          </div>

          {/* Timeline Audit History for This Case */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#17324D] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-[#0F9F91]" />
              <span>Riwayat Mutasi Status ({report.histories?.length || 0})</span>
            </h3>

            <div className="space-y-4 text-xs">
              {report.histories && report.histories.length > 0 ? (
                report.histories.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={h.new_status} size="sm" />
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {h.public_message && (
                      <p className="text-slate-700 font-medium">
                        <strong>Publik:</strong> {h.public_message}
                      </p>
                    )}

                    {h.internal_note && (
                      <p className="text-rose-700 bg-rose-50 p-2 rounded-lg font-mono text-[11px]">
                        <strong>Internal:</strong> {h.internal_note}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">Belum ada riwayat status.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
