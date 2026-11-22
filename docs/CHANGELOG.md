# LeafPulse — Changelog & Version History

All notable changes to the LeafPulse platform are documented in this file.

---

## [v2.0.0] — 2026-11-19 (Production Hardening & Feature Expansion)

### Added
- **Plant Growth Journal:** Added database migration `001_growth_journal.sql`, backend endpoints (`GET/POST/DELETE /api/plants/:id/journal`), and interactive frontend milestone timeline in `PlantDetailPage.tsx` with height tracking.
- **Plant Health Assistant:** Added botanical diagnostic route `POST /api/health-assistant` and dedicated responsive page (`/health-assistant`) diagnosing overwatering, pests, low humidity, dehydration, and nutrient deficiencies.
- **Smart Care Notifications:** Implemented browser Notifications API hook (`useNotifications.ts`) with toggle preference in `ProfilePage.tsx` and persistent alert controls.
- **Interactive Weekly Care Chart:** Added SVG bar chart visualizing 7-day care action trends directly on the dashboard.
- **Curated Botanical Tips:** Added daily rotating care tip engine on the dashboard.
- **Comprehensive Documentation Suite:** Authored 10 thorough technical and operational guides in `/docs`.
- **Automated Feature Tests:** Added `server/src/__tests__/features.test.ts` bringing test coverage to 29 automated tests.

### Security & Stability Hardening
- **Secrets Redaction:** Removed exposed credentials from `server/.env.example` and created root `.gitignore` blocking `.env` and `pgdata/`.
- **CORS Hardening:** Replaced wildcard origin with dynamic validation against `CORS_ORIGIN` environment variable.
- **Rate Limiting:** Added `express-rate-limit` protecting `/api/auth` (20 req/15min) and general API routes (200 req/min).
- **Startup Environment Validation:** Added assertion in `server/src/config/env.ts` verifying required production variables and blocking default fallback keys.
- **Payload Limits:** Restricted JSON and URL-encoded request body sizes to 1MB.
- **Content Security Policy:** Configured Helmet CSP directives for scripts, styles, and image sources.

---

## [v1.5.0] — 2026-11-19 (Botanical UI/UX Redesign)

### Added
- **Botanical Color Tokens:** Configured Forest Green (`#145C3D`), Sage Green (`#A8C3A0`), Warm Cream (`#F7F8F2`), Botanical Mint (`#DDF3E5`), Soft Amber (`#F4C66A`), and Muted Coral (`#E98278`).
- **Botanical Landing Page:** Redesigned landing page with curated houseplant showcase, 3-step process, FAQ accordion, and testimonial social proof.
- **Sidebar & Navigation:** Implemented forest green desktop navigation and mobile bottom nav bar.
- **Form Enhancements:** Restyled login, register, plant creation, and logbook modals with botanical input tokens.

---

## [v1.0.0] — Initial Release (Core PlantCare)

### Added
- User registration and login with JWT and bcrypt password hashing.
- Room management with orientation metadata.
- Plant inventory CRUD with atomic care requirement creation.
- Dynamic watering countdown calculations based on `log_book` join queries.
- Tabbed schedule filtering (Due Today, Next 7 Days, All).
- Care log audit trail with action filtering.
- Initial PostgreSQL schema and seed dataset.
