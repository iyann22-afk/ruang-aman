import { Router } from 'express';
import { adminController } from '../../controllers/admin.controller.js';
import { counselingController } from '../../controllers/counseling.controller.js';
import { reportController } from '../../controllers/report.controller.js';
import { authenticateAdmin, requireRoles } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  adminLoginSchema,
  createAdminSchema,
  updateAdminRoleSchema,
  updateAdminStatusSchema,
} from '../../validators/admin.validator.js';
import { createCounselingSlotSchema } from '../../validators/counseling.validator.js';
import { updateStatusSchema } from '../../validators/report.validator.js';

const router = Router();

// Demo login endpoint — hanya tersedia di development atau ENABLE_DEMO_AUTH=true
router.post('/auth/login', validateBody(adminLoginSchema), (req, res, next) => {
  const isDemoAllowed =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_AUTH === 'true';
  if (!isDemoAllowed) {
    res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
    return;
  }
  adminController.login(req, res, next);
});

router.post('/auth/init', (req, res, next) => adminController.initSession(req, res, next));
router.get('/auth/verify', (req, res, next) => adminController.verify(req, res, next));
router.post('/auth/heartbeat', authenticateAdmin, (req, res, next) => adminController.heartbeat(req, res, next));
router.post('/auth/logout', authenticateAdmin, (req, res, next) => adminController.logout(req, res, next));

// Semua endpoint operasional mewajibkan sesi petugas aktif.
router.use(authenticateAdmin);

router.get('/dashboard/summary', (req, res, next) => reportController.getDashboardSummary(req, res, next));

// Jadwal konseling: Guru BK hanya mengelola miliknya; Case Manager/Super Admin dapat memilih Guru BK.
router.get(
  '/counseling-slots',
  requireRoles('super_admin', 'case_manager', 'counselor'),
  (req, res, next) => counselingController.getAdminSlots(req, res, next)
);
router.post(
  '/counseling-slots',
  requireRoles('super_admin', 'case_manager', 'counselor'),
  validateBody(createCounselingSlotSchema),
  (req, res, next) => counselingController.createAdminSlot(req, res, next)
);
router.get(
  '/counseling-counselors',
  requireRoles('super_admin', 'case_manager'),
  (req, res, next) => counselingController.getActiveCounselors(req, res, next)
);

router.get('/reports', (req, res, next) => reportController.getAdminReports(req, res, next));
router.get('/reports/:id', (req, res, next) => reportController.getAdminReportDetail(req, res, next));
router.get('/reports/:id/evidences/:evidenceId/url', (req, res, next) =>
  reportController.getEvidenceSignedUrl(req, res, next)
);
router.patch('/reports/:id/status', validateBody(updateStatusSchema), (req, res, next) =>
  reportController.updateReportStatus(req, res, next)
);

router.get('/status-history', requireRoles('super_admin', 'case_manager'), (req, res, next) =>
  reportController.getAuditTrail(req, res, next)
);
router.get('/profile', (req, res, next) => adminController.getProfile(req, res, next));

router.get('/petugas', requireRoles('super_admin'), (req, res, next) =>
  adminController.listPetugas(req, res, next)
);
router.post('/petugas', requireRoles('super_admin'), validateBody(createAdminSchema), (req, res, next) =>
  adminController.createPetugas(req, res, next)
);
router.patch('/petugas/:id/role', requireRoles('super_admin'), validateBody(updateAdminRoleSchema), (req, res, next) =>
  adminController.updatePetugasRole(req, res, next)
);
router.patch('/petugas/:id/status', requireRoles('super_admin'), validateBody(updateAdminStatusSchema), (req, res, next) =>
  adminController.updatePetugasStatus(req, res, next)
);

export default router;
