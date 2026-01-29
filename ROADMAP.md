# Dopatika Feature Roadmap

This document tracks future features and enhancements for Dopatika, organized by priority and theme.

---

## 🎨 CURRENT WORK - ADHD-Friendly Visual Redesign

**Branch**: main
**Status**: In Progress (Timeline View 83% complete)

Transform Dopatika from abstract time blocks into a concrete, visual timeline that helps ADHD brains understand time, capacity, and progress at a glance.

**✅ Major accomplishments:**
- Timeline view with hour grid and current time marker
- Time budget visualization with capacity warnings
- Top 3 priorities system fully implemented
- Pomodoro timer integration complete
- Quick win suggestions working
- AI-powered task breakdown

### Design Goals
- **Concrete over abstract**: Actual hours instead of "morning/afternoon/evening"
- **Dense but scannable**: Maximize information, minimize white space
- **Visual capacity planning**: Show "how much time is left" to prevent overload
- **Temporal grounding**: "Now" indicator shows current time in timeline
- **Dopamine-friendly**: Progress bars, energy matching, visual rewards

### Phase 1: Timeline View (HIGH PRIORITY) - ✅ MOSTLY COMPLETE
- [x] **Vertical Timeline Layout**: Hour-based timeline (6am-11pm) with 80px/hour grid ✅
- [ ] **Visual Time Blocks**: Colored regions showing morning/afternoon/evening zones (NOT STARTED)
- [x] **Task Positioning**: Tasks placed at scheduledHour/scheduledMinute ✅
- [x] **Current Time Marker**: Red line "NOW" indicator with circle ✅
- [~] **Capacity Visualization**: TimeBudget component exists at day level (per-block still needed)
- [x] **Hour Grid**: Hour markers (6am-11pm) rendered in timeline ✅

### Phase 2: Density & Information Architecture (HIGH PRIORITY)
- [ ] **Compact Card Design**: Reduce padding (4-6 → 2-3), tighter spacing between tasks
- [ ] **Inline Metadata**: Time estimate, energy level on same line as title
- [ ] **Color-Coded Borders**: Left border shows priority (not just badge)
- [ ] **Subtle Project Tints**: Light project color background on cards
- [ ] **Better Hierarchy**: Important info (time, blocking status) more prominent
- [ ] **Quick Scan Layout**: See 3+ tasks without scrolling per time block

### Phase 3: Visual Time Budget (MEDIUM PRIORITY) - ✅ MOSTLY COMPLETE
- [x] **Daily Capacity Bar**: TimeBudget component shows scheduled vs available time ✅
- [ ] **Per-Block Capacity**: Show used/available time for each time block (NOT STARTED)
- [x] **Overload Warning**: Red color + warning message when overbooked ✅
- [ ] **Smart Suggestions**: AI suggestions for rebalancing overloaded days (NOT STARTED)
- [x] **Available Time Indicator**: Green/yellow/red color coding ✅

### Phase 4: Energy & Time Matching (MEDIUM PRIORITY)
- [ ] **Energy-Coded Backgrounds**: Subtle tint on cards (blue=low, green=medium, red=high)
- [ ] **Time Block Energy Profiles**: Morning=high, afternoon=medium, evening=low
- [ ] **Matching Glow Effect**: When task energy matches block energy, add subtle highlight
- [ ] **Energy Mismatch Warning**: Flag high-energy tasks in low-energy blocks
- [ ] **Smart Reordering**: Suggest moving tasks to energy-matching time slots

### Phase 5: Progress Visualization (LOW PRIORITY)
- [ ] **Subtask Progress Bars**: Visual "2/5 subtasks done" instead of just text
- [ ] **Completion Percentage**: Show % complete on parent tasks
- [ ] **Mini Charts**: Tiny inline graphs for multi-day tasks
- [ ] **Streak Indicators**: Flame icon with day count for task streaks
- [ ] **Time vs Estimate**: Visual bar comparing estimated vs actual time

### Phase 6: Contextual Slide Panels (LOW PRIORITY)
- [ ] **Replace Edit Modals**: Use slide-in panels from right instead of center modals
- [ ] **Quick Edit Panel**: 400px panel with inline form, main view stays visible
- [ ] **Context Preservation**: See other tasks while editing current one
- [ ] **Multi-Edit Support**: Edit multiple tasks without closing panel
- [ ] **Keyboard Navigation**: Arrow keys to move between tasks in panel

