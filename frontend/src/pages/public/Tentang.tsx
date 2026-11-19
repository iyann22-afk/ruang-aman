import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  FileText,
  Heart,
  Lock,
  Scale,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react';

export const Tentang: React.FC = () => {
  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* Header Banner */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F9F91] border border-[#0F9F91]/20">
          <Shield className="w-4 h-4 text-[#0F9F91]" />
          <span>Profil Platform & Visi Misi</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17324D] tracking-tight">
          Mengenal RUANGAMAN Lebih Dekat
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Mewujudkan ekosistem pendidikan yang merdeka dari kekerasan, aman dari perundungan, dan
          penuh dengan kepedulian antarsesama siswa.
        </p>
      </section>

      {/* Pengertian & Latar Belakang */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="p-8 rounded-3xl glass-panel space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0F9F91] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#17324D]">Apa itu RUANGAMAN?</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            RUANGAMAN adalah sistem informasi berbasis web terintegrasi yang berfungsi sebagai portal
            pelaporan aman, sarana edukasi literasi pencegahan perundungan (LMS mini), dan jembatan
            penjadwalan konseling ramah anak antara siswa dengan Guru Bimbingan Konseling (BK) serta
            Tim Pencegahan dan Penanganan Kekerasan (TPPK) satuan pendidikan.
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-panel space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#CCFBF1] text-[#0F9F91] flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#17324D]">Latar Belakang Regulasi</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Dikembangkan berlandaskan mandat Permendikbudristek No. 46 Tahun 2023 tentang Pencegahan
            dan Penanganan Kekerasan di Satuan Pendidikan. Kami menjawab fenomena ketakutan siswa
            untuk melapor (*fear of retaliation*) dengan menyediakan mekanisme pelaporan anonim
            tanpa mengorbankan kepastian tindak lanjut kasus.
          </p>
        </div>
      </section>

      {/* Tujuan & Manfaat */}
      <section className="p-8 sm:p-10 rounded-3xl glass-panel space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#17324D]">Tujuan & Manfaat Platform</h2>
          <p className="text-sm text-slate-600">
            Didesain untuk melayani kebutuhan korban, saksi, maupun pendidik secara seimbang.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/80 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F9F91] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#17324D] text-base">Pemulihan Psikologis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Memastikan korban mendapatkan pendampingan konseling kesehatan mental sedini mungkin
              untuk mencegah trauma berkepanjangan.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/80 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#17324D] text-base">Perlindungan Saksi & Korban</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menghilangkan hambatan psikologis pelapor dengan sistem kode pelacakan unik tanpa harus
              mengunggah identitas pribadi.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/80 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#17324D] text-base">Budaya Positif Sekolah</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Membangun komunitas sekolah yang suportif dan melatih siswa menjadi *upstander* yang
              berani menolak segala bentuk perundungan.
            </p>
          </div>
        </div>
      </section>

      {/* Komitmen Perlindungan Informasi */}
      <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#17324D] to-[#0A1B2D] text-white space-y-6 shadow-xl">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-7 h-7 text-[#0F9F91]" />
          <h2 className="text-2xl font-bold">Komitmen Kerahasiaan & Keamanan Informasi</h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          RUANGAMAN menerapkan prinsip <strong>Privacy by Design</strong>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F9F91] shrink-0 mt-0.5" />
            <span>Pilihan mode anonim murni: sistem tidak menyimpan nama dan kontak pelapor.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F9F91] shrink-0 mt-0.5" />
            <span>Kode pelacakan unik ber-entropi tinggi mencegah tebakan atau enumerasi pihak ketiga.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F9F91] shrink-0 mt-0.5" />
            <span>File lampiran bukti disimpan dalam storage privat terlindungi hak akses ketat.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F9F91] shrink-0 mt-0.5" />
            <span>Pelacakan publik tidak pernah menampilkan nama korban atau kronologi mentah.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
          <span className="text-xs text-slate-400">
            Punya informasi perundungan yang perlu ditangani segera?
          </span>
          <Link
            to="/lapor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-[#17324D] bg-[#CCFBF1] hover:bg-white transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Kirim Laporan Rahasia</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </section>
    </div>
  );
};
