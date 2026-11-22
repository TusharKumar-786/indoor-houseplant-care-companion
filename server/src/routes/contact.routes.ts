import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { query } from '../config/db';
import { validateBody } from '../middleware/validate';
import { config } from '../config/env';
import { sendContactNotification, sendContactConfirmation } from '../services/email.service';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 messages per 15 minutes
  message: { success: false, message: 'Too many contact messages submitted. Please try again later.' },
  skip: () => config.nodeEnv === 'test',
});

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(100),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

// POST /api/contact - Submit contact inquiry
router.post('/', contactLimiter, validateBody(contactSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, message } = req.body;

    const result = await query(
      `INSERT INTO contact_messages (name, email, message)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.toLowerCase().trim(), message.trim()]
    );

    // Asynchronously dispatch email notification to Admin & receipt to visitor without blocking or failing response
    sendContactNotification(name.trim(), email.toLowerCase().trim(), message.trim()).catch((err) => {
      console.error('[EMAIL DISPATCH ERROR - ADMIN NOTIFICATION]', err);
    });

    sendContactConfirmation(email.toLowerCase().trim(), name.trim()).catch((err) => {
      console.error('[EMAIL DISPATCH ERROR - VISITOR CONFIRMATION]', err);
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out. We have received your note and will reply promptly.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