### Phase 7: Advanced Timeline Features (MOVED TO NEXT SPRINT)
- [~] **Drag-and-Drop Timeline**: Better drag handling (IN PROGRESS - Next Sprint)
- [~] **Overlap Detection**: Multi-lane rendering for overlapping tasks (IN PROGRESS - Next Sprint)
- [~] **Floating Tasks**: All-day tasks that don't block scheduling (IN PROGRESS - Next Sprint)
- [ ] **Horizontal Day Scrolling**: Swipe between days with momentum
- [ ] **Visual Task Duration**: Card height = time estimate (30m task = taller card)
- [ ] **Break Slots**: Visual gaps for lunch, breaks between tasks

### Phase 8: Smart Color System (FUTURE)
- [ ] **Semantic Status Colors**: Overdue=red glow, due today=yellow, blocked=gray
- [ ] **In-Progress Pulse**: Subtle pulsing border for active tasks
- [ ] **Top 3 Gold Tint**: Golden star + subtle gold background for priorities
- [ ] **Project Color Harmony**: Generate complementary colors for multiple projects
- [ ] **Dark Mode Awareness**: Adjust colors for dark theme without losing information

---

## ✅ Recently Completed

### Pomodoro Timer System (Jan 13, 2026)
- [x] Full Pomodoro implementation (work/break cycles, sounds, overlays)
- [x] Test mode (15s/5s) for rapid development
- [x] Pause/resume with state preservation
- [x] Visual overlay (3 modes: off/subtle/full)
- [x] Database schema + API routes
- [x] Weekend rollover fix (Friday → Monday)

### Quick Win Suggestions (Jan 13, 2026)
- [x] Smart task filtering (≤15 min, incomplete, today/overdue)
- [x] Intelligent ranking (blocking → shortest → oldest)
- [x] Prominent "Start Now" button with Play icon
- [x] Header integration (Cmd+W shortcut)
- [x] Auto-trigger after completion (30% chance)

### AI Task Breakdown (Previously)
- [x] Guided questions before generation ("What's stuck?")
- [x] Interactive editing (edit names, time estimates)
- [x] Select/deselect individual subtasks
- [x] "Start Over" regeneration
- [x] Context learning (saves user input as events)

---

## 🎨 PAUSED - Visual Intelligence Layer (Phase 2A)

**Goal**: Make AI suggestions and learned patterns visible and actionable with ADHD-friendly, compact visuals.

### Design Principles
- **Compact over spacious**: Dense but scannable, minimal white space
- **Inline over modal**: Show suggestions in context, not separate screens
- **Glanceable**: Information visible at a glance without clicking
- **Non-intrusive**: Suggestions don't block workflow
- **Dopamine hits**: Visual rewards for following suggestions

### Components to Build
- [x] **Smart Suggestion Toasts**: Floating inline suggestions (not modals)
  - "💡 You usually do Marketing tasks in the morning" → Move button
  - Dismiss or accept inline
  - Stacks multiple suggestions vertically (compact)
  - Auto-collapse after 10s, expand on hover
  
- [ ] **Insights Sidebar Panel**: Collapsible panel showing learned patterns
  - Compact badge format: "⚡ Morning person (85% confident)"
  - "📊 Client Work → Afternoon (12 tasks)"
  - Clicking badge shows detailed chart/explanation
  - Slides in from right, doesn't cover tasks
  
- [x] **Smart Task Hints**: Inline contextual badges on tasks
  - "⏰ Usually takes 45m" (learned timing)
  - "☀️ Try morning" (learned time preference)
  - "🔥 High energy needed" (pattern match)
  - Tiny pills, don't clutter card
  
- [ ] **Mini Analytics Strip**: Thin header bar showing key metrics
  - "🎯 3/8 done today • 🔥 2-day streak • ⚡ Peak focus: afternoons"
  - Always visible, doesn't scroll away
  - Click to expand detailed view

