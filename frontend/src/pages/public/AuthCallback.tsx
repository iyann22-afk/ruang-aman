import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * Halaman Callback OAuth Google
 * Route: /auth/callback
 *
 * Supabase mengarahkan browser ke sini setelah Google login.
 * Halaman ini memproses token, lalu redirect ke halaman yang sesuai.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      try {
        // Supabase otomatis memproses hash/query params dari URL
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthCallback] Error memproses callback:', error.message);
          navigate('/?auth=error', { replace: true });
          return;
        }

        if (data.session) {
          // Login berhasil — cek apakah ini dari halaman admin
          const returnTo = sessionStorage.getItem('auth_return_to') || '/';
          sessionStorage.removeItem('auth_return_to');
          navigate(returnTo, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch {
        navigate('/?auth=error', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#17324D] to-[#0F9F91]">
      <div className="text-center text-white">
        {/* Spinner */}
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
          <svg
            className="animate-spin w-12 h-12 text-[#CCFBF1]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Memproses masuk…</h2>
        <p className="text-sm text-[#CCFBF1] opacity-80">
          Mohon tunggu, kami sedang memverifikasi akun Anda.
        </p>
      </div>
    </div>
  );
}
