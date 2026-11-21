import { app } from './app.js';
import { config } from './config/env.js';
import { initRepositories } from './repositories/repository.factory.js';
import { logger } from './utils/logger.js';

const PORT = config.port;

// Inisialisasi repositories sebelum menerima request
initRepositories().then(() => {
  app.listen(PORT, () => {
    logger.info(`=================================================`);
    logger.info(`🛡️  RUANGAMAN REST API Server Running`);
    logger.info(`📍 Port: http://localhost:${PORT}`);
    logger.info(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
    logger.info(`🌍 Environment: ${config.env}`);
    logger.info(`=================================================`);
  });
});
