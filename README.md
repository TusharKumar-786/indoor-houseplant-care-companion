# LeafPulse 🌿

> An intelligent, botanical-first indoor plant care companion built with React 18, Node.js, Express, PostgreSQL, and Google Gemini AI.

### 🌐 Live Demo: [indoor-houseplant-care-companion.vercel.app](https://leafpulse-care.vercel.app/)

> Note: the backend runs on a free Render instance, so the very first request after a period of inactivity can take 30–60 seconds to wake up.

---

## 📸 Screenshots

| Dashboard & Hydration Metrics | Plant Collection & Microclimates |
|:---:|:---:|
| ![Dashboard Overview](docs/screenshots/dashboard.svg) | ![My Plants Grid](docs/screenshots/plants.svg) |
| **Multilingual AI Companion (Ask Leafy)** | **Plant Health Diagnostic Assistant** |
| ![Ask Leafy Chat](docs/screenshots/ask-leafy.svg) | ![Health Assistant](docs/screenshots/health-assistant.svg) |

---

## ✨ Features

- **🌿 Dynamic Botanical Care Engine:** Calculates exact watering countdowns from real physical care logs rather than fixed calendar alarms:
  $$\text{Next Watering Date} = \text{Last Watered Date} + \text{Frequency Days}$$
- **🤖 Multilingual Botanical Companion (Leafy):** Powered by Google Gemini (`gemini-2.5-flash`), Leafy understands and responds in **English, Hindi (Devanagari), and conversational Hinglish**, maintaining full context across multiturn follow-up conversations with an offline botanical fallback.
- **☀️ Microclimate & Sunlight Architecture:** Group houseplants into dedicated rooms tagged with real window orientations (South, East, West, North) to match exposure against species light needs.
- **🩺 Plant Health Assistant:** Diagnostic symptom engine detecting overwatering, underwatering, spider mites, chlorosis, and light shock with structured recovery protocols.
- **📈 Growth Journal & Timeline:** Record photos, height milestones in centimeters, notes, and seasonal repotting events.
- **📅 Care Schedule & Interactive Calendar:** Daily due-today watering queue, 7-day glance, and monthly care calendar view.
- **✨ Fluid & Accessible UI:** Designed with warm botanical tones (Deep Moss, Fern, Sage Mist, Oat Cream, Terracotta, and Pale Lime), Fraunces and Inter typography, Framer Motion stagger animations, and strict `prefers-reduced-motion` compliance.

---

## 🛠️ Tech Stack

- **Client:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
- **Server:** Node.js (v20+ / v22+), Express 4, TypeScript, raw `pg` (PostgreSQL client pool)
- **Database:** PostgreSQL 15+ (Local / Supabase / Neon)
- **AI Engine:** Google Gemini API (`gemini-2.5-flash`, Free Tier)
- **Media Hosting:** Cloudinary (Permanent cloud storage for uploaded plant photos)
- **Email:** Resend (Transactional password reset emails)
- **Validation & Security:** Zod schemas, Helmet, express-rate-limit, CORS origin protection, bcryptjs, JWT
- **Hosting:** Vercel (frontend), Render (backend), Supabase (database)

---

## 📂 Project Structure

```
LeafPulse/
├── client/                 # React 18 + Vite frontend
│   ├── public/             # Static assets, favicon.svg, site.webmanifest, botanical photos
│   └── src/
│       ├── api/            # Axios API client & error interceptor
│       ├── components/     # UI primitives, Drawer, Modal, EmptyState, AskLeafyDrawer
│       ├── context/        # AuthContext & Session management
│       ├── pages/          # 21 Lazy-loaded application route views
│       └── utils/          # Date formatting, image CDN helpers
├── server/                 # Express + TypeScript backend
│   ├── src/
│   │   ├── config/         # Environment, PostgreSQL pool, and security configs
│   │   ├── middleware/     # Auth (JWT verification), rate limiting, Zod validation
│   │   ├── routes/         # REST API routes (plants, rooms, schedule, logs, leafy, health)
│   │   ├── services/       # Gemini AI service, Resend email service, Cloudinary storage
│   │   └── __tests__/      # Automated Jest & Supertest test suites
│   └── tests/
│       ├── browser/        # Puppeteer E2E browser test scripts
│       └── load/           # Autocannon concurrency & stress test scripts
├── db/                     # Database migrations and seed files
│   ├── init.sql            # Idempotent database schema & initial library
│   ├── seed-demo.sql       # Demo gardener collection & care logs
│   └── migrations/         # Sequential additive schema migrations
├── docs/                   # Full documentation & benchmarks
│   ├── DEPLOYMENT.md       # Free production deployment guide (Vercel, Render, Supabase)
│   ├── TESTING.md          # Real measured benchmark report & load test data
│   └── screenshots/        # High-resolution vector screenshots
├── .env.example            # Environment configuration template (placeholders only)
└── README.md
```

