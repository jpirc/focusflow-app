# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dopatika is an ADHD-friendly visual task planner built with **Next.js 14 App Router**, **TypeScript**, **Prisma/PostgreSQL**, and **NextAuth**. The app focuses on time-block scheduling (morning/afternoon/evening) with multi-day views, subtasks, dependencies, Pomodoro timer integration, and intelligent learning features.

## Development Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Prisma generate + Next.js build
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run lint         # ESLint
```

## Technology Stack

- **Frontend**: Next.js 14 App Router, React client components (`'use client'`), Tailwind CSS, Lucide icons
- **Backend**: Next.js API routes (`app/api/`), Prisma ORM with PostgreSQL (Supabase)
- **Auth**: NextAuth with JWT strategy (credentials + Google OAuth)
- **Intelligence**: Event-sourced analytics with OpenAI GPT-4 for AI-powered task breakdown
- **Timer**: Pomodoro timer system with session tracking and analytics

## Architecture Principles

### Hook-Based Architecture

All business logic lives in hooks, not components. Components are purely presentational. This separation is critical to the architecture:

```typescript
// ✅ Good: Logic in hooks, components use them
const { tasks, createTask, updateTask } = useTasks({ isAuthenticated });
const { projects } = useProjects({ isAuthenticated });
const { celebrate } = useCelebration({ enabled: true });
const pomodoro = usePomodoro({ isAuthenticated, onTaskStart, onPomodoroComplete });

// ❌ Bad: Don't put business logic in components
```

**Key Hooks:**
- `useTasks` (`hooks/useTasks.ts`): Full task CRUD, status updates, subtasks, dependencies, Top 3 priorities, optimistic updates, rollover/unblocked notifications
- `useProjects` (`hooks/useProjects.ts`): Project CRUD with color/icon management
- `useCelebration` (`hooks/useCelebration.ts`): Confetti animations, streak tracking, encouraging messages
- `usePomodoro` (`hooks/usePomodoro.ts`): Timer state, session management, task integration
- `useTheme` (`hooks/useTheme.ts`): Theme switching and persistence
- `useViewState` (`hooks/useViewState.ts`): Current date, view days, view mode, sidebar state
- `useModalState` (`hooks/useModalState.ts`): All modal open/close state management
- `useTaskFilters` (`hooks/useTaskFilters.ts`): Computed values for filtering and displaying tasks

### API Layer Architecture

**Client-side (`lib/api/client.ts`):**
All API calls go through typed client wrappers with automatic error handling:

```typescript
import { taskApi, projectApi, intelligenceApi, pomodoroApi } from '@/lib/api/client';

const result = await taskApi.create({ title, date, timeBlock });
if (result.error) { /* handle error */ }

// Natural language parsing
const parseResult = await taskApi.parse({ text: "buy groceries tomorrow morning" });

// AI suggestions
const suggestions = await intelligenceApi.getSuggestions();
```

**Server-side (`lib/api/route_utils.ts`):**
API routes use standardized utilities:

```typescript
import { getAuthSession, successResponse, validateRequest } from '@/lib/api/route_utils';

export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();
    const { data, error } = await validateRequest(req, zodSchema);
    // ... use prisma, return successResponse(data, 201)
}
```

### Component Composition Pattern

The main app page (`app/page.tsx`) is ~1200 lines but purely compositional - it assembles the UI from hooks and presentational components without containing business logic. When modifying the main app:
1. Add logic to hooks, not the page component
2. Pass data down through props
3. Use callback props for user actions
4. Keep the page component as a "composition layer"

## Data Models & Conventions

### Task Model
- `date`: ISO string `YYYY-MM-DD` or `null` (inbox/unscheduled)
- `timeBlock`: `'anytime' | 'morning' | 'afternoon' | 'evening' | 'inbox'`
- `scheduledHour`/`scheduledMinute`: Specific time (0-23 hour, 0-59 minute) for timeline view
- `status`: `'pending' | 'in-progress' | 'completed' | 'skipped' | 'carried-over'`
- `priority`: `'low' | 'medium' | 'high' | 'urgent'`
- `energyLevel`: `'low' | 'medium' | 'high'` - matches time blocks for smart scheduling
- `rolloverCount`: Number of times task has been auto-rolled to next day
- `isTopPriority`: Boolean - is this one of today's Top 3 focus tasks?
- `topPriorityDate`: String (YYYY-MM-DD) - which day this was marked as Top 3
- `order`: Integer - position within same date/timeBlock bucket (for drag-and-drop ordering)
- Subtasks are Tasks with `parentTaskId` set
- Dependencies use `TaskDependency` join table with `taskId` (blocked) and `dependsOnId` (blocker)

### Intelligence System (Event Sourcing)

The app learns from user behavior via event tracking:

```typescript
import { intelligence } from '@/lib/intelligence';