### Technical Implementation
- [x] Fetch suggestions on page load (`/api/intelligence`)
- [x] Store in React state, update on task actions
- [x] Use custom hook (useSuggestions) for global suggestion state
- [x] Auto-dismiss/expire stale suggestions
- [x] Track suggestion acceptance rate (new events)

---

## ✅ Completed Features

### Core App (Phase 0)
- [x] Multi-day timeline (1, 3, 5, 7 days)
- [x] Month/calendar view with task badges
- [x] Time block scheduling (morning/afternoon/evening/anytime)
- [x] Drag & drop between days and time blocks
- [x] Project organization with color-coding
- [x] Task dependencies with blocking indicators
- [x] Subtasks with inline editing
- [x] Unscheduled inbox

### Authentication & Backend
- [x] Email/password authentication (NextAuth + credentials)
- [x] Google OAuth
- [x] PostgreSQL database (Supabase + Prisma)
- [x] Full API routes with auth protection
- [x] Server-side middleware redirects

### UI/UX Polish
- [x] Compact week view with smaller fonts
- [x] Hover tooltips on tasks (description, project, time)
- [x] Completed tasks "Done" section per day
- [x] Restore completed tasks to pending
- [x] Rollover count badge on tasks
- [x] Priority dots (high/urgent)
- [x] Energy level badges
- [x] AI task breakdown with interactive editing
- [x] Natural language task parsing

### Analytics Foundation
- [x] TaskEvent model for tracking (created, completed, moved, etc.)
- [x] completedAt timestamp on tasks
- [x] Basic stats API endpoint
- [x] Full Analytics Dashboard (/analytics)
- [x] Velocity tracking (tasks per day)
- [x] Time block breakdown chart
- [x] Day streak tracking
- [x] Pattern detection (time_preference, productivity_window, completion_velocity)
- [x] Smart suggestions system with accept/dismiss
- [x] Confidence scoring for insights

---

## 🎯 Phase 1: Task Intelligence & Time Tracking

### Time Tracking & Analytics
- [~] **Task Timer**: Track actual time spent on tasks (schema ready, needs UI)
  - [x] `startedAt` timestamp in database schema
  - [x] `actualMinutes` field in database schema  
  - [x] Event types defined (timer_started, timer_stopped)
  - [ ] Set `startedAt` when status changes to "in-progress"
  - [ ] Display elapsed time in TaskCard during active work
  - [ ] Stop timer and calculate `actualMinutes` on completion
  - [ ] Compare estimated vs actual time

- [ ] **Task Age Tracking**: Monitor how long tasks remain open
  - Show "age" badge on tasks (e.g., "3 days old")
  - Visual indicators for tasks aging beyond thresholds
  - Filter/sort by task age
  - Analytics: average time to completion by project/priority

- [x] **Velocity Metrics**: Personal productivity insights ✅
  - [x] Daily/weekly/monthly completion rate
  - [x] Average tasks per day by time block
  - [x] Streak tracking (consecutive days with completed tasks)
  - [ ] Tasks completed vs created trend (chart)
  - [ ] Completion rate by project, priority, energy level

### Smart Task Management
- [x] **Auto-Rollover**: Move incomplete tasks to next day ✅
  - [x] Client-side check on app load (hooks/useTasks.ts)
  - [x] Move pending/in-progress tasks from past dates to today
  - [x] Default to "Anytime" slot on next day
  - [x] Increment rolloverCount for tracking
  - [ ] Optional notification: "5 tasks rolled over to today"
  - [ ] User preferences: auto-rollover on/off, which statuses to move

- [ ] **Task Notifications**: Contextual alerts
  - Tasks aging beyond threshold (e.g., "Review AhhBravo has been open for 7 days")
  - Daily summary: "You have 8 tasks scheduled for today"
  - Completed task celebration: "Great job! 🎉 3 tasks done today"
  - Blocking dependency alert: "Task X is ready—dependency completed"
  - Browser/push notifications with user controls

---

## 🤖 Phase 2: AI-Powered Features

### Task Breakdown & Suggestions
- [ ] **Real AI Task Breakdown**: Integrate Claude/GPT API
  - Replace simulated breakdown with actual LLM calls
  - Context-aware subtask generation
  - Time estimation based on task complexity
  - "Getting started" tips for procrastination-prone tasks
  - Language-aware suggestions (code tasks vs life tasks)

