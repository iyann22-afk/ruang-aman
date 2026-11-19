import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Format file tidak didukung. Harap gunakan file gambar (JPG, PNG, WEBP) atau dokumen PDF.'
        )
      );
    }
  },
});

export const uploadOptionalEvidence = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
