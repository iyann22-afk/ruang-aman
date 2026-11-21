import { Router } from 'express';
import { adminController } from '../../controllers/admin.controller.js';
import { reportController } from '../../controllers/report.controller.js';
import { authenticateAdmin, requireRoles } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  adminLoginSchema,
  createAdminSchema,
  updateAdminRoleSchema,
  updateAdminStatusSchema,
} from '../../validators/admin.validator.js';
import { updateStatusSchema } from '../../validators/report.validator.js';

const router = Router();

// Demo login endpoint — HANYA tersedia di development atau ENABLE_DEMO_AUTH=true
router.post('/auth/login', validateBody(adminLoginSchema), (req, res, next) => {
  const isDemoAllowed =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_AUTH === 'true';

  if (!isDemoAllowed) {
    res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
    return;
  }

  adminController.login(req, res, next);
});

// Inisialisasi sesi admin saat login (menjalankan touchSession)
router.post('/auth/init', (req, res, next) => {
  adminController.initSession(req, res, next);
});

// Verifikasi Supabase token untuk Google OAuth admin login & Account Linking aman (read-only secara default)
router.get('/auth/verify', (req, res, next) => {
  adminController.verify(req, res, next);
});

// Heartbeat untuk mereset idle timer 15 menit (hanya ketika ada interaksi pengguna aktif)
router.post('/auth/heartbeat', authenticateAdmin, (req, res, next) => {
  adminController.heartbeat(req, res, next);
});

// Logout petugas & pencabutan sesi di backend
router.post('/auth/logout', authenticateAdmin, (req, res, next) => {
  adminController.logout(req, res, next);
});

// =====================================================================
// Semua rute di bawah ini mewajibkan Autentikasi Petugas Aktif
// Sesi yang idle melebihi 15 menit otomatis ditolak oleh middleware
// =====================================================================
router.use(authenticateAdmin);

// Dashboard Summary
router.get('/dashboard/summary', (req, res, next) => {
  reportController.getDashboardSummary(req, res, next);
});

// Reports Management (Dengan RBAC: Counselor hanya melihat laporan miliknya)
router.get('/reports', (req, res, next) => {
  reportController.getAdminReports(req, res, next);
});

router.get('/reports/:id', (req, res, next) => {
  reportController.getAdminReportDetail(req, res, next);
});

router.get('/reports/:id/evidences/:evidenceId/url', (req, res, next) => {
  reportController.getEvidenceSignedUrl(req, res, next);
});

router.patch(
  '/reports/:id/status',
  validateBody(updateStatusSchema),
  (req, res, next) => {
    reportController.updateReportStatus(req, res, next);
  }
);

// Audit Trail & Status History (Hanya Super Admin & Case Manager)
router.get('/status-history', requireRoles('super_admin', 'case_manager'), (req, res, next) => {
  reportController.getAuditTrail(req, res, next);
});

// Current Admin Profile
router.get('/profile', (req, res, next) => {
  adminController.getProfile(req, res, next);
});

// =====================================================================
// MANAJEMEN PETUGAS (KHUSUS SUPER ADMIN)
// =====================================================================
router.get('/petugas', requireRoles('super_admin'), (req, res, next) => {
  adminController.listPetugas(req, res, next);
});

router.post(
  '/petugas',
  requireRoles('super_admin'),
  validateBody(createAdminSchema),
  (req, res, next) => {
    adminController.createPetugas(req, res, next);
  }
);

router.patch(
  '/petugas/:id/role',
  requireRoles('super_admin'),
  validateBody(updateAdminRoleSchema),
  (req, res, next) => {
    adminController.updatePetugasRole(req, res, next);
  }
);

router.patch(
  '/petugas/:id/status',
  requireRoles('super_admin'),
  validateBody(updateAdminStatusSchema),
  (req, res, next) => {
    adminController.updatePetugasStatus(req, res, next);
  }
);

export default router;
