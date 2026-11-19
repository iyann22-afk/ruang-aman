import { NextFunction, Request, Response } from 'express';
import { adminRepository } from '../repositories/mock/admin.repository.js';
import { Admin, AdminRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  admin?: Admin;
}

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

  // For Week 2 Demo Authentication:
  // Format: demo-token-<role>-<id> or demo-token-<role>-<email>
  if (!token.startsWith('demo-token-')) {
    res.status(401).json({
      success: false,
      message: 'Token tidak valid atau telah kedaluwarsa',
    });
    return;
  }

  const parts = token.split('-');
  // demo, token, role, rest...
  if (parts.length < 4) {
    res.status(401).json({
      success: false,
      message: 'Format token demo tidak valid',
    });
    return;
  }

  const role = parts[2] as AdminRole;
  const adminIdOrEmail = parts.slice(3).join('-');

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

  req.admin = admin;
  next();
};

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
