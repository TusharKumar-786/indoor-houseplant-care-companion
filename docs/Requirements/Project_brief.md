
---


# Project Brief: LeafPulse

**Project Name:** LeafPulse – Indoor Houseplant Care Companion  
**Team Name:** GreenAura  
**Team Leader:** Tushar Kumar  
**Version:** 1.0 | **Date:** 2026-09-25 | **Status:** DRAFT FOR REVIEW

---

## 1. Project Idea (3-4 Sentences)

LeafPulse is a web-based indoor houseplant care companion that helps plant parents track their plants, rooms, watering/fertilizing schedules, and care logs in one centralized dashboard. Users can register, add plants with species and room details, set care requirements (water frequency, sunlight level), and log daily actions like watering or pruning. The platform calculates which plants are due for watering today by comparing the last watered date with the frequency requirement, and sends reminders to keep indoor gardens healthy. Built with Django REST Framework (backend), React + Tailwind CSS (frontend), PostgreSQL + pgAdmin (database), and designed in Figma (UI/UX).

---

## 2. Problem Statement

Indoor plant owners often forget when to water or fertilize their plants, leading to plant death or poor health. Existing solutions are either too complex, not mobile-friendly, or lack room-wise organization. There is no simple, free, and intuitive tool that combines plant tracking, care scheduling, and activity logging in one place.

---

## 3. Target Users

| Persona | Description |
|---------|-------------|
| **Plant Parent** | A student or working professional who owns 3-10 indoor plants and wants to keep them healthy without guessing watering schedules. |
| **Researcher** | A team member who studies plant care data, user behavior, and suggests improvements. |
| **Admin** | Manages user accounts, plant species database, and system health. |

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 + pgAdmin |
| Auth | JWT (httpOnly cookies) |
| UI/UX | Figma |
| Testing | Pytest, Jest, Playwright |
| Deployment | Docker + Railway / Render |

---

## 5. Team Roles (GreenAura – 7 Members)

| Role | Count | Responsibility |
|------|-------|----------------|
| UI/UX Designer | 1 | Figma wireframes, design system, accessibility |
| Frontend Developer | 2 | React components, API integration, Tailwind styling |
| Backend Developer | 2 | Django REST APIs, JWT auth, business logic |
| Database Administrator | 1 | PostgreSQL schema, pgAdmin, migrations, queries |
| Research | 1 | User research, plant care data, feature validation |
| **Team Leader** | **Tushar Kumar** | Overall coordination, gate reviews, final decisions |

---

## 6. Core Features (MVP)

1. User registration/login with JWT
2. Add/edit/delete rooms (Living Room, Bedroom, Balcony)
3. Add/edit/delete plants (nickname, species, room, care requirements)
4. Care schedule dashboard (due today, next 7 days)
5. Log book (watered, fertilized, pruned, notes)
6. Mobile-responsive UI (PWA-ready)
7. Admin panel for species management

---

## 7. Out of Scope (v1.0)

- Payment processing
- Native mobile apps
- AI plant disease detection
- Social sharing
- Multi-user household sync

---

## 8. Success Criteria

- MVP launched within 8 weeks
- 40% of test users active weekly
- Zero P0 security bugs
- WCAG 2.1 AA accessibility pass
- 100% team retrospective completion

---

**Approved By:**  
Tushar Kumar (Team Leader) — _________________ Date: _______

---