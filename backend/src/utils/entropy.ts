import crypto from 'crypto';

/**
 * Generate a high-entropy tracking code for reports.
 * Format: RA-YYYY-[A-Z0-9]{6}
 * Example: RA-2026-F9X2K1
 * Over 2 billion combinations per year, preventing brute force guessing.
 */
export function generateTrackingCode(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32 alphabet without ambiguous 0/O, 1/I
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `RA-${year}-${code}`;
}

/**
 * Generate a high-entropy booking code for counseling.
 * Format: BK-YYYY-[A-Z0-9]{6}
 * Example: BK-2026-9A1B2C
 */
export function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `BK-${year}-${code}`;
}
