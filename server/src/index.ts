import app from './app';
import { config } from './config/env';
import { pool } from './config/db';

const server = app.listen(config.port, () => {
  console.log(`🌿 PlantCare API server running on port ${config.port} in ${config.nodeEnv} mode`);
  console.log(`📡 Health check available at http://localhost:${config.port}/api/health`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.end();
      console.log('PostgreSQL pool drained.');
      process.exit(0);
    } catch (err) {
      console.error('Error during pool draining:', err);
      process.exit(1);
    }
  });

  // Force exit if not closed within 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
