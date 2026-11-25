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
  UserCheck,
  UserPlus,
  UserX,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { AdminReportDetail, ReportStatus } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import { ToastAlert } from '../../components/feedback/ToastAlert.js';
import { useAuth } from '../../contexts/AuthContext.js';

export const DetailLaporan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const isManagerOrSuperAdmin = admin?.role === 'super_admin' || admin?.role === 'case_manager';

  const [report, setReport] = useState<AdminReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [counselors, setCounselors] = useState<Array<{ id: string; full_name: string }>>([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
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
      setSelectedCounselorId(data.assigned_admin_id || '');
    } catch (err: any) {
      console.error('Failed to load report detail', err);
      setToast({ type: 'error', message: err.message || 'Laporan tidak ditemukan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManagerOrSuperAdmin) {
      apiClient
        .getCounselingCounselors()
        .then((list) => setCounselors(list))
        .catch((err) => console.error('Failed to load counselors', err));
    }
  }, [isManagerOrSuperAdmin]);

  const handleAssignmentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setAssigning(true);
    setToast(null);

    try {
      await apiClient.assignReport(id, {
        assigned_admin_id: selectedCounselorId ? selectedCounselorId : null,
        notes: assignmentNotes.trim() || undefined,
      });

      setToast({
        type: 'success',
        message: selectedCounselorId
          ? 'Laporan berhasil ditugaskan ke Guru BK terpilih.'
          : 'Penugasan laporan berhasil dicabut.',
      });
      setAssignmentNotes('');
      await fetchDetail();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal memperbarui penugasan.' });
    } finally {
      setAssigning(false);
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
        <h3 className="text-lg font-bold text-[#17324D]">
          {toast?.message || 'Laporan Tidak Ditemukan'}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Pastikan ID laporan benar atau periksa hak akses penugasan akun petugas Anda.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/laporan')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
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
                    {ev.signed_url ? (
                      <a
                        href={ev.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0F9F91]/10 text-[#0F9F91] hover:bg-[#0F9F91]/20 font-semibold text-[10px] shrink-0 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Unduh Bukti</span>
                      </a>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-slate-200 font-semibold text-slate-700 text-[10px] shrink-0">
                        Private Storage (Demo)
                      </span>
                    )}
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
          {/* Action Box: Assignment to Guru BK */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#17324D] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-4 h-4 text-[#0F9F91]" />
              <span>Penanggung Jawab Kasus (Guru BK)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 font-medium">Petugas Aktif:</span>
                <span className="font-bold text-[#17324D]">
                  {report.assigned_admin?.full_name || 'Belum Ditugaskan'}
                </span>
              </div>

              {isManagerOrSuperAdmin ? (
                <form onSubmit={handleAssignmentUpdate} className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Tugaskan ke Guru BK</label>
                    <select
                      value={selectedCounselorId}
                      onChange={(e) => setSelectedCounselorId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-[#17324D] focus:ring-2 focus:ring-[#0F9F91] outline-hidden text-xs"
                    >
                      <option value="">-- Belum Ditugaskan (Cabut Penugasan) --</option>
                      {counselors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Catatan Penugasan (Opsional)</label>
                    <textarea
                      rows={2}
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Catatan arahan awal bagi Guru BK penanggung jawab..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-[#0F9F91] text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={assigning}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#17324D] hover:bg-[#0F2236] transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{assigning ? 'Menyimpan...' : 'Perbarui Penanggung Jawab'}</span>
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    {report.assigned_admin_id === admin?.id
                      ? 'Kasus ini didelegasikan kepada Anda sebagai Guru BK untuk pendampingan konseling.'
                      : 'Kasus ini ditangani oleh konselor lain.'}
                  </span>
                </div>
              )}
            </div>
          </div>

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
