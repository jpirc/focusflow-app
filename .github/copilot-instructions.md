# FocusFlow Copilot Instructions

## Project Overview
FocusFlow is an ADHD-friendly visual task planner built with **Next.js 14 App Router**, **TypeScript**, **Prisma/PostgreSQL**, and **NextAuth**. The app focuses on time-block scheduling (morning/afternoon/evening/anytime) with multi-day views, subtasks, task dependencies, and **intelligent learning features**.

## Architecture

### Stack & Structure
- **Frontend**: Next.js 14 App Router, React client components (`'use client'`), Tailwind CSS, Lucide icons
- **Backend**: Next.js API routes in `app/api/`, Prisma ORM with PostgreSQL (Supabase)
- **Auth**: NextAuth with JWT strategy, credentials + Google OAuth
- **Intelligence**: Event-sourced analytics, pattern recognition, and AI-powered suggestions

### Key Directories
```
app/
├── page.tsx              # Main app (~800 lines, composition only - uses hooks for all logic)
├── api/                  # RESTful routes: tasks/, projects/, auth/, intelligence/
│   ├── tasks/
│   │   ├── route.ts          # CRUD operations
│   │   ├── parse/            # Natural language task parsing
│   │   └── rollover/         # Auto-rollover incomplete tasks
│   ├── intelligence/
│   │   ├── route.ts          # Get/generate suggestions & insights
│   │   ├── suggestions/      # Suggestion management
│   │   ├── stats/            # Analytics endpoints
│   │   └── timing/           # Timing analysis
│   └── user/timezone/        # User timezone management
components/
├── layout/                   # Sidebar.tsx, Header.tsx
├── TaskCard.tsx              # Task rendering with badges & context menu
├── QuickEditTaskCard.tsx     # Inline editing component
├── EditTaskModal.tsx         # Full task editing modal
├── SmartCaptureModal.tsx     # Natural language task input
├── AIBreakdownModal.tsx      # AI-powered task breakdown
├── DailyPrioritiesModal.tsx  # Select Top 3 daily tasks
├── Top3Section.tsx           # Display daily priorities
├── TimeBlockColumn.tsx       # Time block view component
├── UpcomingDayColumn.tsx     # Multi-day future view
├── CalendarView.tsx          # Calendar navigation
├── TimingInsightsCard.tsx    # Display learned timing patterns
├── RolloverNotification.tsx  # Alert for rolled-over tasks
├── RolloverWarning.tsx       # Warning before rollover occurs
├── UnblockedTasksNotification.tsx # Alert when dependencies complete
├── CelebrationMessage.tsx    # Dopamine-hit animations
└── CompactFinishedTask.tsx   # Finished task display
hooks/
├── useTasks.ts               # Task state + all CRUD operations (~575 lines)
├── useProjects.ts            # Project state + CRUD
├── useCelebration.ts         # Celebration animations & streak tracking
└── index.ts                  # Barrel export
lib/
├── api/
│   ├── client.ts             # Typed fetch wrappers for API calls
│   └── route_utils.ts        # Server-side API utilities (auth, validation, responses)
├── intelligence/
│   ├── index.ts              # Main intelligence service singleton
│   ├── events.ts             # Event tracking (TaskEvent logging)
│   ├── patterns.ts           # Pattern analysis & insight generation
│   ├── suggestions.ts        # Suggestion engine (~470 lines)
│   └── types.ts              # Intelligence type definitions
├── utils/
│   ├── date.ts               # Date formatting helpers
│   └── timezone.ts           # Timezone-aware date handling
├── auth.ts                   # NextAuth configuration
├── constants.ts              # TIME_BLOCKS, defaults
└── prisma.ts                 # Prisma client singleton
types/index.ts                # Shared TypeScript types
prisma/schema.prisma          # Database schema (269 lines, includes intelligence models)
```

## Key Patterns

### Custom Hooks (Recommended Approach)
All business logic lives in hooks, not components. Components are purely presentational.

```typescript
// Use hooks for state management and operations
const { tasks, createTask, updateTask, deleteTask, refreshTasks, 
        rolledOverTasks, unblockedTasks, applyAIBreakdown } = useTasks({ isAuthenticated });
const { projects, getProjectById } = useProjects({ isAuthenticated });
const { celebrate, incrementStreak, todayStreak } = useCelebration({ enabled: true });
```

**Hook Capabilities:**
- `useTasks`: Full task CRUD, status updates, subtasks, dependencies, Top 3 priorities, optimistic updates, rollover notifications
- `useProjects`: Project CRUD with color/icon management
- `useCelebration`: Confetti animations, streak tracking, encouraging messages

