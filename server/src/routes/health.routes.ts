import { Router, Request, Response } from 'express';
import { query } from '../config/db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const dbPromise = query('SELECT 1');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timed out after 2s')), 2000)
    );

    await Promise.race([dbPromise, timeoutPromise]);

    res.json({
      status: 'ok',
      db: 'connected',
      version: '1.0.0',
      uptime: process.uptime(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'degraded',
      db: 'unreachable',
      error: error.message || 'Database connection error',
    });
  }
});

export default router;
