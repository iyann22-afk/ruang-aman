import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  logger.error('Unhandled Application Error', err, {
    method: req.method,
    url: req.originalUrl,
    status: statusCode,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server',
    errors: err.errors || [{ message: err.message || 'Internal server error' }],
  });
};