---

## ⚡ Local Setup

### 1. Prerequisites
- **Node.js** v20.x or v22.x
- **PostgreSQL** 15+ running locally (or a free Supabase / Neon connection string)
- **Git**

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/TusharKumar-786/indoor-houseplant-care-companion.git
cd indoor-houseplant-care-companion

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables
Copy the example environment files:
```bash
# In LeafPulse/server
cp .env.example .env

# In LeafPulse/client
cp .env.example .env
```

Edit `server/.env` with your values (placeholders only):
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/plantcare
JWT_SECRET=supersecretplantcarekey_changeinproduction_1234567890
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
AI_ENABLED=true
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
RESEND_API_KEY=your_resend_api_key_here
MAIL_FROM=LeafPulse <notifications@leafpulse.app>
ADMIN_EMAIL=tushar@example.com
```

### 4. Database Initialization
```bash
# From project root, run schema migrations
cd server
npm run migrate

# (Optional) Seed demo plants and rooms
npm run seed
```

### 5. Run the Application
Open two terminal windows:

```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend Client (runs on http://localhost:3000)
cd client
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables Reference

| Variable | Environment | Description | Example / Placeholder |
|:---|:---:|:---|:---|
| `DATABASE_URL` | Server | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/plantcare` |
| `DB_SSL` | Server | Enable SSL for cloud PostgreSQL (Supabase/Neon) | `true` or `false` |
| `JWT_SECRET` | Server | Min 32-character secret for signing tokens | `generate_with_openssl_rand_hex_32` |
| `CORS_ORIGIN` | Server | Allowed frontend origins (no `*` in prod) | `http://localhost:3000` or `https://app.com` |
| `AI_ENABLED` | Server | Flag to enable Gemini assistant | `true` |
| `GEMINI_API_KEY` | Server | Google AI Studio free tier key | `your_gemini_api_key_here` |
| `GEMINI_MODEL` | Server | Gemini model identifier | `gemini-2.5-flash` |
| `RESEND_API_KEY` | Server | Transactional email API key | `re_your_api_key_here` |
| `CLOUDINARY_URL` | Server | Cloudinary signed storage URI | `cloudinary://api_key:secret@cloud_name` |
| `VITE_API_URL` | Client | Backend API URL for client requests | `http://localhost:5000` |

---

## 📜 Available NPM Scripts

### Backend (`/server`)
| Script | Command | Purpose |
|:---|:---|:---|
| `npm run dev` | `ts-node-dev src/index.ts` | Starts backend development server with hot-reload |
| `npm run build` | `tsc -p tsconfig.build.json` | Type-checks and compiles TypeScript into `/dist` |
| `npm start` | `node dist/index.js` | Starts compiled production server |
| `npm test` | `jest --runInBand` | Runs automated unit and integration tests |
| `npm run test:load` | `node tests/load/load-test.js` | Executes Autocannon concurrency & stress benchmark |
| `npm run migrate` | `ts-node scripts/migrate.ts` | Executes database migration files sequentially |

### Frontend (`/client`)
| Script | Command | Purpose |
|:---|:---|:---|
| `npm run dev` | `vite` | Starts Vite local development server on port 3000 |
| `npm run build` | `tsc && vite build` | Type-checks and creates production bundle in `/dist` |
| `npm run preview` | `vite preview` | Previews production build locally |

---

## 🧪 Testing & Deployment Documentation

- [Deployment Guide (docs/DEPLOYMENT.md)](docs/DEPLOYMENT.md) — Free step-by-step setup on Vercel, Render, and Supabase.
- [Testing & Benchmark Report (docs/TESTING.md)](docs/TESTING.md) — Real measured concurrency tests, breaking point analysis, and API coverage.

---

## 📄 License & Contact

- **License:** MIT License. Built for plant keepers everywhere.
- **Author:** Tushar Kumar
- **Live Site:** [indoor-houseplant-care-companion.vercel.app](https://leafpulse-care.vercel.app/)
- **Security:** Please never commit real credentials or API keys. Follow instructions in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) to set secure secrets in production environments.
