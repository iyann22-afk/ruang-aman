import { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import { AdminProfile } from '../types/index';
import { apiClient } from '../services/apiClient';

interface UserProfile {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  admin: AdminProfile | null;
  adminLoading: boolean;
  profile: UserProfile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdmin: () => Promise<AdminProfile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Cek apakah user adalah admin terdaftar & aktif
  const checkAdminStatus = useCallback(async (accessToken?: string): Promise<AdminProfile | null> => {
    setAdminLoading(true);
    try {
      // 1. Cek token Supabase jika ada
      let token = accessToken;
      if (!token) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token;
      }

      // 2. Jika tidak ada Supabase token, cek apakah ada token demo (development)
      if (!token) {
        const demoToken = localStorage.getItem('ruangaman_admin_token');
        if (demoToken) {
          try {
            const profileData = await apiClient.getAdminProfile();
            setAdmin(profileData);
            setIsAdmin(true);
            return profileData;
          } catch {
            localStorage.removeItem('ruangaman_admin_token');
            setAdmin(null);
            setIsAdmin(false);
            return null;
          }
        }
        setAdmin(null);
        setIsAdmin(false);
        return null;
      }

      // 3. Verifikasi token Supabase ke endpoint backend /admin/auth/verify
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${apiBase}/admin/auth/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const adminData: AdminProfile = {
          id: json.admin.id,
          full_name: json.admin.full_name,
          email: json.admin.email,
          role: json.admin.role,
          is_active: json.admin.is_active,
          permissions: json.admin.permissions || [],
        };
        setIsAdmin(true);
        setAdmin(adminData);
        return adminData;
      } else {
        setIsAdmin(false);
        setAdmin(null);
        return null;
      }
    } catch (err) {
      console.warn('[AuthContext] Gagal verifikasi status admin:', err);
      setIsAdmin(false);
      setAdmin(null);
      return null;
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // Sinkronisasi profil pengguna ke backend setelah login Google berhasil.
  // Endpoint backend melakukan upsert tanpa mengganti UUID primary key.
  const syncUserProfile = useCallback(async (accessToken: string, authUser: User) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';

      // Ambil nama dan avatar dari metadata Google OAuth
      const fullName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        null;
      const avatarUrl =
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        null;

      const res = await fetch(`${apiBase}/public/profile/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: fullName, avatar_url: avatarUrl }),
      });

      if (res.ok) {
        const result = await res.json();
        setProfile(result.profile as UserProfile);
      }
    } catch {
      // Profil sync gagal tidak memblokir akses
      console.warn('[AuthContext] Gagal sinkronisasi profil pengguna');
    }
  }, []);

  useEffect(() => {
    // Ambil session awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token && session.user) {
        checkAdminStatus(session.access_token);
        syncUserProfile(session.access_token, session.user);
      } else {
        // Cek apakah ada demo token
        checkAdminStatus();
      }
      setLoading(false);
    });

    // Subscribe perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token && session.user) {
          await checkAdminStatus(session.access_token);
          await syncUserProfile(session.access_token, session.user);
        } else {
          // Bila session berakhir
          const demoToken = localStorage.getItem('ruangaman_admin_token');
          if (!demoToken) {
            setIsAdmin(false);
            setAdmin(null);
            setProfile(null);
          }
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminStatus, syncUserProfile]);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      console.error('[AuthContext] Google sign-in error:', error.message);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiClient.logoutAdmin().catch(() => {});
    } catch {
      // Abaikan error saat memanggil backend logout
    }
    localStorage.removeItem('ruangaman_admin_token');
    localStorage.removeItem('ruangaman_admin_last_activity');
    sessionStorage.removeItem('auth_return_to');

    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error('[AuthContext] Sign-out error:', err.message);
    }

    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setAdmin(null);
    setProfile(null);
  }, []);

  const refreshAdmin = useCallback(async () => {
    return checkAdminStatus();
  }, [checkAdminStatus]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAdmin,
      admin,
      adminLoading,
      profile,
      signInWithGoogle,
      signOut,
      refreshAdmin,
    }),
    [user, session, loading, isAdmin, admin, adminLoading, profile, signInWithGoogle, signOut, refreshAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