### API Client (lib/api/client.ts)
All API calls go through the typed client with automatic error handling:
```typescript
import { taskApi, projectApi, intelligenceApi } from '@/lib/api/client';

const result = await taskApi.create({ title, date, timeBlock });
if (result.error) { /* handle error */ }

// Parse natural language into tasks
const parseResult = await taskApi.parse({ text: "buy groceries tomorrow morning" });

// Get AI suggestions
const suggestions = await intelligenceApi.getSuggestions();
```

### Server-side API Routes
```typescript
import { getAuthSession, successResponse, validateRequest } from '@/lib/api/route_utils';

export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();
    const { data, error } = await validateRequest(req, zodSchema);
    // ... use prisma, return successResponse(data, 201)
}
```

### Intelligence System
The app learns from user behavior via event sourcing:

```typescript
import { intelligence } from '@/lib/intelligence';

// Track events automatically (handled in API routes)
await intelligence.trackEvent({
    eventType: 'task_completed',
    userId: session.user.id,
    taskId: task.id,
    timeBlock: task.timeBlock,
    hourOfDay: new Date().getHours(),
});

// Generate suggestions based on patterns
const suggestions = await intelligence.generateSuggestions(userId, tasks);

// Get specific recommendations
const suggestedTimeBlock = await intelligence.suggestTimeBlock(task, userId);
const topThreeTasks = await intelligence.getDailyFocus(userId, tasks);
```

**Intelligence Features:**
- Event tracking: All task actions logged to `TaskEvent` table
- Pattern analysis: Identifies time preferences, energy patterns, project habits
- Insights: Stored in `UserInsight` table with confidence scores
- Suggestions: Auto-generated recommendations (time blocks, priorities, breakdowns)
- Natural language parsing: `/api/tasks/parse` endpoint

## Task Model Conventions
- `date`: ISO string `YYYY-MM-DD` or `null` (inbox/unscheduled)
- `timeBlock`: `'anytime' | 'morning' | 'afternoon' | 'evening'`
- `status`: `'pending' | 'in-progress' | 'completed' | 'skipped' | 'carried-over'`
- `priority`: `'low' | 'medium' | 'high' | 'urgent'`
- `energyLevel`: `'low' | 'medium' | 'high'` - matches time blocks for smart scheduling
- `rolloverCount`: Number of times task has been auto-rolled to next day
- `isTopPriority`: Boolean - is this one of today's Top 3 focus tasks?
- `topPriorityDate`: String (YYYY-MM-DD) - which day this was marked as Top 3
- Subtasks are Tasks with `parentTaskId` set; fetched separately and joined in API
- Dependencies use `TaskDependency` join table with `taskId` (blocked) and `dependsOnId`

## Component Patterns

### Modals
- All modals accept `isOpen`, `onClose`, and callback props
- Use `createPortal` for dropdowns/overlays to avoid stacking context issues
- Apply `text-gray-900` to modal content containers for dark mode compatibility
- **SmartCaptureModal**: Natural language task input (e.g., "buy groceries tomorrow morning")
- **AIBreakdownModal**: AI-powered task breakdown into subtasks
  - Guided questions before generation: first step, what you need, where, what's hard
  - Interactive editing: click edit icon to modify subtask names and time estimates
  - Checkboxes to select/deselect individual subtasks before applying
  - "Start Over" to regenerate with different context
  - Conversational AI tone (casual, encouraging - talks TO user, not about them)
  - Focus on 3-5 minute micro-tasks (2-3 min for low energy, 5-7 for high)
  - Starts with ridiculously easy first steps to overcome initiation paralysis
- **DailyPrioritiesModal**: Select Top 3 tasks for the day
- **EditTaskModal**: Full task editing with subtasks, dependencies, time estimates

### TaskCard
- Contains badge components: `PriorityBadge`, `EnergyBadge`, `RolloverBadge`, `TaskAgeBadge`
- Context menu uses portal-based rendering positioned from button bounding rect
- Shows dependency chains and blocking status
- Displays Top 3 star indicator when `isTopPriority` is true

### Notifications & Celebrations
- **RolloverNotification**: Shows tasks automatically moved from yesterday
- **RolloverWarning**: Warns before automatic rollover will occur
- **UnblockedTasksNotification**: Alerts when dependencies complete
- **CelebrationMessage**: Confetti + encouraging messages on task completion
- **CompactFinishedTask**: Minimal display for completed tasks in finished section

### Top 3 Priorities System
- Users can select up to 3 daily focus tasks via `DailyPrioritiesModal`
- Tasks marked with `isTopPriority: true` and `topPriorityDate: YYYY-MM-DD`
- `Top3Section` component displays these prominently above time blocks
- Managed via `setTopPriorities(taskIds[], dateStr)` in `useTasks`

### Timezone Handling
- All date operations use user's timezone from `User.timezone` field (default: `America/Chicago`)
- Use `lib/utils/timezone.ts` helpers: `getTodayInTimezone()`, `getCurrentHourInTimezone()`
- Store dates as ISO strings `YYYY-MM-DD` but parse in user's timezone
- API route `/api/user/timezone` for managing user timezone preferences

