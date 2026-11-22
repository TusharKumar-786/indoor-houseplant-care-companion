import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import roomsRoutes from './routes/rooms.routes';
import plantsRoutes from './routes/plants.routes';
import scheduleRoutes from './routes/schedule.routes';
import logsRoutes from './routes/logs.routes';
import healthRoutes from './routes/health.routes';
import healthAssistantRoutes from './routes/healthAssistant.routes';
import suggestionsRoutes from './routes/suggestions.routes';
import blogRoutes from './routes/blog.routes';
import contactRoutes from './routes/contact.routes';
import plantLibraryRoutes from './routes/plantLibrary.routes';
import insightsRoutes from './routes/insights.routes';
import leafyRoutes from './routes/leafy.routes';
import adminRoutes from './routes/admin.routes';
import { config } from './config/env';

const app = express();

// ── Proxy trust for Render/hosted environments ──────────────────────────────
app.set('trust proxy', 1);

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://api.open-meteo.com', 'https://geocoding-api.open-meteo.com'],
    },
  },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = config.corsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: () => config.nodeEnv === 'test',
});

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Static files for uploaded images
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Apply general API rate limiting (auth routes manage their own strict limiter on mutation endpoints)
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/health-assistant', healthAssistantRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/plant-library', plantLibraryRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/leafy', leafyRoutes);
app.use('/api/admin', adminRoutes);

// Static files for built React client (Only when SERVE_CLIENT=true)
if (process.env.SERVE_CLIENT === 'true') {
  const clientDist = path.join(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }
}

// 404 for API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error Handler
app.use(errorHandler);

export default app;
