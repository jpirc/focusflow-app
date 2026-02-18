# Dopatika Master Architecture + Roadmap

Last updated: 2026-02-18
Owner: Product/Engineering

## Purpose

This is the single source of truth for:
- Runtime architecture
- Cross-cutting technical constraints
- Product/engineering roadmap priorities

Update this file for all architecture and roadmap changes.

---

## 1) Current Runtime Architecture

### 1.1 Stack

- Framework: Next.js 14 App Router
- Language: TypeScript
- Auth: NextAuth (JWT session strategy; Google + Credentials)
- Data layer: Prisma + PostgreSQL (Supabase-hosted)
- Styling/UI: Tailwind CSS + custom React components
- AI integrations: OpenAI APIs (task parsing, task breakdown)

### 1.2 Runtime Composition

- App shell and orchestration: `/Users/jonathanpirc/Desktop/Apps/focusflow-app/app/page.tsx`
- API routes: `/Users/jonathanpirc/Desktop/Apps/focusflow-app/app/api/**`
- Business/state hooks: `/Users/jonathanpirc/Desktop/Apps/focusflow-app/hooks/**`
- Shared utilities: `/Users/jonathanpirc/Desktop/Apps/focusflow-app/lib/**`
- Shared contracts: `/Users/jonathanpirc/Desktop/Apps/focusflow-app/types/index.ts`
- Persistence schema: `/Users/jonathanpirc/Desktop/Apps/focusflow-app/prisma/schema.prisma`

### 1.3 Data Flow

1. User interacts with UI components.
2. `app/page.tsx` coordinates state via hooks (`useTasks`, `useProjects`, `usePomodoro`, `useTaskFilters`, etc.).
3. Hooks call API endpoints under `/api/*`.
4. API routes validate/authenticate, then read/write with Prisma.
5. Prisma persists to PostgreSQL.
6. Updated data returns to hooks and re-renders UI.

### 1.4 Core Domains

- Tasks: CRUD, batch update, rollover, parsing, dependencies
- Projects: CRUD and task reassignment on delete
- Pomodoro: settings, session start/complete, stats
- Notifications: browser notification settings and reminder behavior
- Intelligence: suggestions, insights, timing stats, AI breakdown
- User profile prefs: timezone and auth session identity

### 1.5 Authentication Boundary

- Middleware protects app routes: `/Users/jonathanpirc/Desktop/Apps/focusflow-app/middleware.ts`
- API routes generally enforce session at handler level via route utils or `getServerSession`.

### 1.6 Operational Constraints

- Date/time logic is mixed between local-time utilities and timezone-aware user settings.
- `app/page.tsx` is a large orchestrator and current highest coupling point.
- Some client logic and server logic both perform overlapping state derivations (status/timing updates).

---

## 2) Architecture Risks (Current)

- High coupling in `/Users/jonathanpirc/Desktop/Apps/focusflow-app/app/page.tsx` increases regression risk.
- API contract drift risk between `types/index.ts`, hook assumptions, and route payloads.
- Mixed fetch styles (shared API client + direct fetch) create inconsistent error handling.
- Environment fragility risk remains around DB/runtime connectivity.
- Historical docs have drifted from runtime behavior.

---

## 3) Roadmap (Single Prioritized Backlog)

## P0: Stabilize Runtime (Now)

- Resolve API 500 and DB connectivity reliability.
- Add endpoint-level logging for first-failure diagnosis in task/pomodoro/intelligence routes.
- Normalize timezone/date handling rules across rollover, reminders, and timeline.
- Harden API contracts (input/output consistency for task/subtask/dependency payloads).

## P1: Reduce Coupling (Next)

- Split `app/page.tsx` orchestration into domain containers:
  - task orchestration
  - timeline/inbox orchestration
  - pomodoro orchestration
  - modal/view orchestration
- Standardize on one API access pattern (typed client + shared error mapping).
- Move repeated business rules to shared server/client-safe utility modules where possible.

## P2: Product Enhancements (After P0/P1)

- Notification controls: quiet hours, cap/frequency controls, snooze/reschedule actions.
- Intelligence UX polish: confidence-driven suggestion ranking and clearer explainability.
- Time planning UX: improved scheduling conflict handling and timeline ergonomics.

## P3: Platform Hardening

- Expand automated tests for high-risk workflows:
  - task lifecycle
  - dependencies
  - rollover
  - pomodoro session accounting
- Add migration discipline and compatibility checks for schema changes.
- Define clear release validation checklist (lint/typecheck/build/smoke API paths).

---

## 4) Update Protocol

- Architecture and roadmap changes must be made in this file only.
- `/Users/jonathanpirc/Desktop/Apps/focusflow-app/ARCHITECTURE.md` and `/Users/jonathanpirc/Desktop/Apps/focusflow-app/ROADMAP.md` are redirect stubs.
- Legacy versions are archived under `/Users/jonathanpirc/Desktop/Apps/focusflow-app/docs/archive/`.

