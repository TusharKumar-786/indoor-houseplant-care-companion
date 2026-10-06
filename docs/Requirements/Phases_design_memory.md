# Phase Roadmap, Design System & Memory Tracker
**Project:** LeafPulse – Indoor Houseplant Care Companion  
**Team Name:** GreenAura  
**Team Leader:** Tushar Kumar  
**Version:** 1.0 | **Date:** 2026-09-25

---

## PART 1: PHASES.MD (Implementation Milestones)

*Each phase MUST be independently testable and demoable. No phase starts until previous is signed off.*

---

### Phase 1: Foundation & Auth (Weeks 1-2)

**Goal:** User registration, secure JWT auth, project scaffolding, Figma design system finalized

**Deliverables:**
- [ ] Django project initialized with DRF + SimpleJWT
- [ ] PostgreSQL schema deployed via Django migrations (users table only)
- [ ] Custom user model with email as username
- [ ] Registration + login + refresh + logout endpoints working
- [ ] JWT stored in httpOnly cookies (access 15min + refresh 7d)
- [ ] React shell with Vite + Tailwind + TypeScript setup
- [ ] Figma design system finalized (colors, typography, spacing)
- [ ] Landing, Register, Login pages built (from Figma screens 1-3)
- [ ] CI/CD pipeline passing (build + unit tests)
- [ ] OWASP baseline scan clean

**Acceptance Demo:** New user registers → receives JWT cookie → logs in → sees empty dashboard

**BRD Links:** FR-01, NFR-Sec  
**TRD Links:** §3, §5, §6  
**Figma Screens:** 1, 2, 3

---

### Phase 2: Plant & Room Management (Weeks 3-4)

**Goal:** Room CRUD, Plant CRUD, image upload, dashboard stats

**Deliverables:**
- [ ] `rooms` table + indexes created
- [ ] `plants` table + indexes created
- [ ] `care_requirements` table + indexes created
- [ ] Room CRUD endpoints (list, create, update, soft delete)
- [ ] Plant CRUD endpoints with room FK
- [ ] Care requirements 1:1 with plant
- [ ] Image upload to Django media root (client-side compression ≤2MB)
- [ ] Dashboard stats (Total Plants, Due Today, Rooms count)
- [ ] My Plants page with search + room filter
- [ ] Add Plant form with image upload
- [ ] Plant Detail page with care info
- [ ] Rooms page with plant count
- [ ] Integration tests for room + plant flows

**Acceptance Demo:** User creates room → adds plant with image → sets care requirements → views plant detail → edits → soft deletes

**BRD Links:** FR-02, FR-03, FR-04, FR-07  
**TRD Links:** §4, §5, §7  
**Figma Screens:** 4, 5, 6, 7, 8

---

### Phase 3: Care Schedule & LogBook (Weeks 5-6)

**Goal:** Due-today calculation, log book, search/filter, admin species

**Deliverables:**
- [ ] `log_book` table + composite index created
- [ ] `species` table for admin management
- [ ] Due-today calculation: `last_watered + frequency <= today`
- [ ] Schedule API with 3 tabs (Due Today, Next 7 Days, All)
- [ ] Redis cache for schedule queries (TTL 5 min)
- [ ] Log book CRUD (Watered, Fertilized, Pruned + notes)
- [ ] Log Book page with filter + pagination
- [ ] Plant search/filter by name, room, species
- [ ] Django Admin species management
- [ ] In-app reminder toast for overdue plants
- [ ] E2E tests for schedule + log flows

**Acceptance Demo:** User opens Care Schedule → sees Due Today plants → logs "Watered" → plant moves out of Due Today → searches by room → filters log book

**BRD Links:** FR-05, FR-06, FR-07, FR-08, FR-09  
**TRD Links:** §4, §5, §6  
**Figma Screens:** 9, 10

---

### Phase 4: Polish & Launch Prep (Weeks 7-8)

**Goal:** Performance, accessibility, security hardening, documentation, UAT

