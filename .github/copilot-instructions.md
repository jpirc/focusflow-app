# FocusFlow Copilot Instructions

## Project Overview
FocusFlow is an ADHD-friendly visual task planner built with **Next.js 14 App Router**, **TypeScript**, **Prisma/PostgreSQL**, and **NextAuth**. The app focuses on time-block scheduling (morning/afternoon/evening/anytime) with multi-day views, subtasks, and task dependencies.

## Architecture

### Stack & Structure
- **Frontend**: Next.js 14 App Router, React client components (`'use client'`), Tailwind CSS, Lucide icons
- **Backend**: Next.js API routes in `app/api/`, Prisma ORM with PostgreSQL (Supabase)
- **Auth**: NextAuth with JWT strategy, credentials + Google OAuth

### Key Directories
```
app/
├── page.tsx              # Main app (~300 lines, composition only)
├── api/                  # RESTful routes: tasks/, projects/, auth/
components/
├── layout/               # Sidebar.tsx, Header.tsx
├── TaskCard.tsx          # Task rendering with badges
├── EditTaskModal.tsx     # Task editing modal
hooks/
├── useTasks.ts           # Task state + all task operations
├── useProjects.ts        # Project state + CRUD
lib/
├── api/
│   ├── client.ts         # Typed fetch wrappers for API calls
│   └── route_utils.ts    # Server-side API utilities
├── utils/date.ts         # Date formatting helpers
├── constants.ts          # TIME_BLOCKS, defaults
types/index.ts            # Shared TypeScript types
prisma/schema.prisma      # Database schema
```

## Key Patterns

### Custom Hooks (Recommended Approach)
All business logic lives in hooks, not components:
```typescript
// Use hooks for state management
const { tasks, createTask, updateTask, deleteTask } = useTasks({ isAuthenticated });
const { projects, getProjectById } = useProjects({ isAuthenticated });
```

### API Client (lib/api/client.ts)
All API calls go through the typed client:
```typescript
import { taskApi, projectApi } from '@/lib/api/client';

const result = await taskApi.create({ title, date, timeBlock });
if (result.error) { /* handle error */ }
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

## Task Model Conventions
- `date`: ISO string `YYYY-MM-DD` or `null` (inbox/unscheduled)
- `timeBlock`: `'anytime' | 'morning' | 'afternoon' | 'evening'`
- `status`: `'pending' | 'in-progress' | 'completed' | 'skipped' | 'carried-over'`
- `priority`: `'low' | 'medium' | 'high' | 'urgent'`
- Subtasks are Tasks with `parentTaskId` set; fetched separately and joined in API
- Dependencies use `TaskDependency` join table with `taskId` (blocked) and `dependsOnId`

## Component Patterns

### Modals
- All modals accept `isOpen`, `onClose`, and callback props
- Use `createPortal` for dropdowns/overlays to avoid stacking context issues
- Apply `text-gray-900` to modal content containers for dark mode compatibility

### TaskCard
- Contains badge components: `PriorityBadge`, `EnergyBadge`, `RolloverBadge`, `TaskAgeBadge`
- Context menu uses portal-based rendering positioned from button bounding rect

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
4. **Icons**: Use Lucide React icons; task icons map via `iconMap` in TaskCard

## Environment Variables
```
DATABASE_URL         # Prisma connection (pooled)
DIRECT_URL           # Prisma direct connection
NEXTAUTH_SECRET      # Auth encryption key
NEXTAUTH_URL         # App URL (http://localhost:3000)
GOOGLE_CLIENT_ID     # OAuth (optional)
GOOGLE_CLIENT_SECRET # OAuth (optional)
```
