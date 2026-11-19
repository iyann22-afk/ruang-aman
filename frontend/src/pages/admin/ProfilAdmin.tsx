import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { AdminProfile } from '../../types/index.js';

export const ProfilAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getAdminProfile()
      .then((data) => setProfile(data))
      .catch((err) => console.error('Failed to get profile', err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ruangaman_admin_token');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="h-64 bg-white rounded-2xl animate-pulse border border-slate-200"></div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#17324D] tracking-tight">Profil Petugas Satgas</h1>
        <p className="text-xs text-slate-500 mt-1">
          Informasi kredensial wewenang penanganan kekerasan dan perlindungan siswa.
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-8">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F9F91] to-[#17324D] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-[#0F9F91]/20">
            {profile?.full_name?.charAt(0) || 'A'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#17324D]">{profile?.full_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Akun Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{profile?.email}</span>
            </p>
            <p className="text-xs font-semibold text-[#0F9F91] uppercase tracking-wider pt-0.5">
              Role Wewenang: {profile?.role}
            </p>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#17324D] uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0F9F91]" />
            <span>Hak Akses Terverifikasi Sistem</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {profile?.permissions?.map((perm) => (
              <div
                key={perm}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-slate-700 font-medium font-mono"
              >
                <CheckCircle2 className="w-4 h-4 text-[#0F9F91] shrink-0" />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notice on Role Transition */}
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-800 space-y-1">
          <p className="font-bold">Persiapan Integrasi Supabase Auth (Minggu 3):</p>
          <p className="leading-relaxed">
            Pada Minggu 3, akun ini akan terhubung langsung dengan Supabase Auth & Row Level Security
            (RLS). Password demo dan token sesi akan digantikan oleh JWT Supabase Session.
          </p>
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi Petugas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
