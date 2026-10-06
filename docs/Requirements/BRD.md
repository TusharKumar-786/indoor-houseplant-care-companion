# Business Requirements Document (BRD)
**Project:** LeafPulse – Indoor Houseplant Care Companion  
**Team Name:** GreenAura  
**Team Leader:** Tushar Kumar  
**Version:** 1.0 | **Date:** 2026-09-25 | **Status:** DRAFT FOR REVIEW  
**Author:** Tushar Kumar (Team Leader) | **Stakeholder:** Faculty Advisor / GreenAura Team

---

## 1. Executive Summary

LeafPulse solves a critical problem for indoor plant owners: **forgetting when to water, fertilize, or prune plants**, leading to plant death and frustration. Existing apps are either too complex, paid, or lack room-wise organization. LeafPulse provides a **simple, free, mobile-responsive web app** where users track plants by room, set care schedules, and log daily actions. The platform calculates which plants are due today by comparing last-watered date with frequency requirements. This project also provides the GreenAura team (7 members) with real-world full-stack experience using Django REST Framework, React, PostgreSQL, and Figma. ROI is measured in **user satisfaction, plant survival rate, and team learning outcomes**, not revenue.

---

## 2. Business Objectives (SMART)

| Objective | Metric | Target | Timeline |
|-----------|--------|--------|----------|
| Reduce plant neglect | User-reported missed watering | 50% reduction vs. manual tracking | End of Week 8 |
| Achieve active user adoption | Weekly Active Users (WAU) | 40% of registered test users | Week 6 post-launch |
| Ensure data accuracy | Log entries per plant per week | ≥3 logs/week | End of Week 8 |
| Zero critical security incidents | Audit report | 0 P0/P1 vulnerabilities | Pre-launch sign-off |
| Complete team learning | Retrospective completion | 100% of 7 members | End of Week 8 |

---

## 3. Scope Definition

### ✅ IN SCOPE
- User registration/login with JWT authentication (httpOnly cookies)
- Room management (Living Room, Bedroom, Balcony, custom)
- Plant management (nickname, species, room, image upload)
- Care requirements (water frequency, sunlight level, fertilizing frequency)
- Care schedule dashboard (Due Today, Next 7 Days, All)
- Log book (Watered, Fertilized, Pruned, Notes, Date)
- Mobile-responsive UI (PWA-ready)
- Admin panel for plant species management
- Basic search/filter for plants
- Figma-based design system (colors, typography, spacing)

### ❌ OUT OF SCOPE (v1.0)
- Payment processing / subscriptions
- Native iOS/Android apps (web-only MVP)
- AI-powered plant disease detection
- Social media sharing / community feed
- Multi-user household sync
- Integration with smart sensors (IoT)
- Multi-language support (English only)
- Email/SMS reminders (in-app only)

---

## 4. Stakeholder Analysis

| Role | Pain Point | Need | Influence |
|------|-----------|------|-----------|
| Plant Parent (User) | Forgets watering schedule; plants die | Simple dashboard; due-today alerts | High |
| Researcher (GreenAura) | No real user data on plant care habits | Analytics on log entries; user feedback | Medium |
| UI/UX Designer | Inconsistent design across screens | Figma design system; WCAG 2.1 AA | High |
| Frontend Devs | Unclear API contracts | Well-documented DRF endpoints | High |
| Backend Devs | Ambiguous business logic | Clear BRD + TRD requirements | High |
| Database Admin | Schema changes mid-sprint | Locked ER diagram; migration discipline | Critical |
| Team Leader (Tushar) | Scope creep; missed deadlines | Gate reviews; formal change requests | Critical |
| Faculty Advisor | Lack of documentation | BRD/TRD/Phases signed off | High |

---