// Track events in API routes after task operations
await intelligence.trackEvent({
    eventType: 'task_completed', // or 'created', 'moved', 'started', etc.
    userId: session.user.id,
    taskId: task.id,
    timeBlock: task.timeBlock,
    hourOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    projectId: task.projectId,
});

// Generate AI-powered suggestions
const suggestions = await intelligence.generateSuggestions(userId, tasks);
```

**Database Models:**
- `TaskEvent`: Event sourcing table - logs all task actions
- `UserInsight`: Learned patterns per user (time preferences, energy patterns)
- `Suggestion`: AI-generated recommendations with accept/dismiss tracking
- `UserFeature`: Feature flags and AI preferences

### Timezone Handling

All date operations use the user's timezone (`User.timezone` field, default: `America/Chicago`):

```typescript
import { getTodayInTimezone, getCurrentHourInTimezone } from '@/lib/utils/timezone';

// ✅ Good: Use timezone-aware helpers
const today = getTodayInTimezone(userTimezone);

// ❌ Bad: Don't use raw Date() for user-facing dates
const today = new Date();
```

Store dates as ISO strings `YYYY-MM-DD` but always parse in user's timezone.

## Key Components

### Modals
- **SmartCaptureModal**: Natural language task input (e.g., "buy groceries tomorrow morning")
- **AIBreakdownModal**: AI-powered task breakdown into subtasks
  - Guided questions before generation: first step, what you need, where, what's hard
  - Interactive editing: click edit icon to modify subtask names and time estimates
  - Checkboxes to select/deselect individual subtasks before applying
  - "Start Over" to regenerate with different context
  - ADHD-friendly: 3-5 minute micro-tasks, ridiculously easy first steps
- **EditTaskModal**: Full task editing with subtasks, dependencies, time estimates
- **DailyPrioritiesModal**: Select Top 3 tasks for the day
- **PomodoroSettingsModal**: Configure Pomodoro timer preferences

### Task Display
- **TaskCard**: Main task display with badges (priority, energy, rollover, age)
  - Context menu uses portal-based rendering positioned from button bounding rect
  - Shows dependency chains and blocking status
  - Displays Top 3 star indicator when `isTopPriority` is true
- **QuickEditTaskCard**: Inline editing component for quick updates
- **TimelineTaskCard**: Task card specialized for timeline view (shows scheduled time)
- **CompactInboxTask**: Minimal task card for sidebar inbox view
- **CompactFinishedTask**: Minimal display for completed tasks

### Layouts & Views
- **TimeBlockColumn**: Displays tasks grouped by time block (morning/afternoon/evening)
- **TimelineView/TimelinePanel**: Hourly timeline with drag-and-drop scheduling
- **DualPanelLayout**: Split view with time blocks (67%) and timeline (33%)
- **CalendarView**: Month view for long-term planning
- **UpcomingDayColumn**: Quick navigation sidebar showing next 5 days

### Notifications
- **RolloverNotification**: Shows tasks automatically moved from yesterday
- **UnblockedTasksNotification**: Alerts when dependencies complete
- **CelebrationMessage**: Confetti + encouraging messages on task completion
- **RolloverWarning**: Warns before automatic rollover occurs

### Pomodoro System
- **PomodoroTimer**: Floating timer widget with controls
- **PomodoroOverlay**: Full-screen or subtle overlay during focus sessions
- Session tracking stored in `PomodoroSession` table for analytics

## API Routes Structure

```
app/api/
├── auth/
│   ├── [...nextauth]/route.ts    # NextAuth handler
│   └── register/route.ts         # User registration
├── tasks/
│   ├── route.ts                  # GET (list), POST (create)
│   ├── [id]/route.ts            # GET, PUT, DELETE single task
│   ├── [id]/dependencies/       # Dependency management
│   ├── batch/route.ts           # Batch operations
│   ├── parse/route.ts           # Natural language parsing
│   └── rollover/route.ts        # Auto-rollover incomplete tasks
├── projects/
│   ├── route.ts                 # GET (list), POST (create)
│   └── [id]/route.ts           # GET, PUT, DELETE single project
├── intelligence/
│   ├── route.ts                 # GET suggestions, POST analyze patterns
│   ├── breakdown/route.ts       # AI task breakdown (OpenAI GPT-4)
│   ├── suggestions/[id]/route.ts # Accept/dismiss suggestions
│   ├── stats/route.ts          # Analytics data
│   └── timing/route.ts         # Timing analysis
├── pomodoro/
│   ├── start/route.ts          # Start session
│   ├── complete/route.ts       # Complete/abandon session
│   ├── settings/route.ts       # Get/update user settings
│   └── stats/route.ts          # Session analytics
└── user/
    └── timezone/route.ts        # Get/update user timezone
