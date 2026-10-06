# Product Requirements Document (PRD)
**Project:** LeafPulse – Indoor Houseplant Care Companion  
**Team Name:** GreenAura  
**Team Leader:** Tushar Kumar  
**Version:** 1.0 | **Date:** 2026-09-25 | **Status:** DRAFT  
**Author:** Tushar Kumar | **BRD Reference:** v1.0 (2026-09-25)

---

## 1. Product Vision

A trusted, simple, and free indoor houseplant care companion for plant parents — helping them track plants by room, never miss a watering schedule, and log care activities — through a mobile-first web experience designed in Figma and built with Django REST + React.

---

## 2. Target Personas

| Persona | Goals | Frustrations | Key Behaviors |
|---------|-------|--------------|---------------|
| **Plant Parent** (College Student) | Keep 3-10 indoor plants healthy; remember watering schedule | Forgets watering; plants die; no room-wise organization | Checks dashboard daily; logs watering; adds plants by room |
| **Busy Professional** (Working) | Automate care reminders; track multiple plants | No time to track manually; existing apps too complex | Sets care frequency; checks "Due Today" list; logs quickly |
| **Plant Enthusiast** (Hobbyist) | Track species details; maintain log history | Wants data on plant health trends; no export option | Adds detailed notes; reviews log book; searches by species |
| **Researcher** (GreenAura Team) | Understand user plant care habits | No real user data available | Conducts interviews; analyzes log patterns; suggests features |
| **Admin** (System) | Manage plant species database; monitor system | Manual species entry; no audit trail | Adds/edits species; reviews user activity; exports reports |

---

## 3. User Stories (Prioritized)

| ID | As a... | I want to... | So that... | Priority | BRD Link |
|----|---------|-------------|-----------|----------|----------|
| US-01 | Plant Parent | Register and log in securely | My plant data stays private | Must Have | FR-01 |
| US-02 | Plant Parent | Create rooms (Living Room, Bedroom, Balcony) | I organize plants by location | Must Have | FR-02 |
| US-03 | Plant Parent | Add a plant with nickname, species, room, and image | I identify my plants easily | Must Have | FR-03 |
| US-04 | Plant Parent | Set watering frequency (e.g., every 3 days) | I know when to water | Must Have | FR-04 |
| US-05 | Plant Parent | See which plants are due today | I never miss watering | Must Have | FR-05 |
| US-06 | Plant Parent | Log "Watered" with optional notes | I track what I did and when | Must Have | FR-06 |
| US-07 | Plant Parent | Search/filter plants by name or room | I find plants quickly | Should Have | FR-07 |
| US-08 | Admin | Add/edit/delete plant species | Users pick from verified list | Should Have | FR-08 |
| US-09 | Plant Parent | Get in-app reminder for overdue plants | I act before plant dies | Nice to Have | FR-09 |
| US-10 | Plant Enthusiast | View log history per plant | I see care trends over time | Nice to Have | FR-06 |

---

## 4. Functional Specifications

### 4.1 User Registration & Login Flow

1. User visits landing page → clicks "Register"
2. Fills form: name, email, password (≥8 chars), confirm password
3. Submits → backend validates → JWT issued → httpOnly cookie set
4. User redirected to Dashboard
5. Login: email + password → JWT refresh token issued (7 days)
6. Logout: cookies cleared; redirect to landing page

### 4.2 Room Management Flow

1. User clicks "Add Room" from Dashboard or Rooms page
2. Fills form: room name (max 100 chars), window direction (North/South/East/West)
3. Submits → room appears in Rooms list
4. Edit: click edit icon → update name/direction → save
5. Delete: soft delete only (plants remain but room shows "Unassigned")
6. Max 10 rooms per user

### 4.3 Add Plant Flow

1. User clicks "Add Plant" → selects room from dropdown
2. Fills form:
   - Nickname (required, max 100 chars)
   - Species (dropdown from admin-managed list)
   - Room (required)
   - Image upload (optional, ≤2MB, client-side compressed)
3. Sets care requirements:
   - Water frequency (1-30 days)
   - Sunlight level (Low/Medium/High)
   - Fertilizing frequency (1-90 days)
4. Submits → plant appears in "My Plants" with "Due Today" if applicable

### 4.4 Care Schedule Flow

1. User opens Care Schedule page
2. Sees three tabs: **Due Today**, **Next 7 Days**, **All**
3. Due Today: plants where `last_watered + water_frequency_days <= today`
4. Next 7 Days: plants due within 7 days
5. All: every plant with next due date
6. Click plant → navigate to Plant Detail page
7. Overdue plants highlighted in red; due today in yellow

### 4.5 Log Book Flow

1. User clicks "Add Log" from Plant Detail or Log Book page
2. Selects plant from dropdown
3. Chooses action: Watered / Fertilized / Pruned
4. Date defaults to today (editable)
5. Optional notes (max 500 chars)
6. Submits → log appears in Log Book list (sorted by date desc)
7. Log Book page: filter by plant, action, or date range

### 4.6 Search & Filter Flow

