import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'RUANGAMAN API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Public and Admin routes
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);

export default router;
