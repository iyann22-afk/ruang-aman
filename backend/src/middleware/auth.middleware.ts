import { NextFunction, Request, Response } from 'express';
import { Admin, AdminRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  admin?: Admin;
}

const useSupabase =
  process.env.NODE_ENV === 'production' || process.env.USE_SUPABASE === 'true';

/**
 * Middleware Autentikasi Admin
 *
 * Production (USE_SUPABASE=true):
 *   - Verifikasi Bearer token menggunakan Supabase Auth
 *   - Cek tabel admins: auth_user_id match + is_active=true + role valid
 *
 * Development (default):
 *   - Fallback ke demo-token-<role>-<id> (Week 2 compatibility)
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

  if (useSupabase) {
    await authenticateWithSupabase(token, req, res, next);
  } else {
    await authenticateWithDemoToken(token, req, res, next);
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
    const { getRepositories } = await import('../repositories/repository.factory.js');

    const verifiedUser = await verifySupabaseToken(token);
    if (!verifiedUser) {
      res.status(401).json({
        success: false,
        message: 'Token tidak valid atau telah kedaluwarsa',
      });
      return;
    }

    const { adminRepository } = await getRepositories();

    // findByAuthUserId tersedia di SupabaseAdminRepository
    // Jika menggunakan IAdminRepository standar, cast ke extended interface
    const extendedRepo = adminRepository as {
      findByAuthUserId?: (id: string) => Promise<Admin | null>;
      findById: (id: string) => Promise<Admin | null>;
    };

    let admin: Admin | null = null;
    if (extendedRepo.findByAuthUserId) {
      admin = await extendedRepo.findByAuthUserId(verifiedUser.id);
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
  if (!token.startsWith('demo-token-')) {
    res.status(401).json({
      success: false,
      message: 'Token tidak valid. Di mode development gunakan demo-token.',
    });
    return;
  }

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
