import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  HeartHandshake,
  HelpCircle,
  Home,
  Lock,
  LogOut,
  Menu,
  PhoneCall,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react';
import { ParticlesBackground } from '../components/animations/ParticlesBackground.js';
import { useAuth } from '../contexts/AuthContext.js';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading, adminLoading, isAdmin, admin, signInWithGoogle, signOut } = useAuth();
  const isOfficer = !adminLoading && isAdmin && Boolean(admin?.is_active);
  const portalPath = isOfficer ? '/admin/dashboard' : '/admin/login';

  const navLinks = [
    { name: 'Beranda', to: '/', icon: Home },
    { name: 'Tentang', to: '/tentang', icon: HelpCircle },
    { name: 'Buat Laporan', to: '/lapor', icon: FileText, highlight: true },
    { name: 'Lacak Laporan', to: '/lacak', icon: Search },
    { name: 'Edukasi', to: '/edukasi', icon: BookOpen },
    { name: 'Pendampingan', to: '/pendampingan', icon: HeartHandshake },
  ];

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Animated CSS Mesh Gradient Background */}
      <div className="mesh-gradient-bg" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1"></div>
        <div className="mesh-blob mesh-blob-2"></div>
        <div className="mesh-blob mesh-blob-3"></div>
      </div>

      {/* Floating tsParticles Canvas */}
      <ParticlesBackground />

      {/* Top Emergency Quick Helpline Notification */}
      <div className="bg-[#17324D] text-white text-xs py-2 px-4 border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-medium text-slate-200">
              Butuh pertolongan darurat atau pendampingan cepat?
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:129"
              className="inline-flex items-center gap-1.5 font-semibold text-[#CCFBF1] hover:underline"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Hotline SAPA 129</span>
            </a>
            <span className="text-slate-400">|</span>
            <Link
              to={portalPath}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>{isOfficer ? 'Dashboard Petugas' : 'Portal Petugas'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-hidden">
            <img
              src="/images/logo-ruangaman.svg"
              alt="Logo RUANGAMAN"
              className="w-11 h-11 group-hover:scale-105 transition-transform drop-shadow-sm"
            />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#17324D]">
                RUANG<span className="text-[#0F9F91]">AMAN</span>
              </span>
              <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase -mt-1">
                Perlindungan & Safe Space Siswa
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              if (link.highlight) {
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="ml-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-lg hover:shadow-[#0F9F91]/25 hover:-translate-y-0.5 active:translate-y-0 transition-all focus:outline-hidden"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#0F9F91] bg-[#CCFBF1]/40 font-semibold'
                        : 'text-[#17324D]/80 hover:text-[#0F9F91] hover:bg-white/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Google Auth Button — Desktop */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || 'Pengguna'}
                      className="w-8 h-8 rounded-full border-2 border-[#0F9F91] object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                      <User className="w-4 h-4 text-[#0F9F91]" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-[#17324D] max-w-[120px] truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={signOut}
                    title="Keluar"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white/80 hover:bg-white text-[#17324D] hover:shadow-sm transition-all"
                >
                  {/* Google icon */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Masuk dengan Google
                </button>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/70 hover:bg-white text-[#17324D] border border-slate-200 focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-t border-white/40 px-4 pt-3 pb-6 animate-fadeIn">
            <div className="space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                        link.highlight
                          ? 'bg-[#0F9F91] text-white font-semibold shadow-md'
                          : isActive
                          ? 'bg-[#CCFBF1]/50 text-[#0F9F91] font-semibold'
                          : 'text-[#17324D] hover:bg-white/60'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.name}</span>
                  </NavLink>
                );
              })}
              <div className="pt-3 border-t border-slate-200/60 mt-3">
                <Link
                  to={portalPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/60"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>{isOfficer ? 'Dashboard Petugas' : 'Masuk Portal Petugas Satgas'}</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Outlet />
      </main>

      {/* Empathetic Safe Space Footer */}
      <footer className="mt-auto glass-panel border-t border-white/50 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1: Brand & Commitment */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo-ruangaman.svg"
                  alt="Logo RUANGAMAN"
                  className="w-9 h-9 drop-shadow-xs"
                />
                <span className="text-xl font-bold text-[#17324D]">
                  RUANG<span className="text-[#0F9F91]">AMAN</span>
                </span>
              </div>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                Platform aman digital terintegrasi untuk pencegahan, pelaporan rahasia, dan
                pendampingan psikologis kasus kekerasan serta perundungan di lingkungan sekolah.
                Kami menjunjung tinggi prinsip kerahasiaan dan perlindungan hak anak.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#0F9F91] font-semibold">
                <Shield className="w-4 h-4" />
                <span>Sesuai Permendikbudristek No. 46 Tahun 2023</span>
              </div>
            </div>

            {/* Col 2: Akses Cepat */}
            <div>
              <h4 className="text-sm font-bold text-[#17324D] uppercase tracking-wider mb-3">
                Layanan Utama
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link to="/lapor" className="hover:text-[#0F9F91] transition-colors">
                    Form Pelaporan Anonim
                  </Link>
                </li>
                <li>
                  <Link to="/lacak" className="hover:text-[#0F9F91] transition-colors">
                    Lacak Status Laporan
                  </Link>
                </li>
                <li>
                  <Link to="/edukasi" className="hover:text-[#0F9F91] transition-colors">
                    Modul LMS Edukasi Bullying
                  </Link>
                </li>
                <li>
                  <Link to="/pendampingan" className="hover:text-[#0F9F91] transition-colors">
                    Jadwal Konseling Guru BK
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Bantuan Darurat */}
            <div>
              <h4 className="text-sm font-bold text-[#17324D] uppercase tracking-wider mb-3">
                Kontak Krisis 24 Jam
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#0F9F91]" />
                  <span>SAPA 129 (KemenPPPA)</span>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#0F9F91]" />
                  <span>TEPSA 1500771 (Kemensos)</span>
                </li>
                <li className="text-xs text-slate-500 pt-1">
                  Semua panggilan bebas pulsa dan ditangani konselor tersumpah.
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 RUANGAMAN — Dilindungi oleh Komitmen Kerahasiaan Pendidikan Nasional.</p>
            <div className="flex gap-6">
              <Link to="/tentang" className="hover:text-[#0F9F91]">Kebijakan Privasi</Link>
              <Link to="/tentang" className="hover:text-[#0F9F91]">Ketentuan Layanan</Link>
              <Link to={portalPath} className="hover:text-[#0F9F91]">
                {isOfficer ? 'Dashboard Petugas' : 'Portal Admin'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
