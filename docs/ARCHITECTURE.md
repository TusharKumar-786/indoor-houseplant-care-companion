# LeafPulse — System Architecture Document

## 1. System Overview
**LeafPulse** is an indoor houseplant care companion designed to eliminate guesswork from domestic gardening. It pairs botanical care logic with apartment window light orientations, growth milestone tracking, and seasonal care rhythms.

```
┌─────────────────────────────────────────────────────────────┐
│                 Client (React 18 + Vite)                    │
│      Tailwind CSS tokens • Framer Motion • Lucide Line      │
│      Hosted on Vercel (SPA with vercel.json rewrites)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Server (Node.js + Express)                  │
│       TypeScript • Zod Validation • Helmet • Rate-Limit      │
│       Hosted on Render (Web Service)                        │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
       SQL Connection (pg)            Gemini API (Optional)
       SSL / Connection Pooling       Rule fallback on failure
               ▼                               ▼
┌──────────────────────────────┐      ┌───────────────────────┐
│     PostgreSQL Database      │      │ Google Gemini Flash   │
│   Hosted on Supabase         │      │ Restful AI tips       │
└──────────────────────────────┘      └───────────────────────┘
```

## 2. Architectural Principles
1. **Human-Centric & Anti-AI-Slop**: Reject generic gradient cards, floating blobs, emoji decorations, and robotic marketing copy. Replace with large editorial serif typography (Fraunces), warm Oat Cream background, Deep Moss navigation, and real licensed botanical photography.
2. **Rule-Based Baseline with Optional AI**: Core smart care calculations (watering projections, light orientation matching, neglect warnings) are 100% deterministic and execute directly via SQL and TypeScript without third-party API dependencies. Optional Gemini AI personalizes prose tips when configured.
3. **Additive Database Migrations**: The database schema strictly preserves existing columns and data integrity. All new features (avatars, blog posts, contact inquiries, plant library) are provisioned through additive migrations (`002_new_features.sql`).
4. **No Docker Deployment**: Targeted cleanly for managed PaaS infrastructure:
   - Client: Vercel (Static edge distribution)
   - Server: Render (Managed Node environment)
   - Database: Supabase (Managed PostgreSQL with connection pooler)

## 3. Database Architecture

### Entity-Relationship Diagram (ERD)
```
[users] 1 ───────────< [rooms]
   │  1                     │ 1
   │                        │
   │  1                     │ 0..1
   ├──────────< [plants] >──┘
   │               │ 1
   │  1            │
   │               │ 1
   ├──────────< [care_requirements]
   │               │ 1
   │  1            │
   │               │ 0..*
   ├──────────< [log_book]
   │
   │  1 
   ├──────────< [growth_journal]
   │
   │  1
   └──────────< [blog_posts]

[plant_library] (Reference Catalogue)
[contact_messages] (Inquiries)
```

### Table Definitions
- **users**: ID, name, email, hashed password, avatar_url, is_active, created_at.
- **rooms**: ID, name, window_direction (South, East, West, North, None), user_id.
- **care_requirements**: ID, water_frequency_days, sunlight_level (Low, Medium, High), fertilizing_frequency_days.
- **plants**: ID, nickname, species, image_url, room_id, care_requirement_id, user_id, created_at.
- **log_book**: ID, plant_id, action (Watered, Fertilized, Pruned), date, notes.
- **growth_journal**: ID, plant_id, date, notes, image_url, height_cm.
- **blog_posts**: ID, user_id, title, slug, cover_image_url, read_time, excerpt, body, created_at.
- **contact_messages**: ID, name, email, message, created_at.
- **plant_library**: ID, common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip.

## 4. API Structure & Security
- **Authentication**: JWT Bearer token authentication via `Authorization: Bearer <token>`.
- **User Isolation**: All write/read routes strictly enforce tenant isolation (`WHERE user_id = req.user.id`).
- **Rate Limiting**:
  - `/api/auth/*`: 20 requests per 15 minutes window.
  - `/api/contact`: 5 requests per 15 minutes window.
  - `/api/*`: 200 requests per minute general API limit.
- **Content Security**: Helmet headers applied globally with strict cross-origin policies.
