# Branch History & Cleanup Log

This document tracks all development branches and their merge history.

---

## ✅ Merged & Deleted Branches

### `feature/pomodoro-timer` (Merged: Jan 13, 2026)
**PR**: #9  
**Commits**: 10 files changed, 3,486 insertions  
**Features Delivered**:
- Comprehensive Pomodoro timer with work/break cycles
- PomodoroTimer component with circular progress and drag support
- PomodoroOverlay component (3 visual modes: off/subtle/full)
- Sound notifications (Web Audio API)
- Test mode (15s work / 5s break) for rapid testing
- Database schema: `UserPomodoroSettings` & `PomodoroSession` models
- API routes: `/api/pomodoro/settings`, `/api/pomodoro/start`, `/api/pomodoro/complete`, `/api/pomodoro/stats`
- `usePomodoro` hook with ref pattern to prevent stale closures
- Pause/resume functionality with state preservation
- Weekend rollover fix: Friday tasks → Monday (skips weekends)
- Quick Win Suggestions modal (tasks ≤15 min)
- Supabase RLS policies enabled

**Technical Highlights**:
- Fixed stale closure bug using `handleTimerCompleteRef` pattern
- API validation adjusted for test mode (min 0.08 instead of min 1)
- Overlay visibility during all timer states (work/break/paused)
- Integration with task status updates

---

### `feat/auth-settings` (Merged: Unknown date)
**Status**: Fully merged to main  
**Features Delivered**:
- NextAuth configuration with credentials provider
- Google OAuth integration
- Email/password authentication
- Session management with JWT strategy
- Protected API routes with `getAuthSession()`
- Middleware for route protection

---

### `feat/initial-setup` (Partially merged)
**Status**: Some commits not in main (CI setup, deps)  
**Unique Commits**:
- `0dfca08` - Add preact@10.11.3 devDependency
- `d5628ef` - GitHub Actions workflow and CI scripts
- `583ea6f` - Local env setup helper and README

**Features Delivered to Main**:
- Next.js 14 app structure
- Prisma ORM setup with PostgreSQL/Supabase
- TypeScript configuration
- Tailwind CSS setup
- Project scaffolding

**Remaining Work** (not merged):
- GitHub Actions CI workflow
- Preact dev dependency (likely not needed)

**Decision**: Keep branch for now, review CI setup later

---

### `feat/projects-crud` (Partially merged)
**Status**: Some commits not in main  
**Unique Commits**:
- `faf8ab8` - Project edit and delete UI with handlers and confirmation dialog

**Features in Main**:
- Project model with color and icon fields
- Create project functionality
- Project list display

**Not Yet Merged**:
- Edit project UI
- Delete project with confirmation dialog

**Decision**: Keep branch, merge edit/delete functionality in next update

---

### `feature/auto-rollover` (Merged: Unknown date)
**Status**: Fully merged to main  
**Features Delivered**:
- Auto-rollover logic in `useTasks` hook
- Move pending/in-progress tasks from past dates to today
- Default to "Anytime" slot on next day
- Increment `rolloverCount` for tracking
- Client-side check on app load
- Weekend handling integrated (Friday → Monday)

---

### `feature/smart-capture` (Merged: Unknown date)
**Status**: Fully merged to main  
**Features Delivered**:
- SmartCaptureModal component
- Natural language task parsing API: `/api/tasks/parse`
- Parse date/time expressions ("tomorrow morning", "friday afternoon")
- Extract priority and energy level from text
- Integration with task creation flow

---

### `feature/smart-priorities-rollover` (Merged: Unknown date)
**Status**: Fully merged to main  
**Features Delivered**:
- Top 3 daily priorities system
- `isTopPriority` and `topPriorityDate` fields on Task model
- DailyPrioritiesModal component
- Top3Section component with completion tracking
- Auto-reset priorities at day rollover
- `/api/tasks/priorities` endpoint

---

### `fix/ui-investigation-1765316458` (Merged: Unknown date)
**Status**: Fully merged to main  
**Type**: Bug fix  
**Fixes Applied**:
- UI investigation and fixes (specific issues tracked in commit messages)
- Likely CSS/layout issues or component rendering problems

---

### `optimize/performance-audit` (Merged: Unknown date)
**Status**: Fully merged to main  
**Features Delivered**:
- Performance optimizations documented in `PERFORMANCE_AUDIT.md`
- React component memoization
- Reduced re-renders in task lists
- Optimistic updates for better UX
- Database query optimization

---

## 🧹 Cleanup Actions

### Branches Safe to Delete (Fully Merged)
- [x] `feat/auth-settings` - ✅ Deleted (Jan 13, 2026)
- [x] `feature/auto-rollover` - ✅ Deleted (Jan 13, 2026)
- [x] `feature/pomodoro-timer` - ✅ Deleted (Jan 13, 2026)
- [x] `feature/smart-capture` - ✅ Deleted (Jan 13, 2026)
- [x] `feature/smart-priorities-rollover` - ✅ Deleted (Jan 13, 2026)
- [x] `fix/ui-investigation-1765316458` - ✅ Deleted (Jan 13, 2026)
- [x] `optimize/performance-audit` - ✅ Deleted (Jan 13, 2026)

### Branches to Keep (Unmerged Work)
- [ ] `feat/initial-setup` - Has CI workflow commits not in main
- [ ] `feat/projects-crud` - Has project edit/delete UI not in main

---

## 📋 Branch Naming Convention

Going forward, use this naming pattern:

- `feature/` - New features (e.g., `feature/stuck-helper`)
- `fix/` - Bug fixes (e.g., `fix/rollover-bug`)
- `feat/` - Small enhancements (e.g., `feat/add-tooltips`)
- `optimize/` - Performance improvements
- `refactor/` - Code restructuring without new features
- `docs/` - Documentation updates

**Best Practice**: Keep feature branches short-lived (1-2 weeks max) and delete after merge.

---

## 🚀 Active Development

**Current Branch**: `main`  
**Next Feature**: `feature/stuck-helper` - "I'm Stuck" Button for task assistance

**Upcoming Branches**:
1. `feature/stuck-helper` - AI-powered task breakdown helper
2. `feature/daily-review` - Evening reflection and planning
3. `feature/task-timer` - Active time tracking UI
