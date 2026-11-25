import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { ToastAlert } from '../../components/feedback/ToastAlert.js';
import { useAuth } from '../../contexts/AuthContext.js';

// Demo login hanya aktif di development atau ketika VITE_ENABLE_DEMO_AUTH=true
const isDemoEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true';

export const LoginAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithGoogle, isAdmin, admin, adminLoading } = useAuth();
  const [email, setEmail] = useState(isDemoEnabled ? 'admin@ruangaman.id' : '');
  const [password, setPassword] = useState(isDemoEnabled ? 'PasswordDemo123!' : '');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'warning' | 'error' | 'info'; title: string; message: string } | null>(null);

  // Periksa apakah ada error/notice dari query params (misal auto-logout atau bukan petugas)
  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam === 'idle_timeout') {
      setNotice({
        type: 'warning',
        title: 'Sesi Berakhir Otomatis (15 Menit Idle)',
        message: 'Demi melindungi kerahasiaan dan privasi data korban, sesi Anda telah ditutup secara otomatis karena tidak ada aktivitas selama 15 menit. Silakan masuk kembali.',
      });
    } else if (errParam === 'not_registered') {
      setNotice({
        type: 'error',
        title: 'Akses Ditolak: Bukan Petugas Terdaftar',
        message: 'Akun Google Anda belum terdaftar sebagai petugas aktif RUANGAMAN. Akses hanya diberikan kepada petugas Satgas PPKSP dan Guru BK yang telah ditunjuk oleh Super Admin.',
      });
    } else if (errParam === 'inactive') {
      setNotice({
        type: 'error',
        title: 'Akun Petugas Nonaktif',
        message: 'Akun petugas Anda telah dinonaktifkan oleh Super Admin. Silakan hubungi koordinator Satgas jika Anda memerlukan pemulihan akses.',
      });
    } else if (errParam === 'session_expired') {
      setNotice({
        type: 'warning',
        title: 'Sesi Kedaluwarsa',
        message: 'Sesi autentikasi Anda telah kedaluwarsa. Silakan masuk kembali.',
      });
    } else if (errParam === 'auth_failed') {
      setNotice({
        type: 'error',
        title: 'Autentikasi Google Gagal',
        message: 'Gagal melakukan verifikasi akun dengan Google. Silakan coba kembali.',
      });
    } else if (errParam === 'verify_error') {
      setNotice({
        type: 'error',
        title: 'Verifikasi Gagal',
        message: 'Gagal menghubungi server verifikasi petugas. Pastikan koneksi internet stabil dan coba kembali.',
      });
    } else if (errParam === 'revoke_failed' || searchParams.get('warning') === 'revoke_failed') {
      setNotice({
        type: 'warning',
        title: 'Peringatan: Pencabutan Sesi Server Gagal',
        message: 'Sesi browser Anda telah ditutup secara lokal, namun pencabutan sesi di server backend gagal dikonfirmasi. Pastikan Anda menutup seluruh jendela peramban untuk mencegah akses tidak sah jika menggunakan perangkat bersama.',
      });
    }

    const noticeParam = searchParams.get('notice');
    if (noticeParam === 'logged_out') {
      setNotice({
        type: 'info',
        title: 'Berhasil Keluar',
        message: 'Sesi petugas Anda telah berhasil diakhiri dengan aman.',
      });
    }
  }, [searchParams]);

  // Auto-redirect jika pengguna sudah login dan merupakan petugas aktif (tanpa parameter peringatan/logout)
  useEffect(() => {
    const errParam = searchParams.get('error');
    const warningParam = searchParams.get('warning');
    const noticeParam = searchParams.get('notice');
    const hasAuthAlert = Boolean(errParam || warningParam || noticeParam);

    if (!hasAuthAlert && !adminLoading && isAdmin && Boolean(admin?.is_active)) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, admin, adminLoading, searchParams, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.adminLogin(email, password);
      localStorage.setItem('ruangaman_admin_token', res.token);
      localStorage.setItem('ruangaman_admin_last_activity', Date.now().toString());
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    setNotice(null);
    try {
      sessionStorage.setItem('auth_return_to', '/admin/dashboard');
      await signInWithGoogle();
    } catch {
      setError('Gagal memulai masuk dengan Google. Coba lagi.');
      setGoogleLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('PasswordDemo123!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#0F9F91]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <img src="/images/logo-ruangaman.svg" alt="Logo RUANGAMAN" className="w-16 h-16 mx-auto drop-shadow-md" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Portal Petugas Satgas &amp; BK
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Akses terbatas untuk penanganan kasus perundungan dan kekerasan sekolah.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-slate-700/80 shadow-2xl space-y-6">

          {notice && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              notice.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {notice.type === 'warning' ? (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{notice.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{notice.message}</p>
            </div>
          )}

          {error && (
            <ToastAlert type="error" title="Akses Gagal" message={error} onClose={() => setError(null)} />
          )}

          {/* === GOOGLE LOGIN BUTTON === */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full inline-flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-semibold text-sm text-slate-800 bg-white hover:bg-slate-100 disabled:opacity-50 transition-all border border-slate-200 shadow-sm"
          >
            {googleLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Menghubungkan ke Google…</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Masuk dengan Google (Petugas)</span>
              </>
            )}
          </button>

          {/* Info Google admin */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
            <div className="flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 mt-0.5 text-blue-400 flex-shrink-0" />
              <span>
                Akun Google Anda harus sudah <strong>terdaftar oleh Super Admin</strong> sebagai petugas RUANGAMAN.
                Akun Google biasa tidak mendapat akses dashboard secara otomatis.
              </span>
            </div>
          </div>

          {/* === DEMO SECTION — hanya tampil di development === */}
          {isDemoEnabled && (
            <>
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-800 px-3 text-slate-500">atau masuk dengan akun demo</span>
                </div>
              </div>

              {/* Demo Credentials Quick Switcher */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>AKUN DEMO (Klik untuk Isi Cepat):</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  <button type="button" onClick={() => setDemoAccount('admin@ruangaman.id')}
                    className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center">
                    <span>admin@ruangaman.id</span>
                    <span className="text-[10px] font-bold text-[#0F9F91]">Super Admin</span>
                  </button>
                  <button type="button" onClick={() => setDemoAccount('casemanager@ruangaman.id')}
                    className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center">
                    <span>casemanager@ruangaman.id</span>
                    <span className="text-[10px] font-bold text-sky-400">Case Manager</span>
                  </button>
                  <button type="button" onClick={() => setDemoAccount('counselor@ruangaman.id')}
                    className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center">
                    <span>counselor@ruangaman.id</span>
                    <span className="text-[10px] font-bold text-purple-400">Guru BK</span>
                  </button>
                </div>
                <p className="text-[10px] text-amber-300/80 pt-1">
                  Password default demo: <code className="font-mono bg-black/30 px-1 py-0.5 rounded">PasswordDemo123!</code>
                </p>
              </div>

              {/* Email + Password Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Email Petugas</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email" required value={email}
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
                      type="password" required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white focus:ring-2 focus:ring-[#0F9F91] focus:border-transparent outline-hidden"
                    />
                  </div>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-lg hover:shadow-[#0F9F91]/25 disabled:opacity-50 transition-all mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Masuk Panel Petugas (Demo)</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="text-center pt-2">
            <button type="button" onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Website Publik RUANGAMAN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
