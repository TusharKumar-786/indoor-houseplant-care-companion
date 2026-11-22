# LeafPulse — Production Deployment Guide

A step-by-step, beginner-friendly guide to deploying LeafPulse on a **100% free or low-cost** production stack:
- **Frontend:** Vercel (Free Hobby Tier)
- **Backend:** Render (Free Web Service)
- **Database:** Supabase or Neon (Free Tier PostgreSQL)
- **Media Storage:** Cloudinary (Free Tier Image CDN)
- **Transactional Email:** Resend (Free Tier, 3,000 emails/month)
- **AI Botanical Companion:** Google Gemini (`gemini-2.5-flash`, Free Tier via Google AI Studio)

---

## Architecture Overview

```mermaid
flowchart TD
    User["User Browser / Mobile PWA"] -->|HTTPS / SPA| Vercel["Frontend: Vercel (React 18 + Vite)"]
    User -->|API Requests / JWT| Render["Backend: Render Web Service (Node/Express TS)"]
    Vercel -->|REST / JSON| Render
    Render -->|PostgreSQL Wire Protocol + SSL| Supabase[("Database: Supabase / Neon PostgreSQL")]
    Render -->|Signed Image Uploads| Cloudinary["Image CDN: Cloudinary"]
    Render -->|x-goog-api-key REST| Gemini["AI Engine: Gemini 2.5 Flash"]
    Render -->|HTTPS REST| Resend["Email Delivery: Resend"]
```

---

## 1. Database Setup (Supabase or Neon)

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**, choose an organization, name your database (e.g., `leafpulse-db`), and set a secure database password.
3. Once provisioned, navigate to **Project Settings** → **Database**.
4. Under **Connection string**, select **URI** and copy the connection string.
   - For Node.js / `pg`, use the **Session Mode** or **Transaction Pooler** URL (Port `5432` or `6543`).
   - Format: `postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`

