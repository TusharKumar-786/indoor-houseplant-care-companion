# LeafPulse — 3-Phase Execution Roadmap & Sign-Off (PHASES.md)

## Phase 1: Foundation & Design System (COMPLETED)
- [x] Full codebase review: client, server, database schemas, and existing tests.
- [x] `framer-motion` installed in client.
- [x] Custom design tokens configured in `client/tailwind.config.js` (`deepMoss`, `fern`, `sageMist`, `oatCream`, `terracotta`, `bark`, `paleLime`).
- [x] Font pairing configured in `client/index.html`: `Fraunces` serif + `Inter` sans.
- [x] Emoji favicon replaced with custom SVG leaf mark.
- [x] `client/src/index.css` refactored with two core button styles (`.btn-primary`, `.btn-quiet`), cards, and cream shimmer skeleton.
- [x] 11 real authentic photographs downloaded to `client/public/images/plants/` in WebP format.
- [x] `docs/IMAGE-CREDITS.md` generated with photographer names and source links.
- [x] `db/schema.sql` made idempotent and non-destructive (removed DROP CASCADE).
- [x] `db/migrations/002_new_features.sql` created for avatar, blog, contact, and plant library.
- [x] `puppeteer-core` moved to devDependencies in `server/package.json`.
- [x] `client/src/components/Layout.tsx` restyled with Deep Moss sidebar and overdue care badge.
- [x] `LoginPage.tsx` and `RegisterPage.tsx` restyled with warm human copy and new tokens.
- [x] Shared UI components created: `Logo.tsx`, `Button.tsx`, `Card.tsx`, `Skeleton.tsx`.
- [x] Client TypeScript compilation verified: **0 errors**.
- [x] Server TypeScript compilation verified: **0 errors**.

## Phase 2: Pages & Features (COMPLETED)
- [x] `LandingPage.tsx` completely rebuilt across all 10 required sections (Navbar, Hero collage, Photo strip, Timeline, Asymmetric features, Metrics, Blog preview, Believable reviews, Accordion FAQ, Contact form, Footer).
- [x] `DashboardPage.tsx` rebuilt with two distinct user states:
  - First-time user: Guided welcome, 3-step setup checklist with dynamic progress, 5 suggested beginner plants with one-click pre-fill, Plant of the Day card.
  - Returning user: Stat cards, Smart Suggestions panel (`/api/suggestions`), due today list, weekly care activity SVG chart, quick actions.
- [x] `GET /api/suggestions` implemented: rule-based watering checks, room window light mismatch analysis, neglect warnings, seasonal tips, and optional Gemini AI insight.
- [x] Blog feature implemented:
  - Backend: `server/src/routes/blog.routes.ts` (public GET, authenticated POST, PUT, DELETE with ownership check).
  - Frontend: `BlogPage.tsx`, `BlogPostPage.tsx`, `WriteBlogPage.tsx`.
- [x] Contact form implemented:
  - Backend: `server/src/routes/contact.routes.ts` with rate-limiting and Zod validation.
  - Frontend: Live contact form on landing page.
- [x] Plant library catalogue implemented:
  - Backend: `server/src/routes/plantLibrary.routes.ts` with search query support.
- [x] Profile picture / avatar feature implemented:
  - Backend: `POST /api/auth/avatar` and `DELETE /api/auth/avatar` using Multer.
  - Frontend: `ProfilePage.tsx` with upload, instant preview, and delete actions.
  - Avatar initials fallback across sidebar and top capsule.
- [x] Remaining pages restyled with new tokens: `PlantsPage.tsx`, `PlantDetailPage.tsx`, `RoomsPage.tsx`, `SchedulePage.tsx`, `LogBookPage.tsx`, `PlantHealthPage.tsx`, `NotFoundPage.tsx`.
- [x] Client production build (`tsc && vite build`) passed: **0 errors**.

## Phase 3: Quality, Testing, Deployment & Docs (COMPLETED)
- [x] Comprehensive test suite created in `server/src/__tests__/newEndpoints.test.ts`.
- [x] `client/vercel.json` configured for SPA routing.
- [x] `server/src/config/db.ts` updated with production SSL auto-negotiation for Supabase.
- [x] Comprehensive documentation generated:
  - `docs/ARCHITECTURE.md`
  - `docs/PRD.md`
  - `docs/TRD.md`
  - `docs/DESIGN.md`
  - `docs/RULES.md`
  - `docs/PHASES.md`
  - `docs/TEST.md`
  - `docs/DEPLOY.md`
  - `docs/IMAGE-CREDITS.md`
