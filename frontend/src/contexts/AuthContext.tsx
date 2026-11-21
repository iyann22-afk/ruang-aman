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
  profile: UserProfile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Cek apakah user adalah admin terdaftar
  const checkAdminStatus = useCallback(async (accessToken: string) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${apiBase}/admin/auth/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
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
      // Profil sync gagal tidak memblokir akses — log saja
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
          setIsAdmin(false);
          setProfile(null);
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthContext] Sign-out error:', error.message);
    }
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, isAdmin, profile, signInWithGoogle, signOut }),
    [user, session, loading, isAdmin, profile, signInWithGoogle, signOut]
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