### Option B: Neon
1. Go to [neon.tech](https://neon.tech) and create a project.
2. Copy the pooled connection string ending in `?sslmode=require`.

### Running Database Migrations
You can apply the database migrations directly from your local terminal or via Supabase SQL Editor:

**Method 1: Local Terminal**
```bash
cd server
export DATABASE_URL="postgresql://postgres.[ref]:[password]@...:6543/postgres?sslmode=require"
npm run migrate
```

**Method 2: Supabase Web SQL Editor**
1. Open the Supabase dashboard and go to **SQL Editor**.
2. Open `LeafPulse/db/init.sql` and run its contents to build all tables (`users`, `plants`, `rooms`, `care_requirements`, `log_book`, `growth_journal`).
3. (Optional) Run `LeafPulse/db/seed-demo.sql` if you want sample plants and rooms pre-populated.

---

## 2. Cloudinary Media Storage Setup

Since serverless and container platforms (Render, Railway, Heroku) use ephemeral file systems, local disk storage under `./uploads` is wiped on restart. Cloudinary provides permanent image hosting.

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From your Cloudinary Dashboard, copy the **API Environment variable**:
   `cloudinary://<api_key>:<api_secret>@<cloud_name>`
3. This single string will be set as `CLOUDINARY_URL` on Render.

---

## 3. Google Gemini AI API Key

LeafPulse uses Gemini for the Leafy botanical chatbot:
1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and sign in.
2. Click **Create API Key**.
3. Copy the key. It will be configured as `GEMINI_API_KEY`.
4. The backend uses `gemini-2.5-flash` by default, which is completely free.

---

## 4. Transactional Email Setup (Resend)

Used for secure password reset verification emails:
1. Create a free account at [resend.com](https://resend.com).
2. Go to **API Keys** → **Create API Key** (full access) and copy `re_...`.
3. If you have a custom domain: go to **Domains** → add domain and copy the DNS records (DKIM, SPF) to your registrar.
4. If testing without a domain: use `onboarding@resend.dev` as `MAIL_FROM` to send to your verified account email.

---

## 5. Backend Deployment (Render)

1. Push your project to GitHub.
2. Sign in to [render.com](https://render.com) and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name:** `leafpulse-api`
   - **Region:** Closest to your database region (e.g., Frankfurt, Oregon, Singapore)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Click **Advanced** and set the **Health Check Path** to `/api/health`.
6. Add the following **Environment Variables**:

| Variable | Recommended Production Value | Description |
|:---|:---|:---|
| `NODE_ENV` | `production` | Enables production security, SSL, and error hiding |
| `PORT` | `5000` | Port Render binds (or leaves default) |
| `DATABASE_URL` | `postgresql://...` | Connection string from Supabase or Neon |
| `DB_SSL` | `true` | Enforces SSL encryption for hosted Postgres |
| `JWT_SECRET` | *(64-character random string)* | Secret for auth tokens (generate via `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `CORS_ORIGIN` | `https://leafpulse.vercel.app` | Exact URL of your Vercel frontend (no wildcard `*` allowed in production) |
| `FRONTEND_URL` | `https://leafpulse.vercel.app` | URL used in password reset email links |
| `AI_ENABLED` | `true` | Enables Ask Leafy botanical assistant |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Gemini key from Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Free-tier default model |
| `RESEND_API_KEY` | `re_...` | Resend API key for password reset emails |
| `MAIL_FROM` | `LeafPulse <support@yourdomain.com>` | Verified email sender |
| `ADMIN_EMAIL` | `tushar@example.com` | Grants access to `/admin` dashboard |
| `CLOUDINARY_URL` | `cloudinary://...` | Cloudinary credentials string |

> [!NOTE]
> On Render's free tier, instances spin down after 15 minutes of inactivity. The first request after sleep can take 30–50 seconds to boot. Subsequent requests respond in under 50 ms.

---

## 6. Frontend Deployment (Vercel)

1. Sign in to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client` (Click Edit and select the `client` folder)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://leafpulse-api.onrender.com` (Your Render service URL without trailing slash)
5. Click **Deploy**.

Vercel automatically detects `client/vercel.json` which provides SPA client-side routing rewrites so page reloads on routes like `/plants/1` or `/dashboard` never return 404.

---

## 7. Custom Domain & HTTPS (Optional)

1. In Vercel: go to **Settings** → **Domains** → Add `app.yourdomain.com`. Add the CNAME record to your DNS provider.
2. In Render: go to **Settings** → **Custom Domains** → Add `api.yourdomain.com`. Add the CNAME record.
3. Remember to update `CORS_ORIGIN` and `FRONTEND_URL` on Render to match your new domain.

---

## 8. Post-Deployment Verification Checklist

- [ ] Visit `https://leafpulse-api.onrender.com/api/health` → returns `{"status":"ok","db":"connected"}`.
- [ ] Visit frontend on Vercel → Landing page loads with crisp botanical typography.
- [ ] Register a new account → redirected to `/dashboard`.
- [ ] Add a room (e.g., "Living Room" with "South" exposure).
- [ ] Add a plant with a photo upload → verify photo saves and renders via Cloudinary.
- [ ] Open **Ask Leafy** drawer:
  - Ask in English: "How often should I water my plant?" → receives botanical answer.
  - Ask in Hindi: "पौधों में पानी कब देना चाहिए?" → receives natural Hindi answer in Devanagari.
  - Ask in Hinglish: "Patte peele ho rahe hain, kya karu?" → receives natural Hinglish answer.
- [ ] Trigger Forgot Password on login page → verify email arrives with valid reset link.
- [ ] Refresh page on an internal route (`/schedule`, `/plants`) → loads cleanly without 404.

---

## 9. Common Troubleshooting

| Symptom | Cause | Solution |
|:---|:---|:---|
| **CORS Error in Browser** | `CORS_ORIGIN` does not match the frontend URL | Set `CORS_ORIGIN` on Render to match `https://your-app.vercel.app` (no trailing slash). |
| **500 on Login / Database Crash** | `DATABASE_URL` missing or SSL disabled | Verify connection string ends with `?sslmode=require` and `DB_SSL=true` is set. |
| **Chatbot always gives fallback message** | `GEMINI_API_KEY` invalid or `AI_ENABLED` false | Check Render server logs for `[GEMINI SERVICE]`. Ensure `gemini-2.5-flash` model is active and API key has no leading/trailing spaces. |
| **Uploaded plant photos disappear** | `CLOUDINARY_URL` missing | Set `CLOUDINARY_URL` on Render. Without it, images store in ephemeral local `./uploads`. |
| **Blank page on refresh in Vercel** | SPA routing rewrite missing | Verify `client/vercel.json` exists with the rewrite rule to `/index.html`. |
| **Render startup error: JWT_SECRET weak** | Secret is shorter than 32 chars in production | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste the 64-char string into `JWT_SECRET`. |