**Deliverables:**
- [ ] Lighthouse scores: Perf ≥90, A11y ≥95, Best Practices ≥95
- [ ] Load test: 200 concurrent users, p95 <800ms
- [ ] Full OWASP ZAP scan clean (0 high/critical)
- [ ] axe-core WCAG 2.1 AA pass on all pages
- [ ] Mobile responsive verified (375px, 768px, 1440px)
- [ ] PWA offline viewing working
- [ ] All Loop Engineering docs updated + reviewed
- [ ] User acceptance testing with 10+ real students
- [ ] Rollback procedure tested
- [ ] Faculty advisor sign-off

**Acceptance Demo:** Full user journey under load; accessibility audit passed; stakeholder sign-off

**BRD Links:** All NFRs, Success Criteria  
**TRD Links:** §7, §8, §9  
**Figma Screens:** 11 (mobile view), 12 (data flow), 13 (ER diagram)

---

### Phase Gate Summary

| Phase | Weeks | Gate Criteria | Approver |
|-------|-------|---------------|----------|
| Phase 1 | 1-2 | Registration + JWT working; CI/CD passing | Tushar Kumar |
| Phase 2 | 3-4 | Room + Plant CRUD; image upload working | Tushar Kumar |
| Phase 3 | 5-6 | Due-today calculation; log entries; search/filter | Tushar Kumar |
| Phase 4 | 7-8 | Lighthouse ≥90; OWASP clean; UAT passed | Tushar + Faculty |

---

## PART 2: DESIGN.MD (UI/UX System)

*Consistent visual language. Devs MUST use these tokens — no hardcoded values.*

### Color Palette (From Figma)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | #16a34a | Primary actions, links, active states |
| `--color-primary-dark` | #15803d | Hover states, emphasis |
| `--color-primary-light` | #dcfce7 | Backgrounds, badges |
| `--color-success` | #16a34a | Success messages, healthy plants |
| `--color-warning` | #ca8a04 | Due today, cautions |
| `--color-error` | #dc2626 | Overdue plants, errors, validations |
| `--color-bg` | #ffffff | Page background |
| `--color-surface` | #f8fafc | Cards, modals, elevated surfaces |
| `--color-text` | #0f172a | Primary text |
| `--color-text-muted` | #64748b | Secondary text, placeholders |
| `--color-border` | #e2e8f0 | Dividers, input borders |
| `--color-sidebar` | #064e3b | Sidebar background (dark green) |

### Typography Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| H1 | 2rem (32px) | 700 | 1.2 | Page titles |
| H2 | 1.5rem (24px) | 600 | 1.3 | Section headers |
| H3 | 1.25rem (20px) | 600 | 1.4 | Card titles |
| Body | 1rem (16px) | 400 | 1.5 | Default text |
| Small | 0.875rem (14px) | 400 | 1.5 | Captions, metadata |
| Button | 1rem (16px) | 500 | 1 | All buttons |

### Spacing System (Tailwind)

- Use ONLY Tailwind spacing scale: `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px)
- NO arbitrary values like `p-[17px]`
- Consistent vertical rhythm: sections separated by `my-8`, cards by `mb-4`

### Component Library

- **Base:** Shadcn/UI (Radix primitives) for accessible foundations
- **Icons:** Lucide React (consistent stroke width)
- **Forms:** React Hook Form + Zod validation (matches backend serializers)
- **Tables:** TanStack Table for log book
- **Notifications:** Sonner for toasts
- **Charts:** Recharts for dashboard stats (optional v2)

### Layout Rules

- **Sidebar:** Fixed left, 240px width, dark green (#064e3b), collapsible on mobile
- **Top Bar:** Greeting + user avatar + notifications
- **Main Content:** Max-width 1280px, centered, padding `p-6`
- **Bottom Nav (Mobile):** Home, My Plants, Rooms, Logs, More
- **Cards:** Rounded `rounded-lg`, shadow `shadow-sm`, border `border-border`

### Accessibility Standards

- Contrast ratio ≥ 4.5:1 for all text
- Focus visible on ALL interactive elements (Tailwind `focus-visible:ring-2`)
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<button>` (not divs)
- Alt text REQUIRED for all images; decorative images use `alt=""`
- Keyboard navigable: Tab order logical; Escape closes modals
- Touch targets ≥ 48px on mobile
- Form errors announced to screen readers

