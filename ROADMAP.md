# FocusFlow Feature Roadmap

This document tracks future features and enhancements for FocusFlow, organized by priority and theme.

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
- [x] AI task breakdown (simulated)

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
  - Unified calendar view in FocusFlow

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
- [ ] **Dark Mode**: Full dark theme support
  - User preference toggle
  - Auto-detect system preference
  - Gentle dark colors (ADHD-friendly)

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
- [ ] **Recurring Tasks**: Daily/weekly routines
  - Morning routine checklist
  - Weekly review template
  - Custom recurrence patterns
  - Auto-complete after X days

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

## 🔥 ACTIVE SPRINT: Focus & Momentum (Dec 2024)

The following features are prioritized for immediate implementation, ordered by impact and dependency.

### Sprint Goals
- Create external time structure (fight time blindness)
- Provide dopamine/motivation (celebrations, streaks)
- Reduce friction for capture (parking lot)
- Add daily structure (Top 3, daily review)

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

### 4. Top 3 Daily Priorities ⭐
**Status:** NOT STARTED | **Priority:** HIGH | **Effort:** MEDIUM

Force prioritization to reduce overwhelm.

**Implementation:**
- [ ] Morning prompt modal: "What are your 3 must-dos today?"
- [ ] Star/pin indicator on priority tasks (⭐ badge)
- [ ] Top 3 section at top of today's column
- [ ] End-of-day check: "You completed 2/3 priorities!"
- [ ] Track Top 3 completion rate in analytics

**Database:**
- Add `isTopPriority: Boolean @default(false)` to Task model
- Add `topPriorityDate: String?` (the date it was marked as Top 3)

**Events to track:**
- `daily_priorities_set` (task_ids[], time_of_day, day_of_week)
- `daily_priorities_completed` (completed_count, total: 3)

**UI Components:**
- `components/DailyPrioritiesModal.tsx` - morning prompt
- `components/TopThreeSection.tsx` - display in day column

**Files to modify:**
- `prisma/schema.prisma`
- `app/page.tsx` - trigger morning prompt, show Top 3 section
- `components/TaskCard.tsx` - star badge
- `hooks/useTasks.ts` - mark as Top 3 functions

---

### 5. Focus Timer (Pomodoro) 🍅
**Status:** NOT STARTED | **Priority:** HIGH | **Effort:** MEDIUM

External time structure for focus sessions.

**Implementation:**
- [ ] Timer presets: 25m, 15m, 5m, custom
- [ ] Large visible countdown (header bar or floating widget)
- [ ] Start from task card or global button
- [ ] Link to specific task (optional)
- [ ] Break reminder when timer ends
- [ ] Track focus sessions

**Database:**
```prisma
model FocusSession {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  taskId        String?
  task          Task?     @relation(fields: [taskId], references: [id])
  plannedMinutes Int
  actualMinutes  Int?
  startedAt     DateTime  @default(now())
  endedAt       DateTime?
  completedNaturally Boolean @default(false)
  createdAt     DateTime  @default(now())
}
```

**Events to track:**
- `focus_session_started` (duration, task_id, time_of_day)
- `focus_session_completed` (actual_duration, completed_naturally)
- `focus_session_abandoned` (duration_before_quit)
- `break_started` (after_focus_session: boolean)

**UI Components:**
- `components/FocusTimer.tsx` - the timer UI
- `components/FocusTimerWidget.tsx` - floating/header version
- `hooks/useFocusTimer.ts` - timer state management

---

### 6. Quick Win Suggestions 💨
**Status:** NOT STARTED | **Priority:** MEDIUM | **Effort:** LOW

Surface short tasks when energy is low.

**Implementation:**
- [ ] "Need a quick win?" section (tasks < 15 min)
- [ ] Show after completing a task: "Nice! Here's another quick one..."
- [ ] Filter by: shortest, oldest, or blocking others
- [ ] Energy-appropriate (show low-energy tasks in evening)

**Events to track:**
- `quick_win_suggested` (task_id, context, time_of_day)
- `quick_win_accepted` (task_id)
- `quick_win_dismissed`

**Files to modify:**
- `app/page.tsx` - quick win section/modal
- `lib/intelligence/suggestions.ts` - add quick win suggestion type

---

### 7. Daily Review Prompt 📝
**Status:** NOT STARTED | **Priority:** MEDIUM | **Effort:** MEDIUM

End-of-day reflection for self-awareness.

**Implementation:**
- [ ] Evening prompt (trigger at 6pm or manually)
- [ ] Quick mood check: 😫 😕 😐 🙂 😊
- [ ] "What went well?" / "What was hard?" text fields (optional)
- [ ] Show completion stats for the day
- [ ] Suggest moving incomplete tasks
- [ ] Save reflection for analytics

**Database:**
```prisma
model DailyReview {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  date         String   // YYYY-MM-DD
  mood         Int?     // 1-5
  wentWell     String?
  wasHard      String?
  tasksCompleted Int
  tasksPending   Int
  createdAt    DateTime @default(now())
}
```

**Events to track:**
- `daily_review_completed` (mood, has_reflection, tasks_completed)
- `daily_review_skipped`

---

### 8. "I'm Stuck" Button 🆘
**Status:** NOT STARTED | **Priority:** MEDIUM | **Effort:** MEDIUM

One-click help for procrastinated tasks.

**Implementation:**
- [ ] Button on task card menu: "I'm stuck"
- [ ] AI analyzes task and suggests:
  - Break it down into smaller steps
  - Change the time/energy level
  - "Just start for 5 minutes"
  - Delegate or drop it
- [ ] Track which suggestions work

**Events to track:**
- `stuck_button_pressed` (task_id, rollover_count, time_on_task)
- `stuck_suggestion_shown` (suggestion_type)
- `stuck_suggestion_accepted` (suggestion_type, did_complete_after)

**Files to modify:**
- `components/TaskCard.tsx` - add stuck button to menu
- `components/StuckHelperModal.tsx` - new modal
- `lib/ai/stuck-helper.ts` - AI prompt logic

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

_Last updated: December 30, 2024_
