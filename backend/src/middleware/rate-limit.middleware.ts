import rateLimit from 'express-rate-limit';

// Rate limit for report submission: max 15 submissions per 15 minutes per IP
export const reportSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan pengiriman laporan. Silakan coba kembali dalam beberapa saat.',
    errors: [{ message: 'Rate limit reached. Please wait before submitting another report.' }],
  },
});

// Rate limit for public tracking: max 60 attempts per 15 minutes per IP
export const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan pelacakan laporan. Harap tunggu sebentar.',
    errors: [{ message: 'Rate limit reached for tracking lookup.' }],
  },
});

// General public API limiter
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
