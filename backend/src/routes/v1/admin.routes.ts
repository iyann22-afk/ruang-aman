import { Router } from 'express';
import { adminController } from '../../controllers/admin.controller.js';
import { reportController } from '../../controllers/report.controller.js';
import { authenticateAdmin } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { adminLoginSchema } from '../../validators/admin.validator.js';
import { updateStatusSchema } from '../../validators/report.validator.js';

const router = Router();

// Public login endpoint for admin demo
router.post('/auth/login', validateBody(adminLoginSchema), (req, res, next) => {
  adminController.login(req, res, next);
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
