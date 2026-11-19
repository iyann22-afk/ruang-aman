import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { ToastAlert } from '../../components/feedback/ToastAlert.js';

export const LoginAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@ruangaman.id');
  const [password, setPassword] = useState('PasswordDemo123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.adminLogin(email, password);
      localStorage.setItem('ruangaman_admin_token', res.token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('PasswordDemo123!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#0F9F91]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <img
          src="/images/logo-ruangaman.svg"
          alt="Logo RUANGAMAN"
          className="w-16 h-16 mx-auto drop-shadow-md"
        />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Portal Petugas Satgas & BK
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Akses terbatas untuk penanganan kasus perundungan dan kekerasan sekolah.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-slate-700/80 shadow-2xl space-y-6">
          {error && (
            <ToastAlert
              type="error"
              title="Akses Gagal"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          {/* Demo Credentials Quick Switcher */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>AKUN DEMO MINGGU 2 (Klik untuk Isi Cepat):</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setDemoAccount('admin@ruangaman.id')}
                className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
              >
                <span>admin@ruangaman.id</span>
                <span className="text-[10px] font-bold text-[#0F9F91]">Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('casemanager@ruangaman.id')}
                className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
              >
                <span>casemanager@ruangaman.id</span>
                <span className="text-[10px] font-bold text-sky-400">Case Manager</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('counselor@ruangaman.id')}
                className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
              >
                <span>counselor@ruangaman.id</span>
                <span className="text-[10px] font-bold text-purple-400">Guru BK</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-300/80 pt-1">
              Password default demo: <code className="font-mono bg-black/30 px-1 py-0.5 rounded">PasswordDemo123!</code>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Email Petugas</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ruangaman.id"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white focus:ring-2 focus:ring-[#0F9F91] focus:border-transparent outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white focus:ring-2 focus:ring-[#0F9F91] focus:border-transparent outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-lg hover:shadow-[#0F9F91]/25 disabled:opacity-50 transition-all mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Masuk Panel Petugas</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Website Publik RUANGAMAN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
