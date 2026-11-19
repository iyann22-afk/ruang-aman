import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`=================================================`);
  logger.info(`🛡️  RUANGAMAN REST API Server Running`);
  logger.info(`📍 Port: http://localhost:${PORT}`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
  logger.info(`🌍 Environment: ${config.env}`);
  logger.info(`=================================================`);
});
