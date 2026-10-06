# Coding Rules & AI Guardrails
**Project:** LeafPulse – Indoor Houseplant Care Companion  
**Team Name:** GreenAura  
**Team Leader:** Tushar Kumar  
**Version:** 1.0 | **Date:** 2026-09-25 | **Status:** ACTIVE  
**Applies To:** All human developers AND AI coding agents (Cursor, Windsurf, Copilot, ChatGPT)

---

## ⚠️ CRITICAL: Read Before Generating ANY Code

These rules are **NON-NEGOTIABLE**. Violations will be rejected in code review. AI agents **MUST** reference this file before every code generation task.

---

## 1. Tech Stack Enforcement

### ✅ ALLOWED

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Django + Django REST Framework | 5.x / 3.15.x |
| Language | Python | 3.12+ |
| Auth | SimpleJWT | 5.x |
| Database | PostgreSQL | 16.x |
| DB Tool | pgAdmin | 8.x |
| Cache | Redis | 7.x |
| Frontend | React + Vite | 18.x / 5.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.x |
| UI Components | Shadcn/UI (Radix primitives) | Latest |
| Icons | Lucide React | Latest |
| Forms | React Hook Form + Zod | Latest |
| Testing (BE) | Pytest + Django TestCase | Latest |
| Testing (FE) | Jest + React Testing Library | Latest |
| Testing (E2E) | Playwright | Latest |
| Security Scan | OWASP ZAP + pip-audit + npm audit | Latest |
| Accessibility | axe-core + Playwright | Latest |
| Infra | Docker, Nginx, Railway/Render | Latest |
| Design | Figma | Latest |

### ❌ STRICTLY FORBIDDEN

- Node.js/Express backend (use Django REST only)
- Flask or FastAPI (use Django REST only)
- Class components in React (functional + hooks ONLY)
- `localStorage` or `sessionStorage` for auth tokens (httpOnly cookies ONLY)
- Raw SQL queries (use Django ORM or parameterized queries ONLY)
- `print()` in production code (use Python `logging` module ONLY)
- `any` type in TypeScript (explicit types ONLY)
- `console.log` in production code (use proper logger or remove)
- `dangerouslySetInnerHTML` in React (XSS risk)
- Redux/Zustand unless justified in writing and approved by Team Leader
- CSS modules, styled-components, or inline styles (Tailwind utility classes ONLY)
- Deprecated libraries (check CVE database before adding deps)
- Hardcoded secrets, API keys, or passwords in code
- `TODO: implement later` comments in merged code
- Direct commits to `main` or `develop` branches

---

## 2. Code Style & Patterns

### Backend (Python/Django)

- **PEP 8** compliance enforced via `flake8` + `black` formatter
- **Type hints** required on all function signatures
- **Docstrings** required for all public functions (Google style)
- **Serializers** MUST be separate from Models (never expose models directly)
- **Validation:** Use DRF serializer validation on ALL endpoints
- **Error Handling:** Global exception handler with standardized error format
- **Permissions:** All endpoints require `IsAuthenticated` except `/api/auth/register`, `/api/auth/login`, `/health`
- **Queries:** Use `select_related` and `prefetch_related` to avoid N+1
- **Migrations:** Always reversible; never edit existing migrations
- **Settings:** Split into `base.py`, `dev.py`, `prod.py`; never commit secrets

### Frontend (React/TypeScript)

- **Component naming:** PascalCase (`PlantCard.tsx`)
- **Hook naming:** camelCase starting with `use` (`usePlantSearch.ts`)
- **File structure:** One component per file; co-locate tests
- **Styling:** Tailwind utility classes ONLY (no CSS modules, no styled-components)
- **State Management:** React Context for auth/user; URL params for filters; NO Redux
- **Accessibility:** Every interactive element MUST have `aria-label`; images MUST have `alt` text
- **Error Boundaries:** Wrap all route-level components
- **API Calls:** Centralized in `services/` with Axios interceptors
- **Types:** All API responses typed in `types/` directory
- **Forms:** React Hook Form + Zod validation (matches backend serializers)

### Database (PostgreSQL)

- **Table names:** snake_case plural (`plants`, `care_requirements`)
- **Column names:** snake_case (`created_at`, `water_frequency_days`)
- **ALWAYS include** `created_at`, `updated_at` timestamps
- **Foreign keys** MUST have explicit `ON DELETE` actions
- **Indexes** documented in TRD §4 before creation
- **Migrations** via Django `makemigrations` + `migrate`; version-controlled
- **pgAdmin** used locally only; never exposed in production

---

## 3. AI-Specific Guardrails

### When AI Generates Code, It MUST:

1. **Check Rules.md FIRST** – Never assume patterns
2. **Cite TRD Section** – Every generated endpoint/function must reference its TRD spec
3. **Include Tests** – Never generate code without corresponding test skeleton
4. **Use Existing Patterns** – Match existing codebase style exactly (no hybrid approaches)
5. **Flag Uncertainties** – If requirement ambiguous, ASK instead of guessing
6. **Never Modify Rules.md** – Only humans can update this file
7. **Reference BRD/PRD** – Every feature must trace to a user story or requirement

### AI Must NEVER:

- Suggest library additions without TRD approval
- Remove existing security checks "for simplicity"
- Generate code that violates BRD scope
- Assume database schema without checking TRD §4
- Use placeholder comments like `# TODO: implement later` in merged code
- Generate code without TypeScript types (frontend) or type hints (backend)
- Skip error handling or validation
- Hardcode values that should be configurable
- Ignore accessibility requirements

