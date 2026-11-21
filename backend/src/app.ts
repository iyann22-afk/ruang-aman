import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './middleware/error.middleware.js';
import { getRepositories } from './repositories/repository.factory.js';
import v1Routes from './routes/v1/index.js';
import { logger } from './utils/logger.js';

export const createApp = (): Application => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS
  app.use(cors(corsOptions));

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID and Logging Middleware
  app.use((req: Request, res: Response, next) => {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    res.setHeader('X-Request-Id', requestId);

    logger.info(`Incoming ${req.method} ${req.originalUrl}`, {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    next();
  });

  // Repositories initialization middleware (Critical for Vercel Serverless Functions cold-start)
  app.use(async (_req: Request, _res: Response, next) => {
    try {
      await getRepositories();
      next();
    } catch (err) {
      next(err);
    }
  });

  // Mount API v1
  app.use('/api/v1', v1Routes);

  // Root fallback
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'RUANGAMAN REST API Gateway. Access endpoints via /api/v1',
      docs: '/api/v1/health',
    });
  });

  // 404 Handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint tidak ditemukan',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
