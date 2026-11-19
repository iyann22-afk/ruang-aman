import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
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

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ruangaman_admin_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // Load admin profile
    apiClient
      .getAdminProfile()
      .then((profile) => {
        setAdmin(profile);
      })
      .catch(() => {
        // Token invalid or expired
        localStorage.removeItem('ruangaman_admin_token');
        navigate('/admin/login', { replace: true });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('ruangaman_admin_token');
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Daftar Laporan', to: '/admin/laporan', icon: FileSpreadsheet },
    { name: 'Riwayat Status', to: '/admin/riwayat-status', icon: History },
    { name: 'Profil Petugas', to: '/admin/profil', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0F9F91] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Memverifikasi Sesi Petugas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100/80 text-[#17324D]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#17324D] text-white border-r border-slate-700/50 shadow-xl shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F9F91] flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              RUANG<span className="text-[#0F9F91]">AMAN</span>
            </span>
            <span className="block text-[10px] font-semibold tracking-wider text-emerald-300 uppercase">
              Panel Satgas & BK
            </span>
          </div>
        </div>

        {/* Demo Notice Banner */}
        <div className="mx-4 mt-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>MODE DEMO MINGGU 2</strong>
            <br />
            Data disimpan di Mock Repository memori lokal.
          </span>
        </div>

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
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{admin?.role}</p>
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
              title="Logout"
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
              Sistem Manajemen Kasus & Pemulihan
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Activity className="w-3.5 h-3.5" />
              <span>Backend REST API Aktif</span>
            </span>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-xs font-semibold text-[#17324D] hidden md:inline">
                {admin?.full_name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-[#17324D]">
                {admin?.role}
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