```

## Critical Gotchas

1. **Optimistic Updates**: UI updates state immediately, rolls back on API failure. Always use `setTasks()` from `useTasks` for optimistic updates, then fire API calls in background.

2. **Task Ordering**: Tasks within same date/timeBlock bucket are ordered by `order` field. When reordering via drag-and-drop:
   - Update local state immediately
   - Fire API updates in background
   - Only refresh from server on error

3. **Date Handling**: Use `YYYY-MM-DD` strings, not Date objects. Parse with `new Date(dateStr + 'T00:00:00')` to avoid timezone issues. Always use `getTodayInTimezone()` for "today", never `new Date()`.

4. **Subtasks**: Fetched via `parentTaskId` and merged in `GET /api/tasks`. Parent tasks returned at top level, subtasks included in `subtasks` array.

5. **Dependencies**: Check for circular dependencies before adding. Blocked tasks show warning badge. When dependency completes, blocked tasks appear in `unblockedTasks` notification.

6. **Top 3 Priorities**: Date-specific (`topPriorityDate` field), reset automatically at day rollover. Maximum 3 per day enforced in `useTasks.setTopPriorities()`.

7. **Rollover System**: Runs automatically on first app load each day via `taskApi.rollover()`. Incomplete tasks from yesterday moved to today with `status: 'carried-over'` and incremented `rolloverCount`.

8. **Intelligence Events**: Task state changes should trigger `intelligence.trackEvent()` calls in API routes for learning system.

9. **Pomodoro Integration**: When starting Pomodoro, task status changes to `in-progress`. On completion, `actualMinutes` updated. Sessions tracked in `PomodoroSession` table.

10. **Timeline Scheduling**: Tasks can have both `timeBlock` (morning/afternoon/evening) and specific `scheduledHour`/`scheduledMinute`. Timeline view requires specific time, time block view uses just `timeBlock`.

## Environment Variables

```
DATABASE_URL         # Prisma connection (pooled)
DIRECT_URL           # Prisma direct connection
NEXTAUTH_SECRET      # Auth encryption key
NEXTAUTH_URL         # App URL (http://localhost:3000)
GOOGLE_CLIENT_ID     # OAuth (optional)
GOOGLE_CLIENT_SECRET # OAuth (optional)
OPENAI_API_KEY       # For AI breakdown feature
```

## Testing & Debugging

When debugging task operations:
1. Check browser console for `[DRAG]` or `[useTasks]` prefixed logs
2. Verify API responses in Network tab
3. Check Prisma Studio for database state: `npx prisma studio`
4. Use React DevTools to inspect hook state

Common issues:
- **Tasks not updating**: Check if optimistic update succeeded but API call failed
- **Drag-and-drop issues**: Look for `[DRAG]` logs, verify `order` field updates
- **Timeline scheduling**: Ensure both `scheduledHour`/`scheduledMinute` and `date` are set
- **Timezone bugs**: Verify `User.timezone` field and use `getTodayInTimezone()`
