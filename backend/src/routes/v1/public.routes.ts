import { Router } from 'express';
import { counselingController } from '../../controllers/counseling.controller.js';
import { educationController } from '../../controllers/education.controller.js';
import { reportController } from '../../controllers/report.controller.js';
import { trackingController } from '../../controllers/tracking.controller.js';
import {
  reportSubmissionLimiter,
  trackingLimiter,
} from '../../middleware/rate-limit.middleware.js';
import { uploadOptionalEvidence } from '../../middleware/upload.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createBookingSchema } from '../../validators/counseling.validator.js';
import { createReportSchema } from '../../validators/report.validator.js';
import { trackReportSchema } from '../../validators/tracking.validator.js';

const router = Router();

// 1. Report Categories
router.get('/categories', (req, res, next) => {
  reportController.getCategories(req, res, next);
});

// 2. Submit Report (with optional multipart evidence)
router.post(
  '/reports',
  reportSubmissionLimiter,
  uploadOptionalEvidence,
  validateBody(createReportSchema),
  (req, res, next) => {
    reportController.submitReport(req, res, next);
  }
);

// 3. Track Report by Unique Code (POST for privacy & body parsing)
router.post(
  '/reports/track',
  trackingLimiter,
  validateBody(trackReportSchema),
  (req, res, next) => {
    trackingController.trackReport(req, res, next);
  }
);

// 4. Education Materials
router.get('/education', (req, res, next) => {
  educationController.getMaterials(req, res, next);
});

router.get('/education/:slug', (req, res, next) => {
  educationController.getMaterialBySlug(req, res, next);
});

// 5. Support Resources & Hotlines
router.get('/support-resources', (req, res, next) => {
  counselingController.getSupportResources(req, res, next);
});

// 6. Counseling Slots & Booking
router.get('/counseling-slots', (req, res, next) => {
  counselingController.getSlots(req, res, next);
});

router.post(
  '/counseling-bookings',
  validateBody(createBookingSchema),
  (req, res, next) => {
    counselingController.bookSlot(req, res, next);
  }
);

export default router;
