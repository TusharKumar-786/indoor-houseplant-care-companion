# LeafPulse — Technical Requirements Document (TRD)

## 1. Technical Stack Summary
- **Client**: React 18.3, Vite 6, TypeScript 5.7, Tailwind CSS 3.4, Framer Motion, Axios, Lucide React.
- **Server**: Node.js, Express 4.21, TypeScript 5.7, Raw pg 8.13 (PostgreSQL Client with Connection Pooling), Multer, Zod 3.24, Helmet 8.0, bcryptjs, jsonwebtoken, express-rate-limit.
- **Database**: PostgreSQL (tested with local PostgreSQL 16 / Supabase).
- **Deployment Targets**: Vercel (Client), Render (Server), Supabase (Database). **Zero Docker files.**

## 2. Frontend Specifications
- **Build System**: Vite with TypeScript compiler checks (`tsc && vite build`).
- **Styling Architecture**: Tailwind CSS with custom design tokens in `tailwind.config.js` and component utility classes in `src/index.css`:
  - `.btn-primary`: Deep Moss solid (`#1F3D2B`), white text, active press motion.
  - `.btn-quiet`: Oat Cream surface (`#F5F1E6`), Deep Moss text, border `#C9D8C5`.
  - `.btn-accent`: Terracotta solid (`#C8693F`), used for urgent actions.
  - `.card`: Base white container, rounded 2xl, soft shadow.
  - `.skeleton`: Two-stop cream shimmer for asynchronous loading states.
- **Fonts**: Loaded via Google Fonts:
  - Heading Serif: `Fraunces` (weights 400, 600, 700).
  - Body Sans: `Inter` (weights 400, 500, 600, 700).

## 3. Backend Specifications
- **Architecture**: Modular Express router structure with middleware pipelines:
  - `middleware/auth.ts`: Verifies JWT bearer token and sets `req.user`.
  - `middleware/validate.ts`: Validates request bodies against Zod schemas.
  - `middleware/errorHandler.ts`: Maps PostgreSQL error codes (`23505` duplicate, `23503` FK violation) to clean JSON responses.
- **Endpoints**:
  - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile`
  - `POST /api/auth/avatar`, `DELETE /api/auth/avatar`
  - `GET /api/dashboard` (with in-memory 10-second cache and write invalidation)
  - `GET /api/suggestions` (rule-based + optional Gemini AI)
  - `GET /api/rooms`, `POST /api/rooms`, `PUT /api/rooms/:id`, `DELETE /api/rooms/:id`
  - `GET /api/plants`, `POST /api/plants` (atomic transaction), `GET /api/plants/:id`, `PUT /api/plants/:id`, `DELETE /api/plants/:id`
  - `GET /api/plants/:id/journal`, `POST /api/plants/:id/journal`, `DELETE /api/plants/:id/journal/:entryId`
  - `GET /api/schedule` (today/week/all filters)
  - `GET /api/logs`, `POST /api/logs`, `DELETE /api/logs/:id`
  - `POST /api/health-assistant` (botanical diagnostic engine)
  - `GET /api/blog`, `GET /api/blog/:slug`, `POST /api/blog`, `PUT /api/blog/:slug`, `DELETE /api/blog/:slug`
  - `POST /api/contact` (rate-limited inquiries)
  - `GET /api/plant-library` (catalogue search)
  - `GET /api/health` (database health probe)

## 4. Production Resilience & Security
- **Strict Tenant Isolation**: Every query accessing user resources filters on `p.user_id = $1`.
- **Atomic Transactions**: Plant creation inserts care requirements and plant entity within a single `BEGIN...COMMIT` block.
- **SSL Auto-Negotiation**: PostgreSQL pool automatically negotiates `ssl: { rejectUnauthorized: false }` for Supabase poolers in production.
- **Secrets Policy**: Real secrets reside strictly in deployment environment variables. `.env` files are strictly gitignored.