---

## 4. Security Mandates

| Rule | Implementation |
|------|---------------|
| Input Validation | ALL user input validated server-side via DRF serializers (client validation is UX-only) |
| Auth Tokens | Stored in httpOnly, Secure, SameSite=Strict cookies |
| SQL Injection | Prevented via Django ORM parameterized queries ONLY |
| XSS | React auto-escapes; NEVER use `dangerouslySetInnerHTML` |
| CSRF | Django CSRF middleware + SameSite cookies |
| Sensitive Data | Never log passwords, tokens, or PII; mask emails in logs |
| Passwords | bcrypt hashing via Django's `make_password`; never store plaintext |
| Dependencies | Scan with `pip-audit` (backend) and `npm audit` (frontend) on every PR |
| Secrets | GitHub Secrets → Railway env vars; NEVER committed to repo |
| Rate Limiting | DRF throttling classes per endpoint per TRD §5 |
| HTTPS | TLS 1.3 enforced via Nginx; HSTS header set |
| Admin Panel | Django Admin restricted to superusers; separate login |

---

## 5. Testing Requirements

| Type | Tool | Coverage Target | When |
|------|------|-----------------|------|
| Backend Unit | Pytest + Django TestCase | 80% service layer | Every commit |
| Backend Integration | Pytest + DRF APIClient | Critical paths (auth, plants, logs) | Pre-merge |
| Frontend Unit | Jest + React Testing Library | 70% components | Every commit |
| E2E | Playwright | User journeys (register→add plant→log) | Nightly |
| Security | OWASP ZAP Baseline Scan | 0 high/critical findings | Pre-launch |
| Accessibility | axe-core + Playwright | WCAG 2.1 AA pass | Every PR |
| Dependency | pip-audit + npm audit | 0 high/critical CVEs | Every PR |

### Test Rules:

- **Mock ALL external calls** in unit tests
- **TestContainers** for DB/Redis in integration tests
- **No test data in production DB** – use fixtures
- **Tests must be deterministic** – no flaky tests
- **Coverage gate:** PR blocked if below threshold

---

## 6. Documentation Sync Rules

- After EVERY code change that affects architecture → Update `Architecture.md`
- After EVERY new API endpoint → Update TRD §5 + OpenAPI spec
- After EVERY sprint → Update `Memory.md` with decisions/outcomes
- After EVERY breaking change → Update `Phases.md` + notify all team members
- **NEVER commit code without updating relevant docs first**
- **Figma designs** must be updated before frontend implementation begins
- **Research findings** must be logged in `Memory.md` within 24h

---

## 7. Git & PR Rules

### Branching Strategy

```
main (protected) ← production-ready only
  └── develop (protected) ← integration branch
        ├── feat/plant-crud
        ├── fix/schedule-bug
        ├── docs/update-trd
        └── test/add-e2e-tests
```

### Commit Messages (Conventional Commits)

```
feat: add plant CRUD endpoints
fix: correct due-today calculation for edge case
docs: update TRD section 5 with new endpoint
test: add integration tests for log book
refactor: extract date utility function
chore: update dependencies
```

### PR Requirements

- [ ] Min 1 approval from relevant lead
- [ ] All tests pass (CI green)
- [ ] Coverage threshold met
- [ ] Docs updated if applicable
- [ ] No `console.log` / `print()` statements
- [ ] No hardcoded secrets
- [ ] Follows all Rules.md standards
- [ ] References correct TRD section
- [ ] Security checks present (validation, auth, sanitization)
- [ ] Accessibility checks pass (axe-core)
- [ ] Memory.md entry created for significant changes

---

## 8. Review Checklist (For Humans & AI)

Before marking any PR as "Ready for Review":

- [ ] Follows all Rules.md standards
- [ ] References correct TRD section
- [ ] Includes tests meeting coverage thresholds
- [ ] No forbidden libraries/patterns used
- [ ] Security checks present (validation, auth, sanitization)
- [ ] Docs updated if applicable
- [ ] Memory.md entry created for significant changes
- [ ] No `any` types in TypeScript
- [ ] No raw SQL queries
- [ ] JWT in httpOnly cookies (not localStorage)
- [ ] Accessible (aria-labels, alt text, keyboard navigable)
- [ ] Mobile-responsive (tested at 375px, 768px, 1440px)
- [ ] Matches Figma design system

---

## 9. Team-Specific Rules (GreenAura – 7 Members)

| Role | Rule |
|------|------|
| Team Leader (Tushar) | Final approval on all PRs to `main`; gate reviews |
| UI/UX Designer | Figma designs must be approved before frontend implementation |
| Frontend Devs | No component merged without Jest test + axe-core pass |
| Backend Devs | No endpoint merged without Pytest test + serializer validation |
| DB Admin | No schema change without TRD §4 update + reversible migration |
| Research | User insights must be logged in Memory.md within 24h |
| All | Daily standup update in Memory.md; no code without docs |

---

## 10. Violation Reporting

- **Tag @tushar-kumar** in PR comments for any violation
- **AI agents** must self-report when they cannot follow a rule
- **Repeat violations** → Team Leader mediation → Faculty advisor if unresolved
- **Security violations** → Immediate halt + incident report in Memory.md

---

**LAST UPDATED:** 2026-09-25 by Tushar Kumar  
**NEXT REVIEW DATE:** 2026-10-02  
**VIOLATION REPORTING:** Tag @tushar-kumar in PR comments

---