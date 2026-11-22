import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_JWT_SECRET = 'supersecretplantcarekey_changeinproduction_1234567890';

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    console.error(`[STARTUP ERROR] Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

// Warn / fail in production if default secret or no DATABASE_URL
if (nodeEnv === 'production') {
  if (jwtSecret === DEFAULT_JWT_SECRET) {
    console.error('[STARTUP ERROR] JWT_SECRET is using the insecure default value. Set a strong secret in production.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('[STARTUP ERROR] DATABASE_URL must be set in production.');
    process.exit(1);
  }
  if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN.trim() === '*' || process.env.CORS_ORIGIN.includes('*')) {
    console.error('[STARTUP ERROR] In production, CORS_ORIGIN must be set to an explicit allowed origins list (e.g. https://leafpulse.vercel.app), and cannot be "*".');
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  db: {
    connectionString: requireEnv('DATABASE_URL', 'postgresql://postgres@127.0.0.1:5432/plantcare'),
    max: parseInt(process.env.DB_POOL_MAX || '30', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000', 10),
  },
  upload: {
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    mailFrom: process.env.MAIL_FROM || 'LeafPulse <notifications@leafpulse.app>',
    adminEmail: process.env.ADMIN_EMAIL || 'tushar@example.com',
  },
  ai: {
    enabled: process.env.AI_ENABLED === 'true' || (process.env.NODE_ENV !== 'production' && !!process.env.GEMINI_API_KEY),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  },
};