- [ ] **Smart Scheduling**: AI suggests optimal timing
  - Analyze historical completion patterns
  - Suggest time blocks based on energy level and task type
  - Detect calendar conflicts (future calendar integration)
  - Rebalance overloaded days
  - "You typically complete design tasks in the afternoon"

- [ ] **Voice Input**: Natural language task creation
  - "Add task: review budget report tomorrow morning"
  - Parse intent: title, date, time block, priority
  - Follow-up questions for ambiguity
  - Voice-to-text for task descriptions

- [ ] **Intelligent Prioritization**: ML-based priority suggestions
  - Learn from user behavior (what gets done first)
  - Suggest priority adjustments based on deadlines, dependencies
  - Flag tasks that should be delegated or deleted
  - "This task hasn't been touched in 2 weeks—archive it?"

---

## 📊 Phase 3: Analytics & Insights Dashboard

### Personal Metrics
- [ ] **Dashboard View**: Comprehensive productivity overview
  - Tasks completed today/week/month
  - Velocity chart (trend over time)
  - Completion rate by project
  - Energy level vs completion correlation
  - Estimated vs actual time accuracy

- [ ] **Focus Patterns**: When are you most productive?
  - Heatmap: completion rate by day of week + time block
  - Best/worst performing time blocks
  - Distraction patterns (tasks started but not completed)
  - Optimal task load per day

- [ ] **Project Health**: Track project momentum
  - Tasks completed vs remaining per project
  - Average task age per project
  - Stalled projects alert (no activity in X days)
  - Estimated project completion date

### Insights & Recommendations
- [ ] **Weekly Review**: Automated end-of-week summary
  - Wins: tasks completed, streaks, velocity improvements
  - Challenges: overdue tasks, rolled-over items
  - Patterns: best/worst days, energy insights
  - Suggestions: adjust estimates, redistribute tasks

- [ ] **Goal Setting**: Track long-term objectives
  - Link tasks to goals/OKRs
  - Progress visualization (% toward goal)
  - Milestone tracking
  - Celebrate goal completion

---

## 🔗 Phase 4: Integrations & Sync

### Calendar Integration
- [ ] **Google Calendar Sync**: Bi-directional sync
  - Import calendar events as "blocked time"
  - Export tasks as calendar events
  - Conflict detection (meetings overlap with tasks)
  - Automatic rescheduling suggestions

- [ ] **Apple Calendar / Outlook**: Cross-platform support
  - Same features as Google Calendar
  - Unified calendar view in Dopatika

### External Tools
- [ ] **Notion Integration**: Sync tasks with Notion databases
  - Two-way sync: tasks ↔ Notion database items
  - Rich text descriptions, attachments
  - Embedded Notion pages in task details

- [ ] **Slack/Discord Notifications**: Team collaboration
  - Post daily summary to Slack channel
  - Task completion notifications
  - Accountability buddy features

- [ ] **GitHub Integration**: Developer productivity
  - Link tasks to GitHub issues/PRs
  - Auto-update task status from PR merge
  - Code commit tracking per task

- [ ] **Email Integration**: Create tasks from emails
  - Forward emails to create tasks
  - Parse subject, sender, body for context
  - Link back to original email

---

## 🎨 Phase 5: UX Enhancements

### Visual Improvements
- [~] **Dark Mode**: Theme system exists but not critical priority
  - [x] Theme switching infrastructure (`useTheme` hook, `lib/themes.ts`) ✅
  - [ ] Full dark theme implementation (NOT CRITICAL per user)

- [ ] **Custom Themes**: Personalize color schemes
  - Pre-built themes (Ocean, Forest, Sunset, etc.)
  - Custom color picker for projects
  - Export/import theme configurations

- [ ] **Animations & Micro-interactions**: Delightful UX
  - Task completion celebration animation
  - Smooth drag-and-drop feedback
  - Loading skeletons for better perceived performance
  - Confetti on streak milestones

### Accessibility
- [ ] **Keyboard Shortcuts**: Power-user efficiency
  - Quick add task (Cmd+K)
  - Navigate between days (arrow keys)
  - Focus time blocks (Tab)
  - Complete task (Cmd+Enter)
  - Customizable shortcuts

