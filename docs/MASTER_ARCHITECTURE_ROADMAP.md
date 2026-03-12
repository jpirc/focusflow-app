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

### ADHD UX Backlog (Near-Term)

This section tracks ADHD-specific UX improvements that have been identified in recent implementation sessions and should be kept in sync with actual shipped behavior.

- Task switch protection UX
  - Replace browser-native `window.confirm` task-switch prompt with an in-app modal/sheet.
  - Preserve active-task context in the prompt (what is active, what will be paused/started).
  - Keep interaction non-blocking and mobile-friendly.
- Prompt fatigue controls
  - Optional "Don't ask again for this task pair today" setting for repeated task switches.
  - Evaluate lightweight suppression rules so guardrails remain helpful without adding friction.
- Focus guidance instrumentation
  - Add analytics events for accepted/rejected task switches.
  - Add analytics for focus-strip "next step" visibility/use to validate ADHD guidance value.
- Reminder overwhelm reduction
  - Add quiet hours to reminder settings.
  - Add reminder frequency caps (per hour/day).
  - Add quick actions from reminders (`Snooze 5m`, `Reschedule`).
- ADHD scanability/mobile parity
  - Ensure inbox grouping/scannability improvements are fully mirrored in mobile views.
  - Continue compact, high-signal UI passes that reduce visual noise and decision load.

### Push Intelligence (Optional by Design)

Goal: move Dopatika from a pull-based planner ("show me my tasks") toward a push-based coach ("notice patterns and propose the next best move") while keeping all automation optional and user-controlled.

Core rules:
- Suggestions should explain why they appeared (observable trigger or learned pattern).
- Prefer draft-and-accept flows over silent task changes.
- Every proactive behavior must be disable-able (global off + feature/frequency controls).
- Respect quiet periods, cooldowns, and nudge caps to avoid overwhelm.

Phase 1 (MVP push layer)
- Repeated rollover rescue:
  - Detect rollover streaks (e.g., 2-3+) and suggest AI breakdown + first micro-step.
  - User reviews/accepts the breakdown before changes are applied.
- Capacity guardrails:
  - Detect overloaded day/time blocks and suggest rescheduling lighter tasks.
- Smart reminder actions:
  - Add action-oriented reminders (`Start 5m`, `Snooze 5m`, `Reschedule`, `Break it down`).
- Optional controls:
  - Smart suggestions on/off.
  - Suggestion frequency (`minimal`, `balanced`, `proactive`).
  - Learning on/off.

Phase 2 (behavior-aware coaching)
- Stuck detection:
  - Detect open/edit/no-start loops and prompt for friction reason (`too big`, `unclear`, `blocked`, `low energy`).
  - Adapt suggestions based on selected friction type.
- Time-estimate learning:
  - Learn estimate vs actual deltas and recommend better defaults by task type/project.
- Best-time recommendations:
  - Suggest scheduling by user completion patterns (time of day, task energy).
- Context-switch interventions:
  - Detect switching spikes and recommend a short focus lock or "finish 5-minute step first".

Phase 3 (recovery + coaching loops)
- Deadline risk forecasting with recovery plan suggestions.
- Recovery mode ("salvage today" plan after derailment).
- Weekly coaching summary (patterns + one experiment for next week).
- Automation tiers:
  - `suggest only`
  - `draft + ask`
  - optional low-risk auto-apply (future, opt-in only)

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
