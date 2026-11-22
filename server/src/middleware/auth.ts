import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { query } from '../config/db';
import { UserPayload } from '../types';

interface UserActiveCache {
  exists: boolean;
  isActive: boolean;
  timestamp: number;
}

const activeUserCache = new Map<number, UserActiveCache>();
const CACHE_TTL_MS = 60 * 1000;

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;

    // Verify user exists and is active (cached for 60 seconds)
    const now = Date.now();
    const cached = activeUserCache.get(decoded.id);

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      if (!cached.exists || !cached.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account not found or inactive.',
        });
        return;
      }
    } else {
      const userRes = await query(
        'SELECT id, is_active FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
        activeUserCache.set(decoded.id, {
          exists: userRes.rows.length > 0,
          isActive: userRes.rows[0]?.is_active || false,
          timestamp: now,
        });
        res.status(401).json({
          success: false,
          message: 'Account not found or inactive.',
        });
        return;
      }

      activeUserCache.set(decoded.id, {
        exists: true,
        isActive: true,
        timestamp: now,
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};
