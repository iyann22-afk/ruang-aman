import crypto from 'crypto';
import { supabaseAdmin } from '../repositories/supabase/supabase.client.js';

export interface SessionValidationResult {
  valid: boolean;
  code?: 'SESSION_IDLE_TIMEOUT' | 'SESSION_REVOKED' | 'INVALID_TOKEN';
  message?: string;
  lastActivityAt?: string;
}

interface InMemorySession {
  adminId: string;
  authUserId?: string;
  lastActivityAt: number;
  isRevoked: boolean;
}

export class SessionService {
  // Batas idle timeout: 15 menit (dalam milidetik)
  private readonly IDLE_TIMEOUT_MS = 15 * 60 * 1000;

  // In-memory cache (digunakan saat dev / test tanpa Supabase)
  private memorySessions = new Map<string, InMemorySession>();

  /**
   * Mengekstrak identitas sesi yang STABIL.
   * - Supabase JWT: menggunakan claims.session_id (tetap sama meski access token di-refresh)
   *   atau claims.sub jika session_id tidak ada di payload.
   * - Demo token: menggunakan adminId yang stabil.
   */
  public getSessionKey(token: string, adminId?: string, authUserId?: string): string {
    if (token.startsWith('demo-token-')) {
      const parts = token.split('-');
      const id = adminId || parts.slice(3).join('-');
      return `demo-session-${id}`;
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.session_id) {
          return `sb-session-${payload.session_id}`;
        }
        if (payload.sub) {
          return `sb-user-${payload.sub}`;
        }
      }
    } catch {
      // bukan format JWT standard
    }

    if (authUserId) {
      return `sb-user-${authUserId}`;
    }

    if (adminId) {
      return `admin-session-${adminId}`;
    }

    return token;
  }

  private hashSessionKey(sessionKey: string): string {
    return crypto.createHash('sha256').update(sessionKey).digest('hex');
  }

  private shouldEnforceSupabase(): boolean {
    return process.env.NODE_ENV === 'production' || process.env.USE_SUPABASE === 'true';
  }

  /**
   * VALIDASI SESI (Hanya memvalidasi — TIDAK memperbarui last_activity_at).
   * Digunakan oleh auth middleware pada request API biasa.
   */
  async validateSession(
    token: string,
    adminId: string,
    authUserId?: string
  ): Promise<SessionValidationResult> {
    const sessionKey = this.getSessionKey(token, adminId, authUserId);
    const tokenHash = this.hashSessionKey(sessionKey);
    const now = Date.now();

    // 1. Jika mode Supabase (production / USE_SUPABASE) -> wajib melalui Supabase (FAIL-CLOSED)
    if (this.shouldEnforceSupabase()) {
      if (!supabaseAdmin) {
        return {
          valid: false,
          code: 'INVALID_TOKEN',
          message: 'Layanan verifikasi sesi tidak tersedia.',
        };
      }

      try {
        const { data, error } = await supabaseAdmin.rpc('validate_admin_session', {
          p_token_hash: tokenHash,
        });

        if (error) {
          if (error.message.includes('SESSION_IDLE_TIMEOUT')) {
            return {
              valid: false,
              code: 'SESSION_IDLE_TIMEOUT',
              message: 'Sesi Anda berakhir karena tidak ada aktivitas selama 15 menit.',
            };
          }
          if (error.message.includes('SESSION_REVOKED')) {
            return {
              valid: false,
              code: 'SESSION_REVOKED',
              message: 'Sesi petugas telah dicabut atau dinonaktifkan.',
            };
          }
          if (error.message.includes('SESSION_NOT_FOUND')) {
            return {
              valid: false,
              code: 'INVALID_TOKEN',
              message: 'Sesi petugas tidak ditemukan atau telah berakhir.',
            };
          }

          // FAIL-CLOSED: jangan beralih ke in-memory jika terjadi error RPC/database di production
          console.error('[SessionService] Supabase validate error (fail-closed):', error.message);
          return {
            valid: false,
            code: 'INVALID_TOKEN',
            message: 'Verifikasi keamanan sesi gagal. Silakan masuk kembali.',
          };
        }

        return { valid: true, lastActivityAt: data?.last_activity_at };
      } catch (err: any) {
        console.error('[SessionService] Supabase connection error (fail-closed):', err?.message);
        return {
          valid: false,
          code: 'INVALID_TOKEN',
          message: 'Verifikasi keamanan sesi gagal. Silakan masuk kembali.',
        };
      }
    }

    // 2. Mode development / unit test tanpa Supabase (In-Memory)
    const memSession = this.memorySessions.get(tokenHash);
    if (!memSession) {
      // Jika belum tercatat di memory (misal pemanggilan pertama sebelum heartbeat)
      this.memorySessions.set(tokenHash, {
        adminId,
        authUserId,
        lastActivityAt: now,
        isRevoked: false,
      });
      return { valid: true };
    }

    if (memSession.isRevoked) {
      return {
        valid: false,
        code: 'SESSION_REVOKED',
        message: 'Sesi petugas telah dicabut atau dinonaktifkan.',
      };
    }

    if (now - memSession.lastActivityAt > this.IDLE_TIMEOUT_MS) {
      memSession.isRevoked = true;
      return {
        valid: false,
        code: 'SESSION_IDLE_TIMEOUT',
        message: 'Sesi Anda berakhir karena tidak ada aktivitas selama 15 menit.',
      };
    }

    // Valid, dan ingat: TIDAK memperbarui lastActivityAt!
    return { valid: true };
  }

  /**
   * MEMPERBARUI WAKTU AKTIVITAS SESI (TOUCH).
   * Hanya dipanggil melalui heartbeat interaksi pengguna atau login awal.
   */
  async touchSession(
    token: string,
    adminId: string,
    authUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionValidationResult> {
    const sessionKey = this.getSessionKey(token, adminId, authUserId);
    const tokenHash = this.hashSessionKey(sessionKey);
    const now = Date.now();

    // 1. Jika mode Supabase (production / USE_SUPABASE) -> simpan di Supabase (FAIL-CLOSED)
    if (this.shouldEnforceSupabase()) {
      if (!supabaseAdmin) {
        return {
          valid: false,
          code: 'INVALID_TOKEN',
          message: 'Layanan verifikasi sesi tidak tersedia.',
        };
      }

      try {
        const { data, error } = await supabaseAdmin.rpc('touch_admin_session', {
          p_admin_id: adminId,
          p_auth_user_id: authUserId || null,
          p_token_hash: tokenHash,
          p_ip_address: ipAddress || null,
          p_user_agent: userAgent || null,
        });

        if (error) {
          if (error.message.includes('SESSION_IDLE_TIMEOUT')) {
            return {
              valid: false,
              code: 'SESSION_IDLE_TIMEOUT',
              message: 'Sesi Anda berakhir karena tidak ada aktivitas selama 15 menit.',
            };
          }
          if (error.message.includes('SESSION_REVOKED')) {
            return {
              valid: false,
              code: 'SESSION_REVOKED',
              message: 'Sesi petugas telah dicabut atau dinonaktifkan.',
            };
          }

          console.error('[SessionService] Supabase touch error (fail-closed):', error.message);
          return {
            valid: false,
            code: 'INVALID_TOKEN',
            message: 'Pembaruan sesi keamanan gagal.',
          };
        }

        return { valid: true, lastActivityAt: data?.last_activity_at || new Date().toISOString() };
      } catch (err: any) {
        console.error('[SessionService] Supabase connection error (fail-closed):', err?.message);
        return {
          valid: false,
          code: 'INVALID_TOKEN',
          message: 'Pembaruan sesi keamanan gagal.',
        };
      }
    }

    // 2. Mode development / in-memory
    const memSession = this.memorySessions.get(tokenHash);
    if (memSession) {
      if (memSession.isRevoked) {
        return {
          valid: false,
          code: 'SESSION_REVOKED',
          message: 'Sesi petugas telah dicabut atau dinonaktifkan.',
        };
      }
      if (now - memSession.lastActivityAt > this.IDLE_TIMEOUT_MS) {
        memSession.isRevoked = true;
        return {
          valid: false,
          code: 'SESSION_IDLE_TIMEOUT',
          message: 'Sesi Anda berakhir karena tidak ada aktivitas selama 15 menit.',
        };
      }
    }

    this.memorySessions.set(tokenHash, {
      adminId,
      authUserId,
      lastActivityAt: now,
      isRevoked: false,
    });

    return { valid: true, lastActivityAt: new Date(now).toISOString() };
  }

  /**
   * Backward-compatible alias untuk validateAndTouch jika masih dipanggil
   */
  async validateAndTouch(
    token: string,
    adminId: string,
    authUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionValidationResult> {
    return this.touchSession(token, adminId, authUserId, ipAddress, userAgent);
  }

  /**
   * Mencabut sesi aktif tertentu (Logout).
   */
  async revokeSession(token: string, adminId?: string, authUserId?: string): Promise<void> {
    const sessionKey = this.getSessionKey(token, adminId, authUserId);
    const tokenHash = this.hashSessionKey(sessionKey);
    const memSession = this.memorySessions.get(tokenHash);
    if (memSession) {
      memSession.isRevoked = true;
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('admin_sessions')
          .update({ is_revoked: true })
          .eq('session_token_hash', tokenHash);
      } catch (err: any) {
        console.warn('[SessionService] Gagal mencabut sesi di database:', err?.message);
      }
    }
  }

  /**
   * Mencabut seluruh sesi untuk seorang admin (misal saat dinonaktifkan).
   */
  async revokeAllSessionsForAdmin(adminId: string): Promise<void> {
    for (const [, session] of this.memorySessions.entries()) {
      if (session.adminId === adminId) {
        session.isRevoked = true;
      }
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.rpc('revoke_admin_sessions', { p_admin_id: adminId });
      } catch (err: any) {
        console.warn('[SessionService] Gagal mencabut semua sesi admin di database:', err?.message);
      }
    }
  }

  /**
   * Untuk testing: Reset state sesi memory.
   */
  resetForTest(): void {
    this.memorySessions.clear();
  }

  clearMemoryCache(): void {
    this.resetForTest();
  }

  /**
   * Untuk testing: Memanipulasi waktu aktivitas sesi terakhir.
   */
  setLastActivityForTest(
    token: string,
    timestamp: number,
    adminId?: string,
    authUserId?: string
  ): void {
    const sessionKey = this.getSessionKey(token, adminId, authUserId);
    const tokenHash = this.hashSessionKey(sessionKey);
    const session = this.memorySessions.get(tokenHash);
    if (session) {
      session.lastActivityAt = timestamp;
    } else {
      this.memorySessions.set(tokenHash, {
        adminId: adminId || 'test-admin',
        authUserId,
        lastActivityAt: timestamp,
        isRevoked: false,
      });
    }
  }

  simulateLastActivity(
    token: string,
    timestamp: number,
    adminId?: string,
    authUserId?: string
  ): void {
    this.setLastActivityForTest(token, timestamp, adminId, authUserId);
  }

  /**
   * Untuk testing: Mengambil last_activity_at sesi.
   */
  getLastActivityForTest(token: string, adminId?: string, authUserId?: string): number | null {
    const sessionKey = this.getSessionKey(token, adminId, authUserId);
    const tokenHash = this.hashSessionKey(sessionKey);
    return this.memorySessions.get(tokenHash)?.lastActivityAt || null;
  }
}

export const sessionService = new SessionService();