## Development Commands
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Prisma generate + Next.js build
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run lint         # ESLint
```

## Authentication Flow
- Middleware in `middleware.ts` protects all routes except `/login`, `/register`, `/api/*`
- Unauthenticated users redirect to `/api/auth/signin`
- API routes use `getAuthSession()` from `lib/api/route_utils.ts`
- Session includes `user.id` via JWT callback in `lib/auth.ts`

## Common Gotchas
1. **Task fetching**: Parent tasks only at top level; subtasks fetched via `parentTaskId` and merged in `GET /api/tasks`
2. **Optimistic updates**: UI updates state immediately, rolls back on API failure
3. **Date handling**: Use `YYYY-MM-DD` strings, not Date objects; parse with `new Date(dateStr + 'T00:00:00')` to avoid timezone issues
4. **Timezone awareness**: Always use `getTodayInTimezone(userTimezone)` for date operations, not `new Date()`
5. **Icons**: Use Lucide React icons; task icons map via `iconMap` in TaskCard
6. **Intelligence events**: Task state changes should trigger `intelligence.trackEvent()` calls in API routes
7. **Top 3 priorities**: Date-specific (`topPriorityDate`), reset automatically at day rollover
8. **Dependencies**: Check for circular dependencies before adding; blocked tasks show warning badge
9. **Rollover system**: Runs automatically on first app load each day via `taskApi.rollover()`
10. **Natural language parsing**: Use `/api/tasks/parse` for smart task creation from text input

## Intelligence & Learning System

### Database Models
- **TaskEvent**: Event sourcing table - logs all task actions (created, updated, completed, moved, etc.)
- **UserInsight**: Learned patterns per user (time preferences, energy patterns, project habits)
- **Suggestion**: AI-generated recommendations with status tracking (pending/accepted/dismissed)
- **UserFeature**: Feature flags and AI preferences (smart suggestions, auto-scheduling, learning, etc.)

### Event Tracking Pattern
Every significant task action triggers an event:
```typescript
// In API routes after task operations
await intelligence.trackEvent({
    eventType: 'task_completed', // or 'created', 'moved', 'started', etc.
    userId: session.user.id,
    taskId: task.id,
    timeBlock: task.timeBlock,
    hourOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    projectId: task.projectId,
    priority: task.priority,
    energyLevel: task.energyLevel,
});
```

### Pattern Analysis
- Runs via `/api/intelligence` POST or `intelligence.analyzePatterns(userId)`
- Generates `UserInsight` records with confidence scores (0-1)
- Insight types: `time_preference`, `energy_pattern`, `project_timing`, `completion_rate`
- Patterns expire if not reinforced (see `expiresAt` field)

### Suggestion Generation
- Automatic: Triggered when loading app or via `/api/intelligence` POST
- Types: `time_block`, `priority`, `breakdown`, `schedule`, `overload_warning`, `stale_task`
- Frequency controlled by `UserFeature.suggestionFrequency` (minimal/balanced/proactive)
- Suggestions include `reasoning` field explaining the recommendation
- Users can accept/dismiss via `/api/intelligence/suggestions/[id]`

### Smart Features
1. **Natural Language Parsing**: `/api/tasks/parse` - converts text to structured tasks
2. **AI Breakdown**: `/api/intelligence/breakdown` - uses OpenAI GPT-4 to intelligently break down tasks into subtasks
   - Context-aware: considers energy level, time estimates, user patterns, project context
   - User instructions: optional field for users to explain why they're stuck or provide situational context
   - Interactive editing: users can edit subtask names and time estimates, select/deselect individual subtasks
   - Context learning: saves user instructions as TaskEvents (`breakdown_context`) to improve future suggestions
   - ADHD-friendly: starts with easiest subtasks, realistic time estimates, dopamine-friendly pacing
   - Fallback system: uses rule-based breakdown if AI unavailable
   - Saves suggestions to database for learning
3. **Time Block Suggestions**: Recommends optimal time blocks based on past completion patterns
4. **Daily Focus**: Suggests Top 3 tasks based on priority, deadlines, and user patterns
5. **Overload Detection**: Warns when too many tasks scheduled in one time block
6. **Stale Task Alerts**: Identifies tasks that have been pending too long

## Environment Variables
```
DATABASE_URL         # Prisma connection (pooled)
DIRECT_URL           # Prisma direct connection
NEXTAUTH_SECRET      # Auth encryption key
NEXTAUTH_URL         # App URL (http://localhost:3000)
GOOGLE_CLIENT_ID     # OAuth (optional)
GOOGLE_CLIENT_SECRET # OAuth (optional)
```
