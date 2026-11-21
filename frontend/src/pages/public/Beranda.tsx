import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  FileText,
  Lock,
  MessageSquare,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { LottieHero } from '../../components/animations/LottieHero.js';
import { TiltCard } from '../../components/animations/TiltCard.js';

export const Beranda: React.FC = () => {
  return (
    <div className="space-y-16 md:space-y-24">
      {/* 1. Hero Greeting Banner */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-10 lg:p-12 border border-white/60 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F9F91] border border-[#0F9F91]/20">
              <ShieldCheck className="w-4 h-4 text-[#0F9F91]" />
              <span>Safe Space Digital Ramah Siswa</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17324D] tracking-tight leading-tight">
              Selamat Datang di <span className="text-[#0F9F91]">RUANGAMAN</span>. Suara Anda Terlindungi.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Platform resmi pelaporan dan pendampingan kasus perundungan serta kekerasan di
              lingkungan pendidikan. Anda dapat melapor secara <strong>100% Anonim</strong> tanpa
              takut akan intimidasi atau balas dendam.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/lapor"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-xl hover:shadow-[#0F9F91]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all focus:outline-hidden"
              >
                <FileText className="w-5 h-5" />
                <span>Buat Laporan Sekarang</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                to="/lacak"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-base text-[#17324D] bg-white/80 hover:bg-white border border-slate-200 hover:border-[#0F9F91]/40 shadow-xs hover:shadow-md transition-all focus:outline-hidden"
              >
                <Search className="w-5 h-5 text-[#0F9F91]" />
                <span>Lacak Status Laporan</span>
              </Link>
            </div>

            {/* Micro Privacy Assurance */}
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0F9F91]" />
                Kode Rahasia Unik
              </span>
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#0F9F91]" />
                Opsi Tanpa Nama (Anonim)
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#0F9F91]" />
                Didampingi Guru BK
              </span>
            </div>
          </div>

          {/* Right Lottie Animation */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <LottieHero className="w-full max-w-sm" />
          </div>
        </div>
      </section>

      {/* 2. Empat Kartu Utama Beranda dengan VanillaTilt.js (Section 7.5) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#17324D]">
            Empat Layanan Perlindungan Terpadu
          </h2>
          <p className="text-sm text-slate-600">
            Akses langsung ke seluruh fitur perlindungan siswa dengan interaksi responsif
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Lapor Cepat (Anonim) */}
          <TiltCard className="h-full">
            <Link
              to="/lapor"
              className="flex flex-col h-full p-6 rounded-2xl glass-card group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center mb-5 shadow-md shadow-rose-500/20 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#17324D] mb-2 group-hover:text-[#0F9F91] transition-colors">
                Lapor Cepat (Anonim)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1 mb-4">
                Kirimkan kronologi insiden perundungan atau kekerasan secara rahasia tanpa perlu
                mendaftarkan akun identitas diri.
              </p>
              <div className="inline-flex items-center text-xs font-bold text-[#0F9F91] group-hover:translate-x-1 transition-transform">
                <span>Isi Formulir Laporan</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          </TiltCard>

          {/* Card 2: Jadwal Konseling BK */}
          <TiltCard className="h-full">
            <Link
              to="/pendampingan"
              className="flex flex-col h-full p-6 rounded-2xl glass-card group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F9F91] to-[#0B7A6F] text-white flex items-center justify-center mb-5 shadow-md shadow-[#0F9F91]/20 group-hover:scale-110 transition-transform">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#17324D] mb-2 group-hover:text-[#0F9F91] transition-colors">
                Jadwal Konseling BK
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1 mb-4">
                Pilih sesi konsultasi empat mata dengan konselor dan Guru BK sekolah secara tatap
                muka atau daring yang menjamin kerahasiaan.
              </p>
              <div className="inline-flex items-center text-xs font-bold text-[#0F9F91] group-hover:translate-x-1 transition-transform">
                <span>Reservasi Jadwal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          </TiltCard>

          {/* Card 3: Materi Edukasi (LMS) */}
          <TiltCard className="h-full">
            <Link
              to="/edukasi"
              className="flex flex-col h-full p-6 rounded-2xl glass-card group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center mb-5 shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#17324D] mb-2 group-hover:text-[#0F9F91] transition-colors">
                Materi Edukasi (LMS)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1 mb-4">
                Pelajari definisi, bentuk-bentuk cyberbullying, bahaya jejak digital, serta panduan
                menjadi upstander yang berani membela teman.
              </p>
              <div className="inline-flex items-center text-xs font-bold text-[#0F9F91] group-hover:translate-x-1 transition-transform">
                <span>Buka Modul Edukasi</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          </TiltCard>

          {/* Card 4: Status Laporan */}
          <TiltCard className="h-full">
            <Link
              to="/lacak"
              className="flex flex-col h-full p-6 rounded-2xl glass-card group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center mb-5 shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#17324D] mb-2 group-hover:text-[#0F9F91] transition-colors">
                Status Laporan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1 mb-4">
                Pantau proses verifikasi dan tindak lanjut kasus Anda secara real-time hanya dengan
                memasukkan kode tracking unik.
              </p>
              <div className="inline-flex items-center text-xs font-bold text-[#0F9F91] group-hover:translate-x-1 transition-transform">
                <span>Periksa Progres Laporan</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          </TiltCard>
        </div>
      </section>

      {/* 3. Cara Kerja Aplikasi RUANGAMAN */}
      <section className="rounded-3xl glass-panel p-8 sm:p-12 border border-white/60 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#0F9F91] uppercase tracking-wider">
            Alur Penanganan Transparan
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#17324D]">
            Bagaimana RUANGAMAN Bekerja?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Empat langkah mudah dan terlindungi mulai dari pelaporan hingga tuntasnya mediasi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="relative p-6 rounded-2xl bg-white/70 border border-white/80 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0F9F91] font-extrabold text-sm flex items-center justify-center">
              1
            </span>
            <h4 className="font-bold text-[#17324D] text-base">Tulis Laporan</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih kategori kejadian, ceritakan kronologi secara jujur, dan pilih mode Anonim jika
              Anda ingin identitas disamarkan.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-2xl bg-white/70 border border-white/80 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-full bg-[#CCFBF1] text-[#0F9F91] font-extrabold text-sm flex items-center justify-center">
              2
            </span>
            <h4 className="font-bold text-[#17324D] text-base">Dapatkan Kode Tracking</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem akan menghasilkan kode pelacakan acak unik ber-entropi tinggi (misal:
              RA-2026-F9X2K1). Simpan kode ini secara privat.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-2xl bg-white/70 border border-white/80 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0F9F91] font-extrabold text-sm flex items-center justify-center">
              3
            </span>
            <h4 className="font-bold text-[#17324D] text-base">Telaah Satgas & Konselor</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tim Satgas Sekolah dan Guru BK menelaah bukti laporan, memeriksa lokasi, dan
              merumuskan langkah perlindungan terbaik.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative p-6 rounded-2xl bg-white/70 border border-white/80 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-full bg-[#CCFBF1] text-[#0F9F91] font-extrabold text-sm flex items-center justify-center">
              4
            </span>
            <h4 className="font-bold text-[#17324D] text-base">Tindak Lanjut & Pemulihan</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sesi konseling pemulihan psikologis korban dilaksanakan, serta mediasi tertutup bagi
              pelaku demi menciptakan keadilan restoratif.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Komitmen Kerahasiaan & Privasi */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass-card space-y-3 border-l-4 border-l-[#0F9F91]">
          <div className="flex items-center gap-2 text-[#0F9F91] font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Kerahasiaan Tertinggi</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Data laporan Anda hanya dibuka di hadapan petugas Satgas Anti-Kekerasan dan Guru BK yang
            terikat sumpah kode etik kerahasiaan bimbingan konseling.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-card space-y-3 border-l-4 border-l-sky-500">
          <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            <span>Bebas Intimidasi Balasan</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pelapor dilindungi oleh SOP Perlindungan Korban & Saksi Sekolah. Pihak sekolah
            berkewajiban menjamin tidak adanya sanksi atau perlakuan diskriminatif.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-card space-y-3 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
            <MessageSquare className="w-5 h-5" />
            <span>Pendampingan Empatik</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Kami tidak hanya menyelesaikan perselisihan, melainkan mendampingi pemulihan trauma
            mental korban hingga rasa percaya diri di sekolah kembali pulih.
          </p>
        </div>
      </section>
    </div>
  );
};
