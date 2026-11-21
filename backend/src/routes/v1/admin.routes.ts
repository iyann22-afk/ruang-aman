import { Router } from 'express';
import { adminController } from '../../controllers/admin.controller.js';
import { reportController } from '../../controllers/report.controller.js';
import { authenticateAdmin } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { adminLoginSchema } from '../../validators/admin.validator.js';
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

// Week 3: Verify Supabase token for Google OAuth admin login
// Frontend calls GET /api/v1/admin/auth/verify with Bearer token
// Returns 200 if admin, 403 if not an admin
router.get('/auth/verify', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const { verifySupabaseToken } = await import('../../repositories/supabase/supabase.client.js');
    const { getRepositories } = await import('../../repositories/repository.factory.js');

    const user = await verifySupabaseToken(token);
    if (!user) {
      res.status(401).json({ success: false, message: 'Token tidak valid' });
      return;
    }

    const { adminRepository } = await getRepositories();
    const extRepo = adminRepository as { findByAuthUserId?: (id: string) => Promise<import('../../types/index.js').Admin | null> };
    const admin = extRepo.findByAuthUserId
      ? await extRepo.findByAuthUserId(user.id)
      : null;

    if (!admin || !admin.is_active) {
      res.status(403).json({ success: false, message: 'Bukan petugas terdaftar' });
      return;
    }

    res.json({ success: true, admin: { id: admin.id, full_name: admin.full_name, role: admin.role, email: admin.email } });
  } catch (err) {
    next(err);
  }
});

// All routes below require Admin Authentication
router.use(authenticateAdmin);

// Dashboard Summary
router.get('/dashboard/summary', (req, res, next) => {
  reportController.getDashboardSummary(req, res, next);
});

// Reports Management
router.get('/reports', (req, res, next) => {
  reportController.getAdminReports(req, res, next);
});

router.get('/reports/:id', (req, res, next) => {
  reportController.getAdminReportDetail(req, res, next);
});

router.patch(
  '/reports/:id/status',
  validateBody(updateStatusSchema),
  (req, res, next) => {
    reportController.updateReportStatus(req, res, next);
  }
);

// Audit Trail & Status History
router.get('/status-history', (req, res, next) => {
  reportController.getAuditTrail(req, res, next);
});

// Current Admin Profile
router.get('/profile', (req, res, next) => {
  adminController.getProfile(req, res, next);
});

export default router;
