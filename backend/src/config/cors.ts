import cors from 'cors';
import { config } from './env.js';

const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

/**
 * Vercel generates a unique hostname for each Preview deployment.
 * Allow only this project's deployment hostnames, and only in Preview.
 * Production continues to rely on the explicit FRONTEND_URL allowlist.
 */
export function isAllowedVercelPreviewOrigin(origin: string): boolean {
  if (process.env.VERCEL_ENV !== 'preview') return false;

  try {
    const url = new URL(origin);
    return (
      url.protocol === 'https:' &&
      /^ruangaman-frontend-[a-z0-9-]+-iyann22-afk\.vercel\.app$/i.test(url.hostname)
    );
  } catch {
    return false;
  }
}

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      config.env === 'development' ||
      isAllowedVercelPreviewOrigin(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin ${origin} not allowed by policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
