import crypto from 'crypto';
import { supabaseAdmin } from '../repositories/supabase/supabase.client.js';

export interface SessionValidationResult {
  valid: boolean;
  code?: 'SESSION_IDLE_TIMEOUT' | 'SESSION_REVOKED' | 'INVALID_TOKEN';
  message?: string;
}

interface InMemorySession {
  adminId: string;
  authUserId?: string;
  lastActivityAt: number;
  isRevoked: boolean;
}

export class SessionService {
  // Idle timeout limit: 15 minutes (in milliseconds)
  private readonly IDLE_TIMEOUT_MS = 15 * 60 * 1000;

  // In-memory fallback cache (used in test/dev or as high-speed cache)
  private memorySessions = new Map<string, InMemorySession>();

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Memvalidasi dan memperbarui waktu aktivitas sesi admin.
   * Menolak jika sesi telah idle melebihi 15 menit atau dicabut.
   */
  async validateAndTouch(
    token: string,
    adminId: string,
    authUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionValidationResult> {
    const tokenHash = this.hashToken(token);
    const now = Date.now();

    // 1. Cek cache in-memory terlebih dahulu untuk perlindungan idle cepat
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

    // 2. Jika Supabase aktif, simpan/perbarui di database (PostgreSQL RPC)
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.rpc('touch_admin_session', {
          p_admin_id: adminId,
          p_auth_user_id: authUserId || null,
          p_token_hash: tokenHash,
          p_ip_address: ipAddress || null,
          p_user_agent: userAgent || null,
        });

        if (error) {
          if (error.message.includes('SESSION_IDLE_TIMEOUT')) {
            if (memSession) memSession.isRevoked = true;
            return {
              valid: false,
              code: 'SESSION_IDLE_TIMEOUT',
              message: 'Sesi Anda berakhir karena tidak ada aktivitas selama 15 menit.',
            };
          }
          if (error.message.includes('SESSION_REVOKED')) {
            if (memSession) memSession.isRevoked = true;
            return {
              valid: false,
              code: 'SESSION_REVOKED',
              message: 'Sesi petugas telah dicabut atau dinonaktifkan.',
            };
          }
          // Log error tapi lanjutkan dengan memory session jika RPC belum ter-deploy
          console.warn('[SessionService] RPC touch_admin_session warning:', error.message);
        }
      } catch (err: any) {
        console.warn('[SessionService] Supabase session touch fallback to memory:', err?.message);
      }
    }

    // 3. Perbarui cache memory
    this.memorySessions.set(tokenHash, {
      adminId,
      authUserId,
      lastActivityAt: now,
      isRevoked: false,
    });

    return { valid: true };
  }

  /**
   * Mencabut sesi aktif tertentu (Logout).
   */
  async revokeSession(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
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
      } catch (err) {
        console.warn('[SessionService] Gagal mencabut sesi di database:', err);
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
      } catch (err) {
        console.warn('[SessionService] Gagal mencabut semua sesi admin di database:', err);
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
  setLastActivityForTest(token: string, timestamp: number): void {
    const tokenHash = this.hashToken(token);
    const session = this.memorySessions.get(tokenHash);
    if (session) {
      session.lastActivityAt = timestamp;
    }
  }

  simulateLastActivity(token: string, timestamp: number): void {
    this.setLastActivityForTest(token, timestamp);
  }
}

export const sessionService = new SessionService();
