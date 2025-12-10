# FocusFlow Feature Roadmap

This document tracks future features and enhancements for FocusFlow, organized by priority and theme.

---

## 🎯 Phase 1: Task Intelligence & Time Tracking

### Time Tracking & Analytics
- [ ] **Task Timer**: Track actual time spent on tasks
  - Start timer when task status changes to "in-progress"
  - Stop timer when task is completed or paused
  - Store `startedAt` timestamp and `actualMinutes` in database
  - Display elapsed time in TaskCard during active work
  - Compare estimated vs actual time

- [ ] **Task Age Tracking**: Monitor how long tasks remain open
  - Show "age" badge on tasks (e.g., "3 days old")
  - Visual indicators for tasks aging beyond thresholds
  - Filter/sort by task age
  - Analytics: average time to completion by project/priority

- [ ] **Velocity Metrics**: Personal productivity insights
  - Daily/weekly completion rate
  - Tasks completed vs created trend
  - Average tasks per day by time block
  - Completion rate by project, priority, energy level
  - Streak tracking (consecutive days with completed tasks)

### Smart Task Management
- [ ] **Auto-Rollover**: Move incomplete tasks to next day
  - Daily midnight cron job or client-side check
  - Move pending/in-progress tasks from past dates
  - Default to "Anytime" slot on next day
  - Optional notification: "5 tasks rolled over to today"
  - User preferences: auto-rollover on/off, which statuses to move

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
1. **Auto-Rollover** (high impact, relatively simple)
2. **Task Timer** (foundational for analytics)
3. **Task Age Tracking** (builds on existing timestamps)
4. **Basic Notifications** (unlocks engagement)
5. **Velocity Dashboard** (motivating, uses timer data)

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

_Last updated: December 10, 2025_