1. User types in search bar (plant name or species)
2. Selects room filter from dropdown
3. Results update in <2s
4. Filters persist across page refresh (URL params)
5. Clear filters button resets view

### 4.7 Admin Species Management Flow

1. Admin logs into Django Admin panel
2. Navigates to Species section
3. Can add/edit/delete species (name, description, default care info)
4. Changes reflect immediately in user plant form dropdown
5. All actions logged with timestamp + admin ID

---

## 5. Non-Functional Product Requirements

- **Mobile-First:** 70%+ traffic from phones; touch targets ≥48px
- **Offline Resilience:** PWA caches plant/room data; works offline for viewing
- **Accessibility:** Screen reader compatible; keyboard navigable; alt text required for images; contrast ≥4.5:1
- **Performance:** Core Web Vitals "Good" threshold on 3G simulation; LCP <3s
- **Trust Signals:** Secure JWT auth; no ads; clean, minimal UI
- **Design Consistency:** 100% screens match Figma design system

---

## 6. Out of Scope (Explicitly)

- Payment processing / subscriptions
- Native iOS/Android apps
- AI-powered plant disease detection
- Social media sharing / community feed
- Multi-user household sync
- Smart sensor (IoT) integration
- Multi-language support (English only)
- Email/SMS reminders (in-app only for v1.0)

---

## 7. Success Metrics (Product-Level)

| Metric | Baseline | Target (Week 6) | Measurement |
|--------|----------|-----------------|-------------|
| Weekly Active Users (WAU) | N/A | 40% of registered users | Analytics event |
| Avg. Logs per Plant per Week | N/A | ≥3 | Log book count |
| Due-Today Completion Rate | N/A | ≥80% | Logged vs. due |
| Plant Deletion Rate | N/A | <5% | Soft delete count |
| Search Response Time | N/A | <2s | Backend timing |
| Admin Species Coverage | N/A | ≥20 species | Species table count |
| Mobile Traffic Share | N/A | ≥70% | User agent analytics |

---

## 8. User Interface (From Figma Screenshots)

### Screens Designed (13 total)

| # | Screen | Key Elements |
|---|--------|--------------|
| 1 | Landing Page (Public) | Hero, features, Get Started/Login buttons |
| 2 | Register Page | Full name, email, password, confirm password |
| 3 | Login Page | Email, password, remember me, forgot password |
| 4 | Dashboard (After Login) | Greeting, stats (Total Plants, Due Today, Rooms), Plants Due Today, Quick Actions |
| 5 | My Plants Page | Search bar, room filter, plant cards with "Next Watering" + View button |
| 6 | Add Plant Page | Nickname, species, room, care requirements, image upload |
| 7 | Plant Detail Page | Image, species, room, last watered, next due, care requirements, recent logs |
| 8 | Rooms Page | Room list with plant count, Add Room button |
| 9 | Care Schedule Page | Tabs (Due Today, Next 7 Days, All), plant cards with due dates |
| 10 | Log Book Page | Filter dropdown, log table (Date, Plant, Action, Notes), pagination |
| 11 | Mobile View (Responsive) | Bottom nav, card layout, touch-friendly |
| 12 | Data Flow | React ↔ DRF ↔ PostgreSQL diagram |
| 13 | Database Tables (ER) | Users, Rooms, Plants, CareRequirements, LogBook |

### Design System (From Design.md)

- **Primary Color:** #16a34a (green – plant theme)
- **Background:** #ffffff
- **Surface:** #f8fafc
- **Text:** #0f172a
- **Error:** #dc2626
- **Warning:** #ca8a04
- **Success:** #16a34a
- **Typography:** H1 2rem/700, H2 1.5rem/600, Body 1rem/400
- **Spacing:** Tailwind scale only (p-2, p-4, p-6, p-8)

---

## 9. Product Roadmap (Tied to Phases.md)

| Phase | Weeks | Product Deliverable |
|-------|-------|---------------------|
| Phase 1: Foundation & Auth | 1-2 | Registration, login, JWT, basic React shell |
| Phase 2: Plant & Room Management | 3-4 | Room CRUD, Plant CRUD, image upload |
| Phase 3: Care Schedule & LogBook | 5-6 | Due-today calculation, log entries, search/filter |
| Phase 4: Polish & Launch Prep | 7-8 | Accessibility, performance, UAT, launch |

---

## 10. Assumptions & Dependencies

- UI/UX designer delivers Figma screens before Phase 2
- Researcher gathers 10+ user interviews by Week 3
- Admin species list seeded with ≥20 common indoor plants
- Team members have basic Django + React training
- Faculty advisor available for weekly reviews

---

**APPROVALS**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Team Leader | Tushar Kumar | _______________ | _______ |
| Product Owner | Tushar Kumar | _______________ | _______ |
| UI/UX Designer | _______________ | _______________ | _______ |
| Frontend Lead | _______________ | _______________ | _______ |
| Backend Lead | _______________ | _______________ | _______ |

---

**DOCUMENT CONTROL**  
Prepared By: Tushar Kumar | Reviewed By: Faculty Advisor  
Next Review Date: 2026-10-02 | Change Log: v1.0 Initial Draft

---