## 5. Functional Requirements (Business Level)

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-01 | Users must register with email and password | Must Have | Registration validates email format; password ≥8 chars; JWT issued on login |
| FR-02 | Users can create, edit, delete rooms | Must Have | Room has name + window direction; max 10 rooms per user; soft delete only |
| FR-03 | Users can add plants with nickname, species, room, and image | Must Have | Plant linked to room; image ≤2MB; species from predefined list |
| FR-04 | Users can set care requirements (water frequency, sunlight, fertilizing) | Must Have | Water frequency 1-30 days; sunlight enum (Low/Medium/High); fertilizing 1-90 days |
| FR-05 | Dashboard shows plants due today, next 7 days, and all | Must Have | Due calculation: last_watered + frequency ≤ today; loads <2s |
| FR-06 | Users can log actions (Watered, Fertilized, Pruned) with notes | Must Have | Log linked to plant; date defaults to today; notes max 500 chars |
| FR-07 | Users can search/filter plants by name, room, or species | Should Have | Search returns in <2s; filters persist across refresh |
| FR-08 | Admin can manage plant species database | Should Have | Admin can add/edit/delete species; audit log maintained |
| FR-09 | Users receive in-app reminders for due plants | Nice to Have | Banner/toast on dashboard for overdue plants |

---

## 6. Non-Functional Requirements (Business Level)

- **Compliance:** No PII stored beyond name/email; passwords hashed (bcrypt); GDPR-aligned data deletion
- **Performance:** Page load <3s on campus WiFi; 99% uptime during academic hours (8AM–10PM)
- **Accessibility:** WCAG 2.1 AA compliant (screen reader support, color contrast ≥4.5:1, keyboard navigable)
- **Budget:** $0 licensing cost (open-source stack only); hosting under $50/month (Railway/Render free tier)
- **Timeline:** MVP launch by Week 8 of semester
- **Scalability:** Support 200 concurrent users; PostgreSQL indexing per TRD
- **Security:** JWT in httpOnly cookies; no localStorage; OWASP Top 10 addressed

---

## 7. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low user adoption | High | Medium | Research member conducts user interviews; gamify first 50 users |
| Inaccurate due-date calculation | High | Medium | Unit tests for date logic; edge cases documented |
| Scope creep from team | Medium | High | Formal change request process; BRD sign-off required |
| Database schema changes mid-sprint | High | Medium | ER diagram locked after Week 2; migrations via Django |
| Data breach / PII leak | Critical | Low | Hashed passwords; no payment data; quarterly audit |
| Team member unavailability | Medium | Medium | Cross-training; documented handovers in Memory.md |
| UI/UX inconsistency | Medium | Medium | Figma design system enforced in Rules.md |

---

## 8. Success Criteria & KPIs

- **Primary:** 40% Weekly Active Users (WAU) by Week 6
- **Secondary:** ≥3 log entries per plant per week
- **Tertiary:** <5% plant deletion rate (indicates user satisfaction)
- **Quality:** Zero P0 bugs in first 30 days post-launch
- **Learning:** 100% of GreenAura team completes documented retrospective
- **Design:** 100% screens match Figma design system

---

## 9. Assumptions & Dependencies

- Team members have basic Git, Django, and React training
- Figma account available for UI/UX designer
- PostgreSQL + pgAdmin installed locally for all devs
- Railway/Render free tier allows Django + PostgreSQL deployment
- Faculty advisor available for weekly reviews
- Researcher can gather 10+ user interviews by Week 3
- No dependency on external APIs (plant species list is internal)

---

## 10. Team Roles (GreenAura – 7 Members)

| Role | Count | Name(s) | Responsibility |
|------|-------|---------|----------------|
| Team Leader | 1 | Tushar Kumar | Coordination, gate reviews, final decisions |
| UI/UX Designer | 1 | [Name] | Figma wireframes, design system, accessibility |
| Frontend Developer | 2 | [Name], [Name] | React + Tailwind components, API integration |
| Backend Developer | 2 | [Name], [Name] | Django REST APIs, JWT auth, business logic |
| Database Administrator | 1 | [Name] | PostgreSQL schema, pgAdmin, migrations |
| Research | 1 | [Name] | User interviews, plant care data, validation |

---

## 11. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Team Leader | Tushar Kumar | _______________ | _______ |
| Faculty Advisor | _______________ | _______________ | _______ |
| UI/UX Designer | _______________ | _______________ | _______ |
| Frontend Lead | _______________ | _______________ | _______ |
| Backend Lead | _______________ | _______________ | _______ |
| Database Admin | _______________ | _______________ | _______ |
| Research Lead | _______________ | _______________ | _______ |

---

**DOCUMENT CONTROL**  
Prepared By: Tushar Kumar | Reviewed By: Faculty Advisor  
Next Review Date: 2026-10-02 | Change Log: v1.0 Initial Draft

---
