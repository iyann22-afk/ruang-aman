import crypto from 'crypto';
import { supabaseAdmin } from '../repositories/supabase/supabase.client.js';

export interface SessionValidationResult {
  valid: boolean;
  code?: 'SESSION_IDLE_TIMEOUT' | 'SESSION_REVOKED' | 'INVALID_TOKEN' | 'SESSION_NOT_FOUND';
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
   * Mengekstrak identitas sesi yang STABIL dan UNIK.
   * - Demo token: menggunakan ID demo petugas yang stabil.
   * - Supabase JWT: menggunakan claims.session_id (tetap sama meski access token di-refresh)
   *   atau claims.jti jika session_id tidak tersedia.
   * - PENTING: Jangan gunakan sub atau authUserId sebagai pengganti session_id,
   *   karena hal itu menyebabkan sesi antar perangkat berbeda tercampur!
   * - Fallback aman: jika klaim session_id tidak ada, gunakan fingerprint hash dari token
   *   itu sendiri agar setiap token/perangkat terisolasi secara aman.
   */
  public getSessionKey(token: string, adminId?: string, authUserId?: string): string {
    if (!token) return '';

    // 1. Token demo development
    if (token.startsWith('demo-token-')) {
      const parts = token.split('-');
      const id = adminId || parts.slice(3).join('-');
      return `demo-session-${id}`;
    }

    // 2. Token JWT Supabase
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        // Klaim session_id dari Supabase Auth unik per sesi/perangkat dan stabil saat refresh
        if (payload.session_id) {
          return `sb-session-${payload.session_id}`;
        }
        // Jika klaim session_id tidak tersedia, gunakan jti unik token
        if (payload.jti) {
          return `sb-jwt-${payload.jti}`;
        }
      }
    } catch {
      // Bukan format JWT base64 standar
    }

    // 3. Fallback aman ketika session_id tidak tersedia:
    // Gunakan hash dari token itu sendiri agar unik per token dan tidak mencampurkan sesi antar perangkat
    const tokenFingerprint = crypto.createHash('sha256').update(token).digest('hex');
    return `token-fp-${tokenFingerprint}`;
  }

  public hashSessionKey(sessionKey: string): string {
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
        console.error('[SessionService] Supabase client tidak tersedia untuk validasi sesi (fail-closed)');
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

        // Tangani error eksekusi RPC jika ada
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
              code: 'SESSION_NOT_FOUND',
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

        // Parse respons JSONB terstruktur dari RPC
        if (data) {
          if (data.valid === false) {
            return {
              valid: false,
              code: data.code || 'INVALID_TOKEN',
              message: data.message || 'Sesi tidak valid.',
            };
          }
          return { valid: true, lastActivityAt: data.last_activity_at };
        }

        return {
          valid: false,
          code: 'SESSION_NOT_FOUND',
          message: 'Sesi petugas tidak ditemukan atau telah berakhir.',
        };
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
      // Inisialisasi otomatis untuk token development yang belum pernah touch
      this.memorySessions.set(tokenHash, {
        adminId,
        authUserId,
        lastActivityAt: now,
        isRevoked: false,
      });
      return { valid: true, lastActivityAt: new Date(now).toISOString() };
    }

    if (memSession.isRevoked) {
      return {
        valid: false,
        code: 'SESSION_REVOKED',
        message: 'Sesi petugas telah dicabut atau dinonaktifkan.',
      };
    }

    if (now - memSession.lastActivityAt > this.IDLE_TIMEOUT_MS) {
      // Tandai revoked di memori secara konsisten
      memSession.isRevoked = true;
      return {
        valid: false,
        code: 'SESSION_IDLE_TIMEOUT',
        message: 'Sesi Anda berakhir karena tidak ada aktivitas selama 15 menit.',
      };
    }

    // Validasi biasa TIDAK memperbarui lastActivityAt
    return {
      valid: true,
      lastActivityAt: new Date(memSession.lastActivityAt).toISOString(),
    };
  }

  /**
   * TOUCH SESI: Memperbarui waktu aktivitas (last_activity_at).
   * HANYA dipanggil saat:
   * 1. Login / Verify awal
   * 2. Heartbeat berkala yang dikirim setelah ada aktivitas pengguna di frontend
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

    // 1. Mode Supabase (production / USE_SUPABASE) -> FAIL-CLOSED
    if (this.shouldEnforceSupabase()) {
      if (!supabaseAdmin) {
        console.error('[SessionService] Supabase client tidak tersedia untuk touch sesi (fail-closed)');
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

        if (data) {
          if (data.valid === false) {
            return {
              valid: false,
              code: data.code || 'INVALID_TOKEN',
              message: data.message || 'Pembaruan sesi keamanan gagal.',
            };
          }
          const lastActivityAt = data.last_activity_at || new Date().toISOString();
          return { valid: true, lastActivityAt };
        }

        return { valid: true, lastActivityAt: new Date().toISOString() };
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
   * Menerapkan fail-closed di mode Supabase/production: melempar exception jika database error.
   */
  async revokeSession(token: string, adminId?: string, authUserId?: string): Promise<void> {
    const sessionKey = this.getSessionKey(token, adminId, authUserId);
    const tokenHash = this.hashSessionKey(sessionKey);

    const memSession = this.memorySessions.get(tokenHash);
    if (memSession) {
      memSession.isRevoked = true;
    }

    if (this.shouldEnforceSupabase()) {
      if (!supabaseAdmin) {
        console.error('[SessionService] Gagal mencabut sesi: klien Supabase tidak tersedia (fail-closed)');
        throw new Error('Layanan sesi tidak tersedia untuk mencabut sesi.');
      }

      const { error } = await supabaseAdmin
        .from('admin_sessions')
        .update({ is_revoked: true })
        .eq('session_token_hash', tokenHash);

      if (error) {
        console.error('[SessionService] Gagal mencabut sesi di database (fail-closed):', error.message);
        throw new Error(`Pencabutan sesi di database gagal: ${error.message}`);
      }
      return;
    }

    // Mode development / non-production
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('admin_sessions')
          .update({ is_revoked: true })
          .eq('session_token_hash', tokenHash);
        if (error) {
          console.warn('[SessionService] Peringatan pencabutan sesi di database dev:', error.message);
        }
      } catch (err: any) {
        console.warn('[SessionService] Gagal mencabut sesi di database dev:', err?.message);
      }
    }
  }

  /**
   * Mencabut seluruh sesi untuk seorang admin (misal saat dinonaktifkan).
   * Menerapkan fail-closed di mode Supabase/production: melempar exception jika database error.
   */
  async revokeAllSessionsForAdmin(adminId: string): Promise<void> {
    for (const [, session] of this.memorySessions.entries()) {
      if (session.adminId === adminId) {
        session.isRevoked = true;
      }
    }

    if (this.shouldEnforceSupabase()) {
      if (!supabaseAdmin) {
        console.error('[SessionService] Gagal mencabut seluruh sesi: klien Supabase tidak tersedia (fail-closed)');
        throw new Error('Layanan sesi tidak tersedia untuk mencabut seluruh sesi.');
      }

      const { error } = await supabaseAdmin.rpc('revoke_admin_sessions', { p_admin_id: adminId });
      if (error) {
        console.error('[SessionService] Gagal mencabut seluruh sesi admin di database (fail-closed):', error.message);
        throw new Error(`Pencabutan seluruh sesi admin di database gagal: ${error.message}`);
      }
      return;
    }

    // Mode development / non-production
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.rpc('revoke_admin_sessions', { p_admin_id: adminId });
        if (error) {
          console.warn('[SessionService] Peringatan pencabutan semua sesi di database dev:', error.message);
        }
      } catch (err: any) {
        console.warn('[SessionService] Gagal mencabut semua sesi admin di database dev:', err?.message);
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

  /**
   * Untuk testing: Mendapatkan jumlah sesi di memori
   */
  getSessionCountForTest(): number {
    return this.memorySessions.size;
  }
}

export const sessionService = new SessionService();
