import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../repositories/supabase/supabase.client.js';

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const allowedExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const BUCKET_NAME = 'report-evidence-private';

// Multer keeps file in memory buffer; we upload to Supabase Storage after validation
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.'));
    }
  },
});

export const uploadOptionalEvidence = (req: Request, res: Response, next: NextFunction): void => {
  const singleUpload = upload.single('evidence');
  singleUpload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'Ukuran file melebihi batas maksimal 5 MB',
          errors: [{ field: 'evidence', message: 'Maksimum ukuran file adalah 5 MB' }],
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: `Kesalahan unggah file: ${err.message}`,
        errors: [{ field: 'evidence', message: err.message }],
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        message: err.message,
        errors: [{ field: 'evidence', message: err.message }],
      });
      return;
    }
    next();
  });
};

/**
 * Upload file bukti ke Supabase Storage (private bucket).
 * Dipanggil setelah uploadOptionalEvidence middleware.
 *
 * @param reportId - ID laporan (untuk path folder)
 * @param file - Multer file object dari req.file
 * @returns storagePath string yang disimpan di DB
 */
export async function uploadEvidenceToStorage(
  reportId: string,
  file: Express.Multer.File
): Promise<string> {
  const ext = allowedExtensions[file.mimetype] || path.extname(file.originalname);
  const safeFilename = `${uuidv4()}${ext}`;
  const storagePath = `${reportId}/${safeFilename}`;

  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Gagal menyimpan file bukti: ${error.message}`);
    }

    return storagePath;
  }

  // Production: WAJIB ada Supabase Storage — lempar error jika tidak tersedia
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Supabase Storage tidak dikonfigurasi. Upload bukti tidak dapat dilanjutkan di production.'
    );
  }

  // Development fallback: simulasikan path saja (tidak ada file fisik)
  console.warn(`[DEV_SIMULATION] File bukti tidak diupload ke storage. Path simulasi: local/${storagePath}`);
  return `local/${storagePath}`;
}

/**
 * Buat signed URL untuk mengakses file bukti (admin only).
 * URL berlaku 60 menit.
 */
export async function getEvidenceSignedUrl(storagePath: string): Promise<string | null> {
  if (!supabaseAdmin || storagePath.startsWith('local/')) {
    return null;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 60 * 60); // 1 jam

  if (error || !data) return null;
  return data.signedUrl;
}
