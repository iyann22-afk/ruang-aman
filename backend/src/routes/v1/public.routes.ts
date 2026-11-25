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

router.get('/education/categories', (req, res, next) => {
  educationController.getCategories(req, res, next);
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

// 7. User Profile Sync (dipanggil setelah Google OAuth berhasil)
// Memerlukan Authorization: Bearer <supabase_token>
// Membuat atau memperbarui profil pengguna tanpa mengganti UUID primary key
router.post('/profile/sync', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Token autentikasi tidak ditemukan' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verifikasi token Supabase
    const { verifySupabaseToken } = await import('../../repositories/supabase/supabase.client.js');
    const user = await verifySupabaseToken(token);

    if (!user) {
      res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
      return;
    }

    // Ambil data profil dari request body (nama dan avatar dari Google)
    const { full_name, avatar_url } = req.body as {
      full_name?: string;
      avatar_url?: string;
    };

    // Pastikan field sensitif tidak bisa dimanipulasi
    // (role, is_active, dll. tidak ada di user_profiles — aman)

    // Upsert profil tanpa mengganti UUID primary key
    const { SupabaseUserProfileRepository } = await import(
      '../../repositories/supabase/supabase-user-profile.repository.js'
    );
    const profileRepo = new SupabaseUserProfileRepository();
    const profile = await profileRepo.upsertProfile(
      user.id,
      full_name?.trim() || undefined,
      avatar_url || undefined
    );

    res.json({
      success: true,
      profile: {
        id: profile.id,
        auth_user_id: profile.auth_user_id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
