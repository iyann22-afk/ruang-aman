import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  HeartHandshake,
  MapPin,
  PhoneCall,
  Shield,
  ShieldAlert,
  User,
  Video,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { CounselingBookingResult, CounselingSlot, SupportResource } from '../../types/index.js';
import { ToastAlert } from '../../components/feedback/ToastAlert.js';

const bookingSchema = z.object({
  slot_id: z.string().min(1, 'Pilih jadwal sesi konseling yang tersedia'),
  student_name: z.string().min(2, 'Nama minimal 2 karakter'),
  contact_method: z.enum(['whatsapp', 'email', 'telegram']),
  contact_value: z.string().min(3, 'Kontak minimal 3 karakter'),
  privacy_acknowledged: z.boolean().refine((v) => v === true, {
    message: 'Wajib menyetujui komitmen privasi konseling',
  }),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export const Pendampingan: React.FC = () => {
  const [slots, setSlots] = useState<CounselingSlot[]>([]);
  const [resources, setResources] = useState<SupportResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<CounselingBookingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      slot_id: '',
      student_name: '',
      contact_method: 'whatsapp',
      contact_value: '',
      privacy_acknowledged: false,
    },
  });

  const selectedSlotId = watch('slot_id');

  useEffect(() => {
    Promise.all([apiClient.getCounselingSlots(), apiClient.getSupportResources()])
      .then(([slotsData, resourcesData]) => {
        setSlots(slotsData);
        setResources(resourcesData);
      })
      .catch((err) => {
        console.error('Error fetching counseling data', err);
        setErrorMessage('Gagal memuat jadwal dari server.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const onBookingSubmit = async (values: BookingFormValues) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.bookCounselingSlot(values);
      setBookingResult(res);
      reset();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengajukan jadwal konseling.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F9F91] border border-[#0F9F91]/20">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Layanan Pemulihan & Konseling Ramah Siswa</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17324D]">
          Pendampingan Psikologis & Dukungan
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Anda tidak harus memendam beban ini sendirian. Guru Bimbingan Konseling dan jejaring
          krisis anak siap mendengar dan mendampingi pemulihan Anda.
        </p>
      </div>

      {/* Simulation Warning Banner (Section 7.12) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-bold uppercase tracking-wider block mb-0.5">
            DATA SIMULASI (MINGGU 2 DEVELOPMENT)
          </strong>
          Jadwal konseling dan nama konselor pada halaman ini disediakan sebagai simulasi pengujian
          alur aplikasi di lingkungan lokal. Booking yang dibuat akan menghasilkan kode simulasi.
        </div>
      </div>

      {errorMessage && (
        <ToastAlert
          type="error"
          title="Kesalahan"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* SUCCESS BOOKING CARD */}
      {bookingResult && (
        <div className="p-8 rounded-3xl glass-panel border border-emerald-300 shadow-xl space-y-4 animate-fadeIn bg-emerald-50/60">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            <div>
              <h3 className="text-xl font-bold">Jadwal Konseling Berhasil Didaftarkan!</h3>
              <span className="text-xs font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                STATUS: DATA SIMULASI TERKONFIRMASI
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
            <div className="p-4 rounded-xl bg-white border border-emerald-200">
              <span className="text-xs text-slate-400 block font-medium">KODE BOOKING SIMULASI</span>
              <span className="font-mono text-xl font-extrabold text-[#17324D]">
                {bookingResult.booking_code}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-emerald-200">
              <span className="text-xs text-slate-400 block font-medium">MODE PERTEMUAN</span>
              <span className="font-bold text-[#17324D] capitalize">
                {bookingResult.session_mode === 'offline' ? 'Tatap Muka di Ruang BK' : 'Daring (Google Meet)'}
              </span>
            </div>
          </div>

          {bookingResult.meeting_link && (
            <a
              href={bookingResult.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors"
            >
              <Video className="w-4 h-4" />
              Buka tautan sesi online
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <p className="text-xs text-slate-600">
            Catat kode booking Anda di atas. Tautan online hanya diberikan setelah booking berhasil.
            Petugas Guru BK akan mengonfirmasi jadwal ini secara tertutup.
          </p>

          <button
            type="button"
            onClick={() => setBookingResult(null)}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Tutup Notifikasi
          </button>
        </div>
      )}

      {/* Section 1: Formulir Pengajuan Jadwal Konseling BK */}
      <section className="p-6 sm:p-10 rounded-3xl glass-panel border border-white/70 shadow-lg space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[#17324D] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#0F9F91]" />
            <span>Pilih Jadwal Konseling Guru BK</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sesi konsultasi empat mata yang terjamin kerahasiaannya.
          </p>
        </div>

        <form onSubmit={handleSubmit(onBookingSubmit)} className="space-y-6">
          {/* Slot Selection Radio Grid */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#17324D]">
              Sesi Waktu yang Tersedia <span className="text-rose-500">*</span>
            </label>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                Tidak ada slot jadwal terbuka saat ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {slots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  const startDate = new Date(slot.start_at);

                  return (
                    <label
                      key={slot.id}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0F9F91] bg-[#CCFBF1]/30 shadow-md ring-2 ring-[#0F9F91]/20'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {slot.session_mode === 'offline' ? (
                            <MapPin className="w-4 h-4 text-[#0F9F91]" />
                          ) : (
                            <Video className="w-4 h-4 text-sky-500" />
                          )}
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {slot.session_mode === 'offline' ? 'Tatap Muka' : 'Sesi Online'}
                          </span>
                        </div>
                        <input
                          type="radio"
                          value={slot.id}
                          {...register('slot_id')}
                          className="accent-[#0F9F91] w-4 h-4"
                        />
                      </div>

                      <div className="my-2">
                        <p className="text-sm font-extrabold text-[#17324D]">
                          {startDate.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {startDate.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            WIB
                          </span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate">{slot.counselor_name}</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Tersedia
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            {errors.slot_id && (
              <p className="text-xs text-rose-500 font-medium">{errors.slot_id.message}</p>
            )}
          </div>

          {/* Student Name & Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#17324D]">
                Nama / Inisial Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Siswa Kelas 11-B"
                {...register('student_name')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0F9F91] outline-hidden bg-white/90"
              />
              {errors.student_name && (
                <p className="text-xs text-rose-500 font-medium">{errors.student_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#17324D]">
                Pilihan Kontak & No. Handphone <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  {...register('contact_method')}
                  className="px-3 py-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white/90 focus:ring-2 focus:ring-[#0F9F91] outline-hidden"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="telegram">Telegram</option>
                </select>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  {...register('contact_value')}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0F9F91] outline-hidden bg-white/90"
                />
              </div>
              {errors.contact_value && (
                <p className="text-xs text-rose-500 font-medium">{errors.contact_value.message}</p>
              )}
            </div>
          </div>

          {/* Privacy Ack */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white/60 cursor-pointer">
            <input
              type="checkbox"
              {...register('privacy_acknowledged')}
              className="accent-[#0F9F91] w-5 h-5 shrink-0 mt-0.5"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              Saya memahami bahwa ini adalah sesi konseling yang dilindungi kode etik kerahasiaan
              sekolah dan informasi hanya diakses oleh konselor bertugas.
            </span>
          </label>
          {errors.privacy_acknowledged && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.privacy_acknowledged.message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {submitting ? 'Memproses Reservasi...' : 'Ajukan Jadwal Konseling'}
          </button>
        </form>
      </section>

      {/* Section 2: Lembaga Pendukung & Hotline Krisis Eksternal */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#17324D] flex items-center gap-2">
            <Building className="w-6 h-6 text-[#0F9F91]" />
            <span>Lembaga Bantuan & Kontak Darurat Eksternal</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rujukan resmi instansi perlindungan anak nasional yang siap sedia membantu kasus berat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl glass-card border border-white/80 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {item.resource_type}
                </span>
                <h3 className="text-lg font-bold text-[#17324D]">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                {item.phone && (
                  <div className="flex items-center gap-2 text-[#0F9F91] font-bold">
                    <PhoneCall className="w-4 h-4" />
                    <span>{item.phone}</span>
                  </div>
                )}
                {item.operating_hours && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>{item.operating_hours}</span>
                  </div>
                )}
                {item.website_url && (
                  <a
                    href={item.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sky-600 hover:underline pt-1"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Situs Web Resmi</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