---

## PART 3: MEMORY.MD TEMPLATE (Context Tracker)

*Update DAILY during standups. Paste ENTIRE CONTENT at start of new AI chat sessions. This is your project's external RAM.*

```markdown
## CURRENT STATUS
**Active Phase:** Phase [X]: [Name]  
**Sprint:** [Y] | **Day:** [Z] of [N]  
**Last Updated:** [YYYY-MM-DD HH:MM]  

## COMPLETED THIS SPRINT
- [Task-ID] Brief description ✅ (merged/tested/demoed)
- [Task-ID] Brief description ✅ 

## IN PROGRESS
- [Task-ID] Description @assignee (ETA: [date])
- [Task-ID] Description @assignee (ETA: [date])

## BLOCKERS
- ⚠️ [Description] → Action taken: [what you did] → Needs: [who/what resolves it]
- ⚠️ [Description] → Escalated to: [person] on [date]

## KEY DECISIONS MADE
- [Date]: Decision description → Rationale → Impact on TRD/Architecture/Phases
- [Date]: Decision description → Rationale → Impact on TRD/Architecture/Phases

## DOCUMENTATION UPDATES
- [File] updated: [what changed] → Reason: [why]
- [File] needs update: [what's stale] → Assigned to: [person]

## AI CONTEXT NOTES (FOR NEXT SESSION)
- Current focus: [specific task/module]
- Recent changes affecting AI: [code/doc changes AI must know]
- Known issues/hacks: [temporary solutions AI shouldn't replicate]
- Next immediate step: [exact task for AI to start with]

## OPEN QUESTIONS / UNCERTAINTIES
- [Question] → Owner: [person] → Due: [date]
- [Question] → Owner: [person] → Due: [date]

## TEAM STATUS
- UI/UX Designer: [current task]
- Frontend Dev 1: [current task]
- Frontend Dev 2: [current task]
- Backend Dev 1: [current task]
- Backend Dev 2: [current task]
- DB Admin: [current task]
- Research: [current task]
- Team Leader (Tushar): [current focus]
```

---

## PART 4: QUICK REFERENCE – 13 FIGMA SCREENS

| # | Screen | Phase | Key Elements |
|---|--------|-------|--------------|
| 1 | Landing Page (Public) | Phase 1 | Hero, features, Get Started/Login |
| 2 | Register Page | Phase 1 | Name, email, password, confirm |
| 3 | Login Page | Phase 1 | Email, password, remember me |
| 4 | Dashboard (After Login) | Phase 2 | Greeting, stats, Plants Due Today, Quick Actions |
| 5 | My Plants Page | Phase 2 | Search, room filter, plant cards |
| 6 | Add Plant Page | Phase 2 | Nickname, species, room, care, image |
| 7 | Plant Detail Page | Phase 2 | Image, care info, recent logs |
| 8 | Rooms Page | Phase 2 | Room list, plant count, Add Room |
| 9 | Care Schedule Page | Phase 3 | Tabs, plant cards with due dates |
| 10 | Log Book Page | Phase 3 | Filter, log table, pagination |
| 11 | Mobile View (Responsive) | Phase 4 | Bottom nav, card layout |
| 12 | Data Flow | Phase 4 | React ↔ DRF ↔ PostgreSQL |
| 13 | Database Tables (ER) | Phase 4 | Users, Rooms, Plants, CareRequirements, LogBook |

---

**DOCUMENT CONTROL**  
Prepared By: Tushar Kumar | Reviewed By: Faculty Advisor  
Next Review Date: 2026-10-02 | Change Log: v1.0 Initial Draft

---

## ✅ All 8 Documents Complete!

Aapke paas ab **poora documentation set** hai:

| # | Document | Status |
|---|----------|--------|
| 1 | Project Brief | ✅ Done |
| 2 | BRD | ✅ Done |
| 3 | TRD | ✅ Done |
| 4 | Project Charter | ✅ Done |
| 5 | PRD | ✅ Done |
| 6 | Architecture | ✅ Done |
| 7 | Rules | ✅ Done |
| 8 | Phases + Design + Memory | ✅ Done |

---
