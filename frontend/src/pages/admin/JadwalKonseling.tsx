import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Plus,
  RefreshCw,
  Video,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import {
  AdminCounselingSlot,
  CounselingCounselorOption,
} from '../../types/index.js';
import { useAuth } from '../../contexts/AuthContext.js';

function toLocalDateTimeValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }) + ' WIB';
}

function getSlotLabel(slot: AdminCounselingSlot): { label: string; style: string } {
  if (slot.status === 'booked') {
    return { label: 'Sudah dipesan', style: 'bg-sky-50 text-sky-700 border-sky-200' };
  }
  if (slot.status === 'cancelled') {
    return { label: 'Dibatalkan', style: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (slot.status === 'completed') {
    return { label: 'Selesai', style: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  if (new Date(slot.start_at).getTime() <= Date.now()) {
    return { label: 'Waktu terlewat', style: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return { label: 'Tersedia', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

export const JadwalKonseling: React.FC = () => {
  const { admin } = useAuth();
  const canAssignCounselor = admin?.role !== 'counselor';

  const [slots, setSlots] = useState<AdminCounselingSlot[]>([]);
  const [counselors, setCounselors] = useState<CounselingCounselorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [counselorAdminId, setCounselorAdminId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [sessionMode, setSessionMode] = useState<'offline' | 'online'>('offline');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const minDateTime = useMemo(() => toLocalDateTimeValue(new Date()), []);

  const loadSlots = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await apiClient.getAdminCounselingSlots();
      setSlots(data);
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage(error?.message || 'Gagal memuat jadwal konseling.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    if (!canAssignCounselor) return;
    apiClient.getCounselingCounselors()
      .then((data) => {
        setCounselors(data);
        setCounselorAdminId((current) => current || data[0]?.id || '');
      })
      .catch((error: any) => {
        setErrorMessage(error?.message || 'Daftar Guru BK gagal dimuat.');
      });
  }, [canAssignCounselor]);

  const resetForm = () => {
    setStartAt('');
    setEndAt('');
    setSessionMode('offline');
    setLocation('');
    setMeetingLink('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (!startAt || !endAt || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      setErrorMessage('Tanggal dan waktu mulai serta selesai wajib diisi.');
      return;
    }
    if (start.getTime() <= Date.now()) {
      setErrorMessage('Waktu mulai harus berada di masa depan.');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setErrorMessage('Waktu selesai harus setelah waktu mulai.');
      return;
    }
    if (canAssignCounselor && !counselorAdminId) {
      setErrorMessage('Belum ada Guru BK aktif yang dapat dipilih.');
      return;
    }
    if (sessionMode === 'offline' && !location.trim()) {
      setErrorMessage('Lokasi sesi tatap muka wajib diisi.');
      return;
    }
    if (sessionMode === 'online' && !meetingLink.trim()) {
      setErrorMessage('Tautan sesi online wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.createAdminCounselingSlot({
        ...(canAssignCounselor ? { counselor_admin_id: counselorAdminId } : {}),
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        session_mode: sessionMode,
        location: sessionMode === 'offline' ? location.trim() : null,
        meeting_link: sessionMode === 'online' ? meetingLink.trim() : null,
      });
      setSuccessMessage('Jadwal berhasil dibuat dan langsung dipublikasikan.');
      resetForm();
      await loadSlots(true);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Jadwal gagal dibuat. Periksa kembali data yang diisi.');
    } finally {
      setSaving(false);
    }
  };

  const upcomingCount = slots.filter((slot) =>
    slot.status === 'available' && new Date(slot.start_at).getTime() > Date.now()
  ).length;
  const bookedCount = slots.filter((slot) => slot.status === 'booked').length;
  const pastCount = slots.filter((slot) => new Date(slot.start_at).getTime() <= Date.now()).length;

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0F9F91] bg-[#CCFBF1] border border-[#0F9F91]/20 rounded-full px-3 py-1.5 mb-3">
            <CalendarDays className="w-3.5 h-3.5" />
            PENGELOLAAN PENDAMPINGAN
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17324D] tracking-tight">
            Jadwal Konseling
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Atur waktu layanan Guru BK agar siswa dapat memilih sesi pendampingan yang benar-benar tersedia.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadSlots(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Segarkan Jadwal
        </button>
      </div>

      {errorMessage && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div role="status" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <p className="text-xs text-slate-500">Jadwal tersedia mendatang</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{upcomingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <p className="text-xs text-slate-500">Sudah dipesan</p>
          <p className="text-2xl font-black text-sky-700 mt-1">{bookedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <p className="text-xs text-slate-500">Jadwal yang waktunya lewat</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pastCount}</p>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-7 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F9F91] flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#17324D]">Buat Jadwal Baru</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Jadwal langsung ditampilkan pada halaman Pendampingan setelah berhasil disimpan.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
          {canAssignCounselor && (
            <div className="space-y-1.5 max-w-xl">
              <label htmlFor="counselor" className="block text-xs font-bold text-slate-700">
                Guru BK Penanggung Jawab
              </label>
              <select
                id="counselor"
                value={counselorAdminId}
                onChange={(event) => setCounselorAdminId(event.target.value)}
                required
                disabled={counselors.length === 0}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#0F9F91] outline-none disabled:bg-slate-50"
              >
                {counselors.length === 0 ? (
                  <option value="">Belum ada Guru BK aktif</option>
                ) : (
                  counselors.map((counselor) => (
                    <option key={counselor.id} value={counselor.id}>{counselor.full_name}</option>
                  ))
                )}
              </select>
              <p className="text-[11px] text-slate-400">
                Hanya petugas dengan peran Guru BK yang aktif yang dapat menerima jadwal.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div className="space-y-1.5">
              <label htmlFor="startAt" className="block text-xs font-bold text-slate-700">Waktu Mulai</label>
              <input
                id="startAt"
                type="datetime-local"
                min={minDateTime}
                required
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0F9F91] outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="endAt" className="block text-xs font-bold text-slate-700">Waktu Selesai</label>
              <input
                id="endAt"
                type="datetime-local"
                min={startAt || minDateTime}
                required
                value={endAt}
                onChange={(event) => setEndAt(event.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0F9F91] outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-700">Metode Konseling</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              <button
                type="button"
                onClick={() => setSessionMode('offline')}
                aria-pressed={sessionMode === 'offline'}
                className={`p-4 rounded-2xl border text-left transition-colors ${sessionMode === 'offline' ? 'border-[#0F9F91] bg-[#CCFBF1]/40 ring-2 ring-[#0F9F91]/10' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <MapPin className="w-5 h-5 text-[#0F9F91] mb-2" />
                <span className="block text-sm font-bold text-[#17324D]">Tatap Muka</span>
                <span className="block text-xs text-slate-500 mt-0.5">Sesi di ruang BK atau lokasi sekolah</span>
              </button>
              <button
                type="button"
                onClick={() => setSessionMode('online')}
                aria-pressed={sessionMode === 'online'}
                className={`p-4 rounded-2xl border text-left transition-colors ${sessionMode === 'online' ? 'border-[#0F9F91] bg-[#CCFBF1]/40 ring-2 ring-[#0F9F91]/10' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <Video className="w-5 h-5 text-sky-600 mb-2" />
                <span className="block text-sm font-bold text-[#17324D]">Online</span>
                <span className="block text-xs text-slate-500 mt-0.5">Sesi menggunakan tautan pertemuan</span>
              </button>
            </div>
          </div>

          {sessionMode === 'offline' ? (
            <div className="space-y-1.5 max-w-2xl">
              <label htmlFor="location" className="block text-xs font-bold text-slate-700">Lokasi Sesi</label>
              <input
                id="location"
                type="text"
                maxLength={255}
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Contoh: Ruang Bimbingan Konseling, Gedung A Lantai 2"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0F9F91] outline-none"
              />
            </div>
          ) : (
            <div className="space-y-1.5 max-w-2xl">
              <label htmlFor="meetingLink" className="block text-xs font-bold text-slate-700">Tautan Pertemuan HTTPS</label>
              <input
                id="meetingLink"
                type="url"
                required
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0F9F91] outline-none"
              />
              <p className="text-[11px] text-slate-400">Pastikan tautan hanya dibagikan kepada siswa yang memiliki booking.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || (canAssignCounselor && counselors.length === 0)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-lg disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Menyimpan Jadwal...' : 'Simpan & Publikasikan'}
            </button>
            <span className="text-[11px] text-slate-400">
              Satu slot menerima satu booking. Jadwal tidak dapat dibuat pada waktu yang sudah terlewat atau bertabrakan.
            </span>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-[#17324D]">Daftar Jadwal Petugas</h2>
            <p className="text-xs text-slate-500 mt-1">Jadwal lama tetap tersimpan sebagai riwayat dan tidak ditawarkan kepada siswa.</p>
          </div>
          <a
            href="/pendampingan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F9F91] hover:underline"
          >
            Lihat halaman siswa
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">Memuat jadwal...</div>
          ) : slots.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <CalendarDays className="w-9 h-9 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-[#17324D]">Belum ada jadwal konseling</p>
              <p className="text-xs text-slate-500">Buat jadwal pertama melalui formulir di atas.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {slots.map((slot) => {
                const slotStatus = getSlotLabel(slot);
                return (
                  <article key={slot.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#17324D]">{slot.counselor_name}</span>
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${slotStatus.style}`}>
                          {slotStatus.label}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {slot.session_mode === 'offline' ? 'Tatap Muka' : 'Online'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-2">
                        <Clock3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDateTime(slot.start_at)} — {new Date(slot.end_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB</span>
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 break-all">
                        {slot.session_mode === 'offline' ? <MapPin className="w-3.5 h-3.5 shrink-0" /> : <Video className="w-3.5 h-3.5 shrink-0" />}
                        <span>{slot.session_mode === 'offline' ? slot.location : slot.meeting_link}</span>
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-400 shrink-0">
                      Dibuat {new Date(slot.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <p className="text-[11px] text-slate-400">
        Jadwal yang baru disimpan akan muncul pada halaman Pendampingan publik selama statusnya tersedia dan waktu mulainya belum lewat.
      </p>
    </div>
  );
};
