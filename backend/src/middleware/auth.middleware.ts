import { NextFunction, Request, Response } from 'express';
import { adminService } from '../services/admin.service.js';
import { sessionService } from '../services/session.service.js';
import { Admin, AdminRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  admin?: Admin;
}

/**
 * Middleware Autentikasi Admin & Verifikasi Sesi Idle 15 Menit
 *
 * 1. Menerima Bearer token dari header Authorization.
 * 2. Membedakan token Supabase (JWT) atau token demo (demo-token-*).
 * 3. Memverifikasi hak akses petugas aktif.
 * 4. Memverifikasi timeout idle 15 menit (menolak jika tidak aktif > 15 menit).
 */
export const authenticateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Akses ditolak: Token autentikasi tidak ditemukan',
      errors: [{ message: 'Harap sertakan Bearer token pada header Authorization' }],
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Gunakan demo token jika berformat demo-token-* (khusus dev/testing)
  if (token.startsWith('demo-token-')) {
    await authenticateWithDemoToken(token, req, res, next);
  } else {
    await authenticateWithSupabase(token, req, res, next);
  }
};

// ===== Supabase Auth =====
async function authenticateWithSupabase(
  token: string,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { verifySupabaseToken } = await import(
      '../repositories/supabase/supabase.client.js'
    );

    const verifiedUser = await verifySupabaseToken(token);
    if (!verifiedUser) {
      res.status(401).json({
        success: false,
        message: 'Token tidak valid atau telah kedaluwarsa',
      });
      return;
    }

    // Cari dan tautkan akun petugas jika email cocok
    let admin: Admin | null = null;
    try {
      admin = await adminService.verifyAndLinkAdmin(verifiedUser.id, verifiedUser.email || '');
    } catch (linkErr: any) {
      res.status(linkErr.statusCode || 403).json({
        success: false,
        message: linkErr.message || 'Bukan petugas terdaftar',
        errors: [{ message: linkErr.message }],
      });
      return;
    }

    if (!admin || !admin.is_active) {
      res.status(403).json({
        success: false,
        message: 'Akun ini tidak memiliki hak akses sebagai petugas RUANGAMAN',
        errors: [
          {
            message:
              'Hubungi administrator untuk mendaftarkan akun Google Anda sebagai petugas.',
          },
        ],
      });
      return;
    }

    const allowedRoles: AdminRole[] = ['super_admin', 'case_manager', 'counselor'];
    if (!allowedRoles.includes(admin.role)) {
      res.status(403).json({
        success: false,
        message: 'Role tidak dikenali. Hubungi super admin.',
      });
      return;
    }

    // Verifikasi idle session 15 menit (Hanya validasi — TIDAK memperbarui aktivitas)
    const sessionResult = await sessionService.validateSession(
      token,
      admin.id,
      verifiedUser.id
    );

    if (!sessionResult.valid) {
      res.status(401).json({
        success: false,
        code: sessionResult.code,
        message: sessionResult.message || 'Sesi telah berakhir atau dicabut.',
      });
      return;
    }

    req.admin = admin;
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada proses autentikasi',
    });
  }
}

// ===== Demo Token (Development Fallback) =====
async function authenticateWithDemoToken(
  token: string,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const parts = token.split('-');
  if (parts.length < 4) {
    res.status(401).json({
      success: false,
      message: 'Format token demo tidak valid',
    });
    return;
  }

  const role = parts[2] as AdminRole;
  const adminIdOrEmail = parts.slice(3).join('-');

  const { getRepositoriesSync } = await import('../repositories/repository.factory.js');
  const { adminRepository } = getRepositoriesSync();

  let admin: Admin | null = null;
  if (adminIdOrEmail.includes('@')) {
    admin = await adminRepository.findByEmail(adminIdOrEmail);
  } else {
    admin = await adminRepository.findById(adminIdOrEmail);
  }

  if (!admin || !admin.is_active) {
    res.status(401).json({
      success: false,
      message: 'Sesi akun petugas tidak aktif atau telah dinonaktifkan',
    });
    return;
  }

  // Verifikasi idle session pada token demo (Hanya validasi — TIDAK memperbarui aktivitas)
  const sessionResult = await sessionService.validateSession(
    token,
    admin.id,
    undefined
  );

  if (!sessionResult.valid) {
    res.status(401).json({
      success: false,
      code: sessionResult.code,
      message: sessionResult.message || 'Sesi Anda telah berakhir.',
    });
    return;
  }

  req.admin = { ...admin, role };
  next();
}

export const requireRoles = (...allowedRoles: AdminRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan',
      });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini',
        errors: [
          {
            message: `Wewenang diperlukan: [${allowedRoles.join(', ')}], wewenang Anda: ${req.admin.role}`,
          },
        ],
      });
      return;
    }

    next();
  };
};
