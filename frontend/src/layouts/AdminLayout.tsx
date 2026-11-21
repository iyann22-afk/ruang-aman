import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Clock,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';
import { AdminProfile } from '../types/index.js';
import { apiClient } from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

// Konstanta waktu sesi idle 15 menit
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 menit
const WARNING_TIMEOUT_MS = 13 * 60 * 1000; // 13 menit (2 menit sebelum auto logout)
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // Heartbeat ke backend maksimal 1x / menit saat aktif

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { admin, isAdmin, loading, adminLoading, signOut, refreshAdmin } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(120);

  const lastHeartbeatRef = useRef<number>(Date.now());

  // 1. Inisialisasi dan pengawasan autentikasi admin
  useEffect(() => {
    if (loading || adminLoading) return;

    // Jika belum login atau bukan admin terverifikasi
    if (!isAdmin || !admin) {
      // Cek apakah ada demo token di localStorage
      const demoToken = localStorage.getItem('ruangaman_admin_token');
      if (!demoToken) {
        navigate('/admin/login', { replace: true });
        return;
      }
    }

    // Jika admin terdaftar tapi statusnya dinonaktifkan
    if (admin && !admin.is_active) {
      signOut().finally(() => {
        navigate('/admin/login?error=inactive', { replace: true });
      });
      return;
    }

    // Pastikan timestamp aktivitas awal tercatat
    if (!localStorage.getItem('ruangaman_admin_last_activity')) {
      localStorage.setItem('ruangaman_admin_last_activity', Date.now().toString());
    }
  }, [admin, isAdmin, loading, adminLoading, navigate, signOut]);

  // 2. Listener interaksi pengguna aktif (click, keydown, scroll, touch)
  // Tidak menganggap polling atau background timer sebagai aktivitas pengguna
  useEffect(() => {
    const handleUserActivity = () => {
      const now = Date.now();
      localStorage.setItem('ruangaman_admin_last_activity', now.toString());

      // Kirim heartbeat ke backend secara throttled (maksimal 1x per menit)
      if (now - lastHeartbeatRef.current > HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatRef.current = now;
        apiClient.sendHeartbeat().catch(() => {});
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, []);

  // 3. Timer pengawasan idle: Peringatan menit ke-13 dan Auto-Logout menit ke-15
  useEffect(() => {
    const checkIdleState = () => {
      const raw = localStorage.getItem('ruangaman_admin_last_activity');
      const lastActivity = raw ? parseInt(raw, 10) : Date.now();
      const now = Date.now();
      const elapsed = now - lastActivity;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        // Menit ke-15 idle tercapai -> auto logout
        setShowWarningModal(false);
        handleIdleLogout();
      } else if (elapsed >= WARNING_TIMEOUT_MS) {
        // Menit ke-13 tercapai -> tampilkan modal peringatan dengan sisa detik
        const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setCountdownSeconds(remaining);
        setShowWarningModal(true);
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    };

    const timer = setInterval(checkIdleState, 1000);
    return () => clearInterval(timer);
  }, [showWarningModal]);

  // 4. Sinkronisasi lintas tab browser (StorageEvent)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ruangaman_admin_last_activity' && e.newValue) {
        const last = parseInt(e.newValue, 10);
        const elapsed = Date.now() - last;
        if (elapsed < WARNING_TIMEOUT_MS) {
          setShowWarningModal(false);
        }
      }
      if (e.key === 'ruangaman_admin_token' && e.newValue === null && !isAdmin) {
        navigate('/admin/login', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate, isAdmin]);

  // Handler auto-logout karena idle
  const handleIdleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
    navigate('/admin/login?error=idle_timeout', { replace: true });
  };

  // Handler tombol "Tetap Masuk" pada modal peringatan
  const handleStayLoggedIn = () => {
    const now = Date.now();
    localStorage.setItem('ruangaman_admin_last_activity', now.toString());
    lastHeartbeatRef.current = now;
    setShowWarningModal(false);
    apiClient.sendHeartbeat().catch(() => {});
  };

  // Handler logout manual
  const handleLogout = async () => {
    try {
      const res = await signOut();
      if (res && !res.serverRevoked) {
        navigate('/admin/login?warning=revoke_failed');
      } else {
        navigate('/admin/login?notice=logged_out');
      }
    } catch {
      navigate('/admin/login?warning=revoke_failed');
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'case_manager':
        return 'Case Manager';
      case 'counselor':
        return 'Guru BK';
      default:
        return role || 'Petugas';
    }
  };

  // Menu navigasi dinamis berdasarkan role
  const menuItems = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Daftar Laporan', to: '/admin/laporan', icon: FileSpreadsheet },
    ...(admin?.role !== 'counselor'
      ? [{ name: 'Riwayat Status', to: '/admin/riwayat-status', icon: History }]
      : []),
    ...(admin?.role === 'super_admin'
      ? [{ name: 'Manajemen Petugas', to: '/admin/petugas', icon: Shield }]
      : []),
    { name: 'Profil Petugas', to: '/admin/profil', icon: User },
  ];

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0F9F91] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Memverifikasi Hak Akses Petugas...</p>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  const formattedCountdown = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="min-h-screen flex bg-slate-100/80 text-[#17324D] relative">
      {/* === MODAL PERINGATAN IDLE TIMEOUT 13 MENIT === */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Sesi Anda Hampir Berakhir
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Demi melindungi kerahasiaan data laporan korban, sesi akan ditutup otomatis karena tidak ada aktivitas selama 15 menit.
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="py-3 px-6 rounded-2xl bg-slate-800 border border-slate-700/80 inline-block">
              <span className="text-xs text-slate-400 block mb-1">Waktu tersisa sebelum logout:</span>
              <span className="text-3xl font-mono font-black text-amber-400">
                {formattedCountdown}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleStayLoggedIn}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-lg hover:shadow-[#0F9F91]/25 transition-all"
              >
                Tetap Masuk
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-3 px-4 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Keluar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#17324D] text-white border-r border-slate-700/50 shadow-xl shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <img
            src="/images/logo-ruangaman.svg"
            alt="Logo RUANGAMAN"
            className="w-10 h-10 drop-shadow-sm"
          />
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              RUANG<span className="text-[#0F9F91]">AMAN</span>
            </span>
            <span className="block text-[10px] font-semibold tracking-wider text-emerald-300 uppercase">
              Panel Satgas &amp; BK
            </span>
          </div>
        </div>

        {/* Demo Notice Banner — hanya jika demo auth lokal aktif */}
        {localStorage.getItem('ruangaman_admin_token') && (
          <div className="mx-4 mt-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>SESI DEMO LOKAL</strong>
              <br />
              Menggunakan autentikasi demo non-produksi.
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0F9F91] text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Admin User & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-[#0F9F91]">
              {admin?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate">{admin?.full_name}</p>
              <p className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
                {getRoleLabel(admin?.role)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Situs Publik</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
              title="Keluar Sesi Petugas"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 glass-panel border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white border border-slate-200 text-[#17324D]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-[#17324D] hidden sm:block">
              Sistem Manajemen Kasus &amp; Pemulihan
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Activity className="w-3.5 h-3.5" />
              <span>Sesi Aman Aktif</span>
            </span>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-xs font-semibold text-[#17324D] hidden md:inline">
                {admin?.full_name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-[#17324D]">
                {getRoleLabel(admin?.role)}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-full bg-[#17324D] text-white flex flex-col h-full z-10 p-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="font-bold text-lg">Menu Petugas</span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                          isActive
                            ? 'bg-[#0F9F91] text-white font-semibold'
                            : 'text-slate-300 hover:bg-white/10'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-white/10 space-y-2">
                <Link
                  to="/"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 text-xs text-slate-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Website Publik</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-600 text-xs font-semibold text-white"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Sesi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