- [ ] **Screen Reader Support**: Full ARIA compliance
  - Semantic HTML
  - Descriptive labels
  - Keyboard navigation
  - Focus management

- [ ] **High Contrast Mode**: Visual accessibility
  - Increased contrast ratios
  - Bold outlines and borders
  - Larger hit targets

---

## 📱 Phase 6: Mobile & Cross-Platform

### Mobile App
- [ ] **React Native App**: iOS & Android native apps
  - Offline-first architecture
  - Push notifications
  - Widget support (today's tasks on home screen)
  - Quick capture via share sheet
  - Voice input

### Progressive Web App (PWA)
- [ ] **PWA Features**: Install as app
  - Offline support with service workers
  - Add to home screen
  - Background sync
  - Push notifications (web)

---

## 🧠 Phase 7: ADHD-Specific Features

### Executive Function Support
- [ ] **Body Doubling**: Virtual co-working
  - Live session with other users
  - Shared focus timer (Pomodoro)
  - Chat/accountability check-ins
  - Anonymous mode (just presence, no details)

- [ ] **Dopamine Hits**: Motivation mechanics
  - XP/levels for completing tasks
  - Badges/achievements (First Task of the Day, Week Warrior, etc.)
  - Visual progress bars
  - Celebration sounds/visuals
  - Daily streaks

- [ ] **Task Chunking Helper**: Break down overwhelming tasks
  - Detect large tasks (>60min estimate)
  - Suggest automatic chunking
  - "Just start" mode: commit to 5 minutes
  - Micro-progress tracking (even if incomplete)

- [ ] **Distraction Management**: Stay on track
  - Website blocker integration (during focused time)
  - "Do Not Disturb" mode
  - Gentle nudges if away from app during active task
  - Context switching cost reminder

### Routine Building
- [ ] **Recurring Tasks**: Daily/weekly routines (NOT YET IMPLEMENTED)
  - [ ] Morning routine checklist
  - [ ] Weekly review template
  - [ ] Custom recurrence patterns
  - [ ] Auto-complete after X days
  - _Note: Database schema has recurrence fields but no UI implementation yet_

- [ ] **Habit Stacking**: Link tasks together
  - "After coffee, do X"
  - Visual chains/sequences
  - Trigger-based task suggestions

---

## 🔐 Phase 8: Collaboration & Sharing

### Team Features
- [ ] **Shared Projects**: Collaborate with others
  - Invite team members to projects
  - Assign tasks to team members
  - Shared task dependencies
  - Activity feed (who did what)

- [ ] **Public Task Templates**: Community sharing
  - Browse public templates (e.g., "Moving Checklist")
  - One-click import
  - Rate and review templates
  - Contribute your own

### Accountability
- [ ] **Accountability Partners**: Share progress
  - Opt-in sharing with trusted person
  - Weekly check-ins
  - Celebrate wins together
  - Gentle encouragement messages

---

## 🛠 Phase 9: Power User Features

### Advanced Workflows
- [ ] **Custom Fields**: Extend task metadata
  - Add custom properties (cost, location, etc.)
  - Filter/sort by custom fields
  - Template variables

- [ ] **Automation Rules**: If-this-then-that
  - "When task is completed, create follow-up task"
  - "Auto-assign priority based on keywords"
  - "Move to project X if tagged with Y"
  - Zapier-style visual automation builder

- [ ] **Bulk Actions**: Manage tasks at scale
  - Multi-select tasks
  - Batch edit (change project, priority, date)
  - Bulk delete/archive
  - Export/import CSV

### API & Extensibility
- [ ] **Public API**: Build custom integrations
  - RESTful API for tasks, projects, users
  - Webhooks for events (task completed, etc.)
  - OAuth for third-party apps
  - API documentation and playground

- [ ] **Browser Extension**: Quick capture anywhere
  - Right-click to create task from selected text
  - Toolbar popup for quick view
  - Badge with today's task count

---

## 💾 Phase 10: Data & Privacy

### Data Management
- [ ] **Export Data**: Own your information
  - Export all data as JSON/CSV
  - PDF reports with charts
  - Archive old projects

- [ ] **Import from Competitors**: Easy migration
  - Todoist import
  - Notion import
  - Trello import
  - CSV generic import

### Privacy & Security
- [ ] **End-to-End Encryption**: Optional for sensitive tasks
  - Client-side encryption
  - Zero-knowledge architecture
  - Password-protected projects

- [ ] **Self-Hosting**: Full control
  - Docker deployment guide
  - PostgreSQL + Redis setup
  - Environment variable configuration

---

## 📝 Implementation Notes

### Database Schema Additions Needed
For time tracking and analytics:
```prisma
model Task {
  // ... existing fields
  startedAt       DateTime?  // When task moved to in-progress
  completedAt     DateTime?  // When task marked completed
  totalTimeSpent  Int        @default(0) // Cumulative minutes
  timeLogs        TimeLog[]
}

model TimeLog {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  startTime DateTime
  endTime   DateTime?
  duration  Int?     // minutes
  createdAt DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // 'rollover', 'aging', 'celebration', etc.
  title     String
  message   String
  read      Boolean  @default(false)
  taskId    String?
  createdAt DateTime @default(now())
}

model UserMetrics {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  tasksCompletedToday Int    @default(0)
  currentStreak     Int      @default(0)
  longestStreak     Int      @default(0)
  totalTasksCompleted Int    @default(0)
  updatedAt         DateTime @updatedAt
}
```

### Priority Order for Next Sprint
1. ~~**Auto-Rollover** (high impact, relatively simple)~~ ✅ DONE
2. **Task Timer** (foundational for analytics) - IN PROGRESS
3. **Task Age Tracking** (builds on existing timestamps)
4. **Basic Notifications** (unlocks engagement)
5. **Velocity Dashboard** (motivating, uses timer data)

---

## 🔥 COMPLETED SPRINT: Focus & Momentum (Dec 2024 - Jan 2026)

The following features were prioritized and have been **successfully implemented**.

### Sprint Goals - ✅ ALL ACHIEVED
- ✅ Create external time structure (fight time blindness) - Timeline + Pomodoro
- ✅ Provide dopamine/motivation (celebrations, streaks) - Completed
- ✅ Reduce friction for capture (parking lot) - Smart Capture modal
- ✅ Add daily structure (Top 3) - Completed (daily review deprioritized)

---

### 1. Completion Celebrations 🎉 ✅ DONE
**Status:** COMPLETED | **Priority:** HIGH | **Effort:** LOW

Dopamine hits when tasks are completed.

**Implemented:**
- [x] Confetti animation on task completion (canvas-confetti)
- [x] Optional sound effect (respect system preferences)
- [x] Encouraging messages rotation: "Nice!", "You're on fire!", "Crushed it!"
- [x] Streak counter in header with fire icon
- [x] Milestone messages at 3, 5, 10, 15, 20 tasks
- [x] Daily streak persistence in localStorage

**Files created/modified:**
- `hooks/useCelebration.ts` - NEW: celebration state, confetti, streak tracking
- `components/CelebrationMessage.tsx` - NEW: floating message overlay
- `components/layout/Header.tsx` - streak counter display
- `app/page.tsx` - celebration integration
- `app/globals.css` - bounce-in and streak-glow animations

---

### 2. Time Overrun Warnings ⏰ ✅ DONE
**Status:** COMPLETED | **Priority:** HIGH | **Effort:** LOW

Visual cues when tasks exceed estimated time.

**Implemented:**
- [x] Color change on elapsed time display:
  - Blue: < 100% of estimate (normal)
  - Yellow: 100-150% of estimate (warning)
  - Orange: 150-200% of estimate (overrun)
  - Red: > 200% of estimate (critical)
- [x] Pulsing animation when overrun (animate-pulse)
- [x] Rich tooltip showing detailed breakdown

**Files modified:**
- `components/TaskCard.tsx` - added getTimeStatus() function and enhanced time display

---

### 3. Parking Lot Quick Capture 🅿️ ⏭️ SKIPPED
**Status:** SKIPPED | **Priority:** HIGH | **Effort:** LOW

**Reason:** The existing Smart Capture modal already provides the same functionality:
- Natural language input
- AI-powered parsing for dates, times, priorities
- Tasks go to inbox by default (no date required)
- Minimal cognitive load - no forms to fill

Adding a separate Parking Lot would create redundant UX and confusion about which entry point to use. The Smart Capture modal effectively IS the quick capture solution.

---

### 4. Top 3 Daily Priorities ⭐ - ✅ COMPLETED
**Status:** ✅ COMPLETED | **Priority:** HIGH | **Effort:** MEDIUM

Force prioritization to reduce overwhelm.

**Implementation:**
- [x] Morning prompt modal: "What are your 3 must-dos today?" ✅
- [x] Star/pin indicator on priority tasks (⭐ badge) ✅
- [x] Top 3 section at top of today's column ✅
- [x] Track Top 3 completion rate in analytics ✅

**Database:**
- [x] `isTopPriority: Boolean @default(false)` in Task model ✅
- [x] `topPriorityDate: String?` in Task model ✅

**UI Components:**
- [x] `components/DailyPrioritiesModal.tsx` ✅
- [x] `components/Top3Section.tsx` ✅

**Files completed:**
- [x] `prisma/schema.prisma` ✅
- [x] `app/page.tsx` ✅
- [x] `components/TaskCard.tsx` ✅
- [x] `hooks/useTasks.ts` ✅

---

### 5. Focus Timer (Pomodoro) 🍅 - ✅ COMPLETED
**Status:** ✅ COMPLETED (Jan 13, 2026) | **Priority:** HIGH | **Effort:** MEDIUM

External time structure for focus sessions.

**Implementation:**
- [x] Timer presets: 25m, 15m, 5m, custom ✅
- [x] Large visible countdown (floating widget) ✅
- [x] Start from task card or global button ✅
- [x] Link to specific task ✅
- [x] Break reminder when timer ends ✅
- [x] Track focus sessions in database ✅
- [x] Test mode (15s/5s) for development ✅
- [x] Pause/resume with state preservation ✅
- [x] Visual overlay (off/subtle/full modes) ✅

**Database:**
- [x] `PomodoroSession` model in schema ✅
- [x] `UserPomodoroSettings` model in schema ✅

**UI Components:**
- [x] `components/PomodoroTimer.tsx` ✅
- [x] `components/PomodoroOverlay.tsx` ✅
- [x] `components/PomodoroSettingsModal.tsx` ✅
- [x] `hooks/usePomodoro.ts` ✅

---

### 6. Quick Win Suggestions 💨 - ✅ COMPLETED
**Status:** ✅ COMPLETED (Jan 13, 2026) | **Priority:** MEDIUM | **Effort:** LOW

Surface short tasks when energy is low.

**Implementation:**
- [x] Smart task filtering (≤15 min, incomplete, today/overdue) ✅
- [x] Intelligent ranking (blocking → shortest → oldest) ✅
- [x] Prominent "Start Now" button with Play icon ✅
- [x] Header integration (Cmd+W shortcut) ✅
- [x] Auto-trigger after completion (30% chance) ✅

**UI Components:**
- [x] `components/QuickWinSuggestions.tsx` ✅

---

### 7. Daily Review Prompt 📝 - DEPRIORITIZED
**Status:** NOT STARTED (User not interested) | **Priority:** LOW | **Effort:** MEDIUM

End-of-day reflection for self-awareness.

_Note: Feature deprioritized per user feedback - not critical for workflow._

---

### 8. "I'm Stuck" / AI Breakdown 🆘 - ✅ COMPLETED
**Status:** ✅ COMPLETED | **Priority:** MEDIUM | **Effort:** MEDIUM

One-click help for procrastinated tasks via AI breakdown.

**Implementation:**
- [x] "AI Breakdown" button on task cards (same as "I'm stuck" functionality) ✅
- [x] Guided questions before generation ("What's stuck?") ✅
- [x] Interactive editing (edit names, time estimates) ✅
- [x] Select/deselect individual subtasks ✅
- [x] "Start Over" regeneration ✅
- [x] Context learning (saves user input as events) ✅
- [x] AI analyzes task and breaks it down into smaller steps ✅
- [x] Uses OpenAI GPT-4 with ADHD-friendly prompting ✅

**UI Components:**
- [x] `components/AIBreakdownModal.tsx` ✅
- [x] Button integrated in task card menu ✅

**API Routes:**
- [x] `/api/intelligence/breakdown` ✅

---

## 📊 Event Tracking Status

Ensure these events are tracked before building analytics features:

**Currently Tracked:**
- [x] `task_created`
- [x] `task_completed`
- [x] `task_started`
- [x] `task_paused`
- [x] `task_moved`
- [x] `subtask_completed`
- [x] `timer_started` (defined, may not be active)

**Need to Add:**
- [ ] `focus_session_started`
- [ ] `focus_session_completed`
- [ ] `focus_session_abandoned`
- [ ] `daily_priorities_set`
- [ ] `daily_review_completed`
- [ ] `stuck_button_pressed`
- [ ] `quick_win_suggested`
- [ ] `parking_lot_captured`
- [ ] `celebration_shown`
- [ ] `time_warning_triggered`

---

## 📈 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Task completion rate | +20% | Completed / Created per week |
| Estimation accuracy | < 30% variance | Actual vs Estimated time |
| Daily return rate | > 70% | Users active 5+ days/week |
| Focus session completion | > 60% | Completed / Started |
| Top 3 completion | > 50% | Days with all 3 done |
| Rollover reduction | -30% | Avg rollover count trend |

---

## 🚀 Getting Started

When ready to implement a feature:
1. Create a new branch: `git checkout -b feature/[feature-name]`
2. Update Prisma schema if needed: `npx prisma migrate dev`
3. Build API routes first (test with Postman/curl)
4. Build UI components
5. Test thoroughly (especially edge cases for ADHD-friendly features)
6. Update this roadmap with ✅ when complete

---

---

## 🚀 NEXT SPRINT: Timeline UX & Visual Polish (Jan 2026)

### Sprint Goals
1. **Advanced Timeline Features** - Floating tasks, overlapping tasks, improved drag/drop
2. **Complete Timeline View** - Add colored time block regions
3. **Phase 2: Density & Information** - Make cards more compact and scannable
4. **Per-Block Capacity** - Show capacity at time block level, not just day level

### 🔥 Critical Priority - Timeline UX Improvements
- [ ] **Floating/All-Day Tasks** - Tasks that are "today" but not time-specific
  - Add `isFloating: boolean` field to Task model
  - Floating tasks band at top of timeline (like Google Calendar all-day section)
  - Semi-transparent, doesn't block scheduling
  - Can schedule specific-time tasks "over" floating tasks
  - Use case: "respond to emails", "review documents when free"

- [ ] **Overlapping Tasks (Multi-Lane Timeline)** - Multiple tasks at same time
  - Detect time overlaps and render side-by-side
  - Calculate column widths (2 overlaps = 50% each, 3 = 33% each)
  - Max 3-4 tasks before showing overflow indicator (+2 more)
  - Visual lanes like Google Calendar
  - Use case: back-to-back meetings, parallel tasks

- [ ] **Improved Drag & Drop**
  - Smooth snapping to 15-min intervals
  - Visual preview while dragging
  - Drag from time blocks to timeline and vice versa
  - Drag to/from floating tasks band
  - Better conflict detection and auto-adjustment

### High Priority Items
- [ ] Visual time block colored regions (morning=blue, afternoon=green, evening=purple)
- [ ] Compact card design (reduce padding, inline metadata)
- [ ] Per-block capacity indicators
- [ ] Color-coded left borders for priority
- [ ] Subtle project color tints on cards

### Medium Priority
- [ ] Energy-coded card backgrounds
- [ ] Better visual hierarchy (time/blocking more prominent)
- [ ] Task age tracking with badges

---

## 📊 Progress Summary

**Timeline View**: 83% complete (5/6 features)
**Time Budget**: 75% complete (3/4 features)
**Top 3 Priorities**: ✅ 100% complete
**Pomodoro Timer**: ✅ 100% complete
**Quick Win Suggestions**: ✅ 100% complete
**AI Breakdown / "I'm Stuck"**: ✅ 100% complete
**Celebration System**: ✅ 100% complete
**Auto-Rollover**: ✅ 100% complete
**Natural Language Parsing**: ✅ 100% complete

**Overall Completion**: ~70% of core ADHD-friendly features implemented

---

_Last updated: January 28, 2026_
