# LeafPulse — Comprehensive Security Audit & Hardening Report

## 1. Security Architecture Summary
LeafPulse adheres to defense-in-depth principles across transport, authentication, authorization, database storage, and input sanitization layers.

---

## 2. Phase 1 Audit Vulnerabilities & Remediations

| Vulnerability ID | Severity | File / Component | Initial Vulnerability | Applied Hardening Fix | Status |
|---|---|---|---|---|---|
| **SEC-01** | **CRITICAL** | `server/.env.example` | Real database password (`[REDACTED_PASSWORD]`) and real JWT secret committed to version control in example template. | Replaced all sensitive values with generic configuration placeholders (`change_this_to_a_long_random_string`). | **RESOLVED** |
| **SEC-02** | **CRITICAL** | `server/src/app.ts` | Overly permissive CORS wildcard `origin: '*'` configured with `credentials: true`. | Replaced with dynamic origin checking against `config.corsOrigin` environment variable. | **RESOLVED** |
| **SEC-03** | **CRITICAL** | API Gateway | No rate limiting implemented on `/api/auth` or general `/api/*` endpoints. | Integrated `express-rate-limit` with strict windowing: 20 req/15min on auth endpoints; 200 req/min on general API. | **RESOLVED** |
| **SEC-04** | **CRITICAL** | `server/src/config/env.ts` | Default fallback JWT secret used in production without startup validation. | Added startup assertion: fails fast with process exit code 1 if `NODE_ENV=production` and default JWT secret or missing `DATABASE_URL` is detected. | **RESOLVED** |
| **SEC-05** | **HIGH** | `db/schema.sql` | Destructive `DROP TABLE ... CASCADE` executed unconditionally on schema execution. | Isolated initial schema into non-destructive migration scripts with `CREATE TABLE IF NOT EXISTS`. | **RESOLVED** |
| **SEC-06** | **HIGH** | `server/src/routes/auth.routes.ts` | Edge-case SQL concatenation bug when updating passwords without name/email. | Re-architected dynamic SQL generator to use unified parameter array indexing. | **RESOLVED** |
| **SEC-07** | **MEDIUM** | `server/src/app.ts` | Excessive JSON body parsing limit (`10mb`). | Lowered body limits to `1mb` for JSON and URL-encoded payloads; file uploads managed specifically via Multer with a 5MB limit. | **RESOLVED** |
| **SEC-08** | **MEDIUM** | Security Headers | `contentSecurityPolicy: false` disabled in Helmet. | Configured strict Helmet CSP directives restricting `defaultSrc`, `scriptSrc`, `styleSrc`, and `imgSrc`. | **RESOLVED** |
| **SEC-09** | **MEDIUM** | `.gitignore` | Missing root `.gitignore` allowing `pgdata/` and `.env` to leak. | Created comprehensive root `.gitignore` blocking `.env`, `pgdata/`, build artifacts, and logs. | **RESOLVED** |
| **SEC-10** | **LOW** | `client/src/context/AuthContext.tsx` | Unhandled `JSON.parse` from `localStorage` risking app crashes on corrupted data. | Wrapped parser in try/catch block with automatic token cleanup. | **RESOLVED** |

---

## 3. Threat Modeling & Mitigation Matrix

### 3.1 Horizontal Privilege Escalation (User Isolation)
- **Threat:** User A accesses or modifies plants, rooms, or logs belonging to User B by guessing primary keys.
- **Mitigation:** Every SQL query contains an explicit `WHERE user_id = $1` constraint derived directly from the verified JWT payload (`req.user.id`). Foreign key lookups verify ownership prior to update or deletion.

### 3.2 SQL Injection (SQLi)
- **Threat:** Malicious inputs in search or form fields manipulating SQL syntax.
- **Mitigation:** Zero raw string concatenation for user parameters. All database queries use parameterized placeholders (`$1`, `$2`, etc.) handled by `pg` query planner.

### 3.3 Cross-Site Scripting (XSS)
- **Threat:** Script injection into plant nicknames, notes, or journals executing in other users' browsers.
- **Mitigation:** React's automatic JSX string escaping prevents DOM injection. Content Security Policy (CSP) headers block execution of unauthorized inline scripts.

### 3.4 Denial of Service & Brute Force
- **Threat:** Automated credential stuffing attacks against `/api/auth/login`.
- **Mitigation:** Strict IP-based rate limiting via `authLimiter` allowing maximum 20 attempts per 15 minutes before temporary lockout.

### 3.5 File Upload Exploits
- **Threat:** Uploading executable scripts disguised as images or uploading gigabyte files to exhaust disk storage.
- **Mitigation:** Multer restricts uploads to `image/*` MIME types and enforces a strict 5MB limit. Files are renamed using cryptographic timestamps and random integer suffixes.
