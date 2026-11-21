import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileCheck,
  FileText,
  FileUp,
  HelpCircle,
  Info,
  Lock,
  Search,
  Shield,
  Trash2,
  UploadCloud,
  User,
  UserX,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { ReportCategory } from '../../types/index.js';
import { ToastAlert } from '../../components/feedback/ToastAlert.js';

const reportFormSchema = z.object({
  category_id: z.string().min(1, 'Pilih salah satu kategori perundungan'),
  incident_date: z.string().min(1, 'Tanggal kejadian wajib diisi'),
  incident_location: z.string().min(3, 'Lokasi kejadian minimal 3 karakter'),
  chronology: z.string().min(10, 'Ceritakan kronologi minimal 10 karakter'),
  identity_mode: z.enum(['anonymous', 'identified']),
  reporter_name: z.string().optional().nullable(),
  reporter_contact: z.string().optional().nullable(),
  privacy_acknowledged: z.boolean().refine((val) => val === true, {
    message: 'Anda wajib menyetujui pernyataan kerahasiaan & komitmen data',
  }),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export const BuatLaporan: React.FC = () => {
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    tracking_code: string;
    created_at: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      category_id: '',
      incident_date: new Date().toISOString().split('T')[0],
      incident_location: '',
      chronology: '',
      identity_mode: 'anonymous',
      reporter_name: '',
      reporter_contact: '',
      privacy_acknowledged: false,
    },
    mode: 'onTouched',
  });

  const identityMode = watch('identity_mode');
  const watchedCategory = watch('category_id');
  const watchedDate = watch('incident_date');
  const watchedLocation = watch('incident_location');
  const watchedChronology = watch('chronology');
  const watchedName = watch('reporter_name');
  const watchedContact = watch('reporter_contact');

  // Load categories from Backend API
  useEffect(() => {
    apiClient
      .getCategories()
      .then((data) => {
        setCategories(data);
      })
      .catch((err) => {
        setSubmitError(`Gagal memuat kategori dari server: ${err.message}`);
      })
      .finally(() => {
        setLoadingCategories(false);
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    if (!allowedTypes.includes(file.type)) {
      setFileError('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file melebihi batas maksimal 5 MB.');
      return;
    }

    setEvidenceFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeEvidence = () => {
    setEvidenceFile(null);
    setFilePreview(null);
    setFileError(null);
  };

  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger(['category_id', 'incident_date', 'incident_location', 'chronology']);
    } else if (currentStep === 2) {
      isValid = await trigger(['identity_mode', 'reporter_name', 'reporter_contact']);
    } else if (currentStep === 3) {
      isValid = true; // Evidence is optional
    } else if (currentStep === 4) {
      isValid = await trigger(['privacy_acknowledged']);
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (values: ReportFormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('category_id', values.category_id);
      formData.append('incident_date', values.incident_date);
      formData.append('incident_location', values.incident_location);
      formData.append('chronology', values.chronology);
      formData.append('identity_mode', values.identity_mode);
      if (values.identity_mode === 'identified') {
        if (values.reporter_name) formData.append('reporter_name', values.reporter_name);
        if (values.reporter_contact) formData.append('reporter_contact', values.reporter_contact);
      }
      formData.append('privacy_acknowledged', String(values.privacy_acknowledged));

      if (evidenceFile) {
        formData.append('evidence', evidenceFile);
      }

      const res = await apiClient.submitReport(formData);
      setSuccessResult({
        tracking_code: res.tracking_code,
        created_at: res.created_at,
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kegagalan saat mengirimkan laporan ke server');
    } finally {
      setSubmitting(false);
    }
  };

  const copyTrackingCode = () => {
    if (successResult) {
      navigator.clipboard.writeText(successResult.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // SUCCESS STATE MODAL / VIEW
  if (successResult) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="rounded-3xl glass-panel p-8 sm:p-10 text-center space-y-6 shadow-2xl border border-white/80 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17324D]">
              Laporan Berhasil Diamankan
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Terima kasih atas keberanian Anda bersuara. Laporan Anda telah tersimpan dan masuk ke
              antrean verifikasi Tim Satgas Anti-Kekerasan Sekolah.
            </p>
          </div>

          {/* Tracking Code Display Box */}
          <div className="p-6 rounded-2xl bg-[#E0F2FE]/70 border-2 border-dashed border-[#0F9F91] space-y-3">
            <span className="text-xs font-bold text-[#0F9F91] uppercase tracking-wider">
              KODE PELACAKAN RAHASIA ANDA
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#17324D] tracking-wider selection:bg-[#0F9F91] selection:text-white">
                {successResult.tracking_code}
              </span>
              <button
                type="button"
                onClick={copyTrackingCode}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F9F91] border border-[#0F9F91]/30 shadow-xs hover:shadow transition-all"
                title="Salin Kode Pelacakan"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && (
              <p className="text-xs font-semibold text-emerald-600 animate-fadeIn">
                Kode berhasil disalin ke papan klip!
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>PENTING:</strong> Catat atau simpan kode di atas sekarang. Kode ini adalah
              satu-satunya kunci Anda untuk melacak status penanganan laporan ini secara anonim tanpa
              membuat akun.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/lacak"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-lg transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Lacak Laporan Ini</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-[#17324D] bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Form */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F9F91] border border-[#0F9F91]/20">
          <Lock className="w-3.5 h-3.5" />
          <span>Formulir Pelaporan Aman &amp; Terlindungi</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17324D]">Buat Laporan Kejadian</h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Setiap detail yang Anda bagikan membantu kami menciptakan lingkungan sekolah yang lebih
          aman. Anda memiliki kendali penuh atas identitas diri Anda.
        </p>
      </div>

      {submitError && (
        <ToastAlert
          type="error"
          title="Gagal Mengirimkan Laporan"
          message={submitError}
          onClose={() => setSubmitError(null)}
        />
      )}

      {/* Step Progress Bar */}
      <div className="rounded-2xl glass-panel p-4 flex items-center justify-between border border-white/60">
        {[
          { step: 1, label: 'Insiden' },
          { step: 2, label: 'Identitas' },
          { step: 3, label: 'Bukti' },
          { step: 4, label: 'Persetujuan' },
          { step: 5, label: 'Review' },
        ].map((item) => (
          <div key={item.step} className="flex-1 flex flex-col items-center relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === item.step
                  ? 'bg-[#0F9F91] text-white shadow-md shadow-[#0F9F91]/30 ring-4 ring-[#CCFBF1]'
                  : currentStep > item.step
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > item.step ? <Check className="w-4 h-4" /> : item.step}
            </div>
            <span
              className={`text-[11px] font-medium mt-1 hidden sm:block ${
                currentStep >= item.step ? 'text-[#17324D] font-bold' : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main Wizard Form Card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-3xl glass-panel p-6 sm:p-10 border border-white/70 shadow-xl space-y-8"
      >
        {/* STEP 1: INFORMASI KEJADIAN */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-[#17324D] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0F9F91]" />
                <span>Langkah 1: Informasi Kejadian</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Jelaskan apa yang terjadi, waktu peristiwa, dan lokasi insiden secara jelas.
              </p>
            </div>

            {/* Kategori */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#17324D]">
                Kategori Insiden <span className="text-rose-500">*</span>
              </label>
              {loadingCategories ? (
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
              ) : (
                <select
                  {...register('category_id')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-[#0F9F91] focus:border-transparent text-sm transition-all outline-hidden"
                >
                  <option value="">-- Pilih Jenis Pelanggaran / Perundungan --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.category_id && (
                <p className="text-xs text-rose-500 font-medium">{errors.category_id.message}</p>
              )}
            </div>

            {/* Tanggal & Lokasi (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#17324D]">
                  Tanggal Kejadian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('incident_date')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-[#0F9F91] focus:border-transparent text-sm transition-all outline-hidden"
                />
                {errors.incident_date && (
                  <p className="text-xs text-rose-500 font-medium">
                    {errors.incident_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#17324D]">
                  Lokasi Kejadian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kantin, Kelas 11-A, Lapangan, Grup WA"
                  {...register('incident_location')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-[#0F9F91] focus:border-transparent text-sm transition-all outline-hidden"
                />
                {errors.incident_location && (
                  <p className="text-xs text-rose-500 font-medium">
                    {errors.incident_location.message}
                  </p>
                )}
              </div>
            </div>

            {/* Kronologi */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#17324D]">
                Kronologi Kejadian <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Ceritakan runutan peristiwa yang terjadi secara detail. Apa kata-kata atau tindakan yang dilakukan? Apakah ada saksi lain di sekitar lokasi?"
                {...register('chronology')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-[#0F9F91] focus:border-transparent text-sm transition-all outline-hidden resize-y"
              ></textarea>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Minimal 10 karakter</span>
                <span>{watchedChronology?.length || 0}/5000 karakter</span>
              </div>
              {errors.chronology && (
                <p className="text-xs text-rose-500 font-medium">{errors.chronology.message}</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: INFORMASI PELAPOR (ANONIM VS TERIDENTIFIKASI) */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-[#17324D] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0F9F91]" />
                <span>Langkah 2: Opsi Identitas Pelapor</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tentukan apakah Anda ingin melapor secara anonim tanpa nama atau bersedia mencantumkan
                kontak untuk tindak lanjut langsung.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Anonymous */}
              <label
                className={`p-5 rounded-2xl border-2 flex flex-col cursor-pointer transition-all ${
                  identityMode === 'anonymous'
                    ? 'border-[#0F9F91] bg-[#CCFBF1]/30 shadow-md ring-2 ring-[#0F9F91]/20'
                    : 'border-slate-200 bg-white/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0F9F91] flex items-center justify-center">
                    <UserX className="w-5 h-5" />
                  </div>
                  <input
                    type="radio"
                    value="anonymous"
                    {...register('identity_mode')}
                    className="accent-[#0F9F91] w-4 h-4"
                  />
                </div>
                <h4 className="font-bold text-[#17324D] text-base mb-1">Anonim (Rahasia Penuh)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nama dan kontak Anda sama sekali tidak dicatat di sistem. Anda hanya memantau kasus
                  melalui kode unik pelacakan.
                </p>
              </label>

              {/* Option 2: Identified */}
              <label
                className={`p-5 rounded-2xl border-2 flex flex-col cursor-pointer transition-all ${
                  identityMode === 'identified'
                    ? 'border-[#0F9F91] bg-[#CCFBF1]/30 shadow-md ring-2 ring-[#0F9F91]/20'
                    : 'border-slate-200 bg-white/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F9F91] flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="radio"
                    value="identified"
                    {...register('identity_mode')}
                    className="accent-[#0F9F91] w-4 h-4"
                  />
                </div>
                <h4 className="font-bold text-[#17324D] text-base mb-1">Teridentifikasi</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cantumkan nama dan kontak agar Guru BK dapat menghubungi Anda langsung untuk
                  pendampingan psikologis empat mata.
                </p>
              </label>
            </div>

            {/* Inputs if Identified */}
            {identityMode === 'identified' && (
              <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-4 animate-fadeIn">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#17324D]">Nama Lengkap / Panggilan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rian (Kelas 10)"
                    {...register('reporter_name')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-hidden focus:ring-2 focus:ring-[#0F9F91]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#17324D]">Nomor Kontak / WhatsApp Aktif</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-3456-7890"
                    {...register('reporter_contact')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-hidden focus:ring-2 focus:ring-[#0F9F91]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: BUKTI LAMPIRAN OPSIONAL */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-[#17324D] flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#0F9F91]" />
                <span>Langkah 3: Lampiran Bukti Pendukung (Opsional)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Unggah tangkapan layar (screenshot), foto, atau dokumen pendukung. Format: JPG, PNG,
                WEBP, PDF (Maks. 5 MB).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
              <span>
                <strong>Catatan Demo Minggu 2:</strong> File divalidasi tipe dan ukurannya di server
                lokal. Pada Minggu 3, file akan diunggah ke private bucket Supabase Storage dengan
                Signed URL.
              </span>
            </div>

            {!evidenceFile ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-[#0F9F91] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-white/50 hover:bg-[#CCFBF1]/20 transition-all">
                <FileUp className="w-12 h-12 text-[#0F9F91] mb-3" />
                <span className="text-sm font-bold text-[#17324D]">Pilih atau Tarik File Bukti ke Sini</span>
                <span className="text-xs text-slate-500 mt-1">
                  Format gambar JPG, PNG, WEBP atau PDF (Maksimum 5 MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F9F91] flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-[#17324D] truncate">{evidenceFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB • {evidenceFile.type}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeEvidence}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Hapus Bukti"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {filePreview && (
                  <div className="mt-3 border rounded-xl overflow-hidden max-h-60 flex items-center justify-center bg-slate-50">
                    <img
                      src={filePreview}
                      alt="Preview Bukti"
                      className="max-h-60 object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {fileError && <p className="text-xs text-rose-500 font-medium">{fileError}</p>}
          </div>
        )}

        {/* STEP 4: PERSETUJUAN & KEBIJAKAN PRIVASI */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-[#17324D] flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#0F9F91]" />
                <span>Langkah 4: Persetujuan & Komitmen Kerahasiaan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kepatuhan hukum dan integritas data adalah prioritas ruang aman kita.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 border border-slate-200 space-y-4 text-xs text-slate-700 leading-relaxed">
              <h4 className="font-bold text-sm text-[#17324D]">Ketentuan Pelaporan:</h4>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Laporan disampaikan atas iktikad baik untuk mencari penyelesaian dan pemulihan,
                  bukan untuk memfitnah atau menyebarkan kebencian.
                </li>
                <li>
                  Data insiden dilindungi oleh Kode Etik Kerahasiaan Satgas dan Bimbingan Konseling
                  Sekolah.
                </li>
                <li>
                  Hak perlindungan korban dan saksi dijamin penuh dari segala bentuk ancaman
                  pembalasan.
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white/70 hover:bg-white cursor-pointer">
              <input
                type="checkbox"
                {...register('privacy_acknowledged')}
                className="accent-[#0F9F91] w-5 h-5 shrink-0 mt-0.5"
              />
              <span className="text-xs sm:text-sm text-slate-700">
                Saya menyatakan bahwa seluruh kronologi yang saya ceritakan adalah benar dan saya
                menyetujui ketentuan perlindungan privasi RUANGAMAN. <span className="text-rose-500">*</span>
              </span>
            </label>
            {errors.privacy_acknowledged && (
              <p className="text-xs text-rose-500 font-medium">
                {errors.privacy_acknowledged.message}
              </p>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW RINGKASAN SEBELUM MENGIRIM */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-[#17324D] flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#0F9F91]" />
                <span>Langkah 5: Tinjau Ringkasan Laporan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Periksa kembali data laporan Anda sebelum dikirimkan ke server.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/90 border border-slate-200 space-y-4 text-sm divide-y divide-slate-100">
              <div className="pb-3 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Kategori:</span>
                <span className="font-bold text-[#17324D]">
                  {categories.find((c) => c.id === watchedCategory)?.name || 'Kategori'}
                </span>
              </div>

              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tanggal & Lokasi:</span>
                <span className="font-semibold text-[#17324D]">
                  {watchedDate} • {watchedLocation}
                </span>
              </div>

              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Mode Identitas:</span>
                <span className="font-bold text-[#0F9F91]">
                  {identityMode === 'anonymous' ? 'Anonim (Rahasia Penuh)' : 'Teridentifikasi'}
                </span>
              </div>

              {identityMode === 'identified' && (
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Nama & Kontak:</span>
                  <span className="font-semibold text-[#17324D]">
                    {watchedName || '-'} ({watchedContact || '-'})
                  </span>
                </div>
              )}

              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Lampiran Bukti:</span>
                <span className="font-semibold text-slate-700">
                  {evidenceFile ? evidenceFile.name : 'Tidak ada lampiran'}
                </span>
              </div>

              <div className="pt-3 space-y-1">
                <span className="text-slate-500 font-medium block">Kronologi Singkat:</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl italic">
                  "{watchedChronology}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 bg-white hover:bg-slate-50 border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-[#0F9F91] hover:bg-[#0B7A6F] shadow-md shadow-[#0F9F91]/20"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-xl hover:shadow-[#0F9F91]/30 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Kirim Laporan Resmi</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
