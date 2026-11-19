import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // In case data came from multipart/form-data where boolean is string "true"
      if (typeof req.body.privacy_acknowledged === 'string') {
        req.body.privacy_acknowledged = req.body.privacy_acknowledged === 'true';
      }
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          message: 'Validasi gagal: Silakan periksa kembali data isian Anda',
          errors,
        });
        return;
      }
      next(err);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          message: 'Parameter kueri tidak valid',
          errors,
        });
        return;
      }
      next(err);
    }
  };
};
