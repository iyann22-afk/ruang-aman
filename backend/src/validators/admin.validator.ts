import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string({
    required_error: 'Email wajib diisi',
  }).email('Format email tidak valid'),

  password: z.string({
    required_error: 'Password wajib diisi',
  }).min(6, 'Password minimal 6 karakter'),
});

export const createAdminSchema = z.object({
  full_name: z
    .string({ required_error: 'Nama lengkap wajib diisi' })
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(150, 'Nama lengkap maksimal 150 karakter'),
  email: z
    .string({ required_error: 'Email akun Google petugas wajib diisi' })
    .email('Format email tidak valid')
    .max(255),
  role: z.enum(['super_admin', 'case_manager', 'counselor'], {
    required_error: 'Peran (role) petugas wajib ditentukan',
  }),
  is_active: z.boolean().optional().default(true),
});

export const updateAdminRoleSchema = z.object({
  role: z.enum(['super_admin', 'case_manager', 'counselor'], {
    required_error: 'Peran (role) baru wajib ditentukan',
  }),
});

export const updateAdminStatusSchema = z.object({
  is_active: z.boolean({
    required_error: 'Status aktif (is_active) wajib ditentukan',
  }),
});
