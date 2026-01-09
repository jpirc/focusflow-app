# Pomodoro Timer Implementation Plan

**Branch**: `feature/pomodoro-timer`  
**Created**: January 9, 2026

---

## 🎯 Overview

Integrate a full-featured Pomodoro timer system into FocusFlow, seamlessly connecting with existing task tracking infrastructure.

---

## 📊 Existing Infrastructure Audit

### Database Fields (Already Available)
From `prisma/schema.prisma` - Task model:
- ✅ `estimatedMinutes` (Int, default 30) - Already used for task time estimates
- ✅ `actualMinutes` (Int?) - Ready for tracking actual time spent
- ✅ `startedAt` (DateTime?) - Ready to track when task begins
- ✅ `completedAt` (DateTime?) - Already tracks completion time
- ✅ `status` (String) - Values: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'carried-over'

### TypeScript Types (types/index.ts)
- ✅ `Task.estimatedMinutes: number`
- ✅ `Task.actualMinutes?: number`
- ✅ `Task.startedAt?: string | null`
- ✅ `Task.completedAt?: string | null`
- ✅ `Task.status: TaskStatus`

### What We Need to Add
**None of the above** - they're already perfect! We just need to:
1. Add Pomodoro-specific tracking (sessions, user preferences)
2. Build the UI components
3. Connect to existing task state management

---

## 🗄️ New Database Schema

Add to `prisma/schema.prisma`:

```prisma
// User Pomodoro Settings
model UserPomodoroSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  
  // Timer durations (in minutes)
  workDuration      Int      @default(25)
  shortBreakDuration Int     @default(5)
  longBreakDuration Int      @default(15)
  pomodorosUntilLongBreak Int @default(4)
  
  // Preferences
  autoStartBreaks   Boolean  @default(true)
  autoStartPomodoros Boolean @default(false)
  soundEnabled      Boolean  @default(true)
  soundVolume       Float    @default(0.5)
  desktopNotifications Boolean @default(true)
  
  // Ambient sounds
  ambientSound      String?  // 'none' | 'rain' | 'cafe' | 'lofi' | 'whitenoise'
  ambientVolume     Float    @default(0.3)
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Individual Pomodoro Session Tracking
model PomodoroSession {
  id                String   @id @default(cuid())
  userId            String
  taskId            String?  // Optional - can have pomodoros not tied to tasks
  
  // Session details
  startedAt         DateTime
  endedAt           DateTime?
  plannedDuration   Int      // in minutes (usually 25)
  actualDuration    Int?     // in minutes (if stopped early)
  
  // Session outcome
  completed         Boolean  @default(false) // Did they finish the full duration?
  abandoned         Boolean  @default(false) // Did they stop it early?
  pausedDuration    Int      @default(0)     // Total time paused (in seconds)
  
  // Break tracking
  breakTaken        Boolean  @default(false)
  breakType         String?  // 'short' | 'long'
  breakDuration     Int?     // actual break time in minutes
  
  // Context
  sessionNumber     Int      @default(1) // Which pomodoro in the sequence (1-4)
  timeOfDay         Int?     // Hour of day (0-23)
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  task              Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)
  
  createdAt         DateTime @default(now())
  
  @@index([userId, startedAt])
  @@index([taskId])
}

// Update User model to add relation
model User {
  // ... existing fields
  pomodoroSettings  UserPomodoroSettings?
  pomodoroSessions  PomodoroSession[]
}

// Update Task model to add relation
model Task {
  // ... existing fields
  pomodoroSessions  PomodoroSession[]
}
```

---

## 🎨 Component Architecture

### 1. PomodoroTimer.tsx (Main Timer Widget)
**Location**: `components/PomodoroTimer.tsx`

**State**:
```typescript
type TimerState = 'idle' | 'work' | 'short-break' | 'long-break' | 'paused';

interface PomodoroTimerState {
  state: TimerState;
  currentTaskId: string | null;
  timeRemaining: number; // in seconds
  sessionNumber: number; // 1-4
  totalPausedTime: number; // in seconds
  sessionStartedAt: Date | null;
}
```

**Features**:
- Circular SVG progress ring
- Large time display (25:00 format)
- Task name display
- Play/Pause/Stop buttons
- Session counter: "🍅 2/4"
- Minimizable (collapses to small fab)
- Draggable position (stored in localStorage)
- Keyboard shortcuts (Space=pause, Esc=stop)

**Props**:
```typescript
interface PomodoroTimerProps {
  task: Task | null;
  onComplete: (sessionData: PomodoroSessionData) => void;
  onStop: () => void;
}
```

### 2. PomodoroStartModal.tsx
**Location**: `components/PomodoroStartModal.tsx`

Quick settings before starting:
- Duration selection (15/25/45/60 min)
- "Skip this prompt next time" checkbox
- Start button

### 3. PomodoroBreakScreen.tsx
**Location**: `components/PomodoroBreakScreen.tsx`

Full-screen overlay during breaks:
- Time remaining
- Encouraging messages
- "Skip break" / "End break early" buttons
- Option to start next pomodoro

### 4. PomodoroSettings.tsx
**Location**: `components/PomodoroSettings.tsx`

Settings panel (in /settings page):
- Work duration slider
- Break duration sliders
- Sound preferences
- Auto-start toggles
- Notification preferences

### 5. PomodoroStats.tsx
**Location**: `components/PomodoroStats.tsx`

Analytics component (for /analytics page):
- Pomodoros completed today/week/month
- Average session completion rate
- Best time of day chart
- Focus streak tracker

---

## 🔌 Integration Points

### useTasks Hook Updates
**Location**: `hooks/useTasks.ts`

Add:
```typescript
const startPomodoro = async (taskId: string) => {
  // Update task status to 'in-progress'
  // Set startedAt timestamp
  // Trigger PomodoroTimer component
};

const completePomodoro = async (taskId: string, sessionData: PomodoroSessionData) => {
  // Save PomodoroSession to database
  // Update task.actualMinutes
  // Track TaskEvent ('pomodoro_completed')
};
```

### New Hook: usePomodoro
**Location**: `hooks/usePomodoro.ts`

```typescript
interface UsePomodoroReturn {
  // State
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  currentTask: Task | null;
  sessionNumber: number;
  timerState: TimerState;
  
  // Settings
  settings: UserPomodoroSettings;
  updateSettings: (settings: Partial<UserPomodoroSettings>) => Promise<void>;
  
  // Actions
  startPomodoro: (task: Task, duration?: number) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  stopPomodoro: () => void;
  completePomodoro: () => void;
  skipBreak: () => void;
  
  // Stats
  todayStats: {
    completed: number;
    abandoned: number;
    totalMinutes: number;
  };
}
```

### TaskCard Updates
**Location**: `components/TaskCard.tsx`

Add:
- "Start Pomodoro" button when status='pending'
- Timer display when status='in-progress' and pomodoro active
- Pomodoro count badge: "🍅×3" (3 completed sessions)

---

## 🛣️ API Routes

### POST /api/pomodoro/start
Start a new pomodoro session

**Body**:
```typescript
{
  taskId?: string;
  duration: number; // minutes
}
```

**Response**:
```typescript
{
  sessionId: string;
  startedAt: string;
  duration: number;
}
```

### POST /api/pomodoro/complete
Complete current session

**Body**:
```typescript
{
  sessionId: string;
  actualDuration: number; // minutes
  completed: boolean;
  pausedDuration: number; // seconds
}
```

### POST /api/pomodoro/settings
Update user settings

**Body**: `Partial<UserPomodoroSettings>`

### GET /api/pomodoro/settings
Get user settings (create defaults if none exist)

### GET /api/pomodoro/stats?period=today|week|month
Get pomodoro statistics

---

## 🎯 Task Status Flow

```
PENDING 
  ↓ [Click "Start Pomodoro"]
  → PomodoroStartModal appears
  ↓ [User confirms]
  → Set status='in-progress', startedAt=now()
  → Start PomodoroTimer widget
  
IN-PROGRESS (Timer Running)
  → PomodoroTimer shows countdown
  → User can pause/resume/stop
  
Timer Completes (00:00)
  → Play notification sound
  → Show celebration animation
  → Save PomodoroSession (completed=true)
  → Update task.actualMinutes
  → Show PomodoroBreakScreen
  → Ask: "Take a break?" or "Complete task?"
  
User Marks Task Complete
  → Set status='completed', completedAt=now()
  → Stop any active timer
  → Save final PomodoroSession if running
```

---

## 🎨 UI/UX Details

### Timer Widget Positions
- Default: Bottom-right corner (24px from edges)
- Draggable to any corner
- Position saved to `localStorage.pomodoroPosition`
- Never covers task cards (z-index: 1000)

### Visual States
**Work Mode** (Red theme):
- Border: red-500
- Progress ring: red-500
- Background: red-50/90

**Break Mode** (Green theme):
- Border: green-500
- Progress ring: green-500
- Background: green-50/90

**Paused** (Gray theme):
- Border: gray-400
- Progress ring: gray-400
- Icon: pause symbol

### Keyboard Shortcuts
- **Space**: Pause/Resume timer
- **Esc**: Stop timer (with confirmation)
- **Enter**: Complete pomodoro early (with confirmation)
- **B**: Start break manually

### Notifications
**Browser Notifications** (if permission granted):
- "🍅 Pomodoro complete! Time for a break"
- "☕ Break over! Ready to focus?"
- "🎯 Task completed! Great work!"

**Sound Effects** (optional, user-controlled):
- Gentle chime on pomodoro complete
- Soft ding on break end
- No jarring alarms (ADHD-friendly)

---

## 📈 Analytics & Events

### New TaskEvent Types
Add to `lib/intelligence/types.ts`:
```typescript
'pomodoro_started'
'pomodoro_completed'
'pomodoro_abandoned'
'break_started'
'break_skipped'
```

### Tracked Metrics
- Total pomodoros completed (per day/week/month)
- Average completion rate (completed vs abandoned %)
- Best time of day for focus (most completed pomodoros)
- Average actual vs estimated time
- Streak: consecutive completed pomodoros
- Task velocity: tasks per pomodoro

---

## 🚀 Implementation Phases

### Phase 1: Database & Settings (Day 1)
- [x] Update `prisma/schema.prisma`
- [x] Run migration: `npx prisma db push` (added UserPomodoroSettings & PomodoroSession)
- [x] Create `/api/pomodoro/settings` route
- [x] Create `/api/pomodoro/start` route
- [x] Create `/api/pomodoro/complete` route
- [x] Create `/api/pomodoro/stats` route
- [ ] Build `PomodoroSettings.tsx` component
- [ ] Add settings to `/settings` page

### Phase 2: Core Timer Logic (Day 2)
- [x] Create `usePomodoro.ts` hook
- [x] Build timer state machine
- [x] Implement countdown logic (drift-free with endTime calculation)
- [x] Add pause/resume functionality
- [x] Test timer accuracy (uses 100ms intervals for precision)

### Phase 3: Timer UI (Day 3)
- [ ] Build `PomodoroTimer.tsx` widget
- [ ] Implement circular progress ring (SVG)
- [ ] Add drag-and-drop positioning
- [ ] Implement minimize/expand
- [ ] Add keyboard shortcuts

### Phase 4: Integration (Day 4)
- [ ] Update `TaskCard.tsx` with "Start Pomodoro" button
- [ ] Connect to `useTasks` hook
- [ ] Implement task status updates
- [ ] Create `/api/pomodoro/start` and `/api/pomodoro/complete`
- [ ] Save pomodoro sessions to database

### Phase 5: Breaks & Polish (Day 5)
- [ ] Build `PomodoroBreakScreen.tsx`
- [ ] Implement break timers
- [ ] Add celebration animations
- [ ] Browser notifications
- [ ] Sound effects

### Phase 6: Analytics (Day 6)
- [ ] Create `/api/pomodoro/stats` route
- [ ] Build `PomodoroStats.tsx` component
- [ ] Add to `/analytics` page
- [ ] Track TaskEvents
- [ ] Generate insights

---

## 🧪 Testing Checklist

- [ ] Start pomodoro from task card
- [ ] Pause and resume timer
- [ ] Stop timer early (confirm dialog)
- [ ] Complete full pomodoro (25 min)
- [ ] Short break auto-start
- [ ] Long break after 4 pomodoros
- [ ] Skip break functionality
- [ ] Multiple consecutive pomodoros
- [ ] Task completion during active pomodoro
- [ ] Settings persistence
- [ ] Keyboard shortcuts
- [ ] Browser notifications
- [ ] Drag timer to different positions
- [ ] Minimize/expand timer
- [ ] Analytics accuracy
- [ ] Mobile responsiveness

---

## 🎨 Theme Integration

Use existing theme system from `lib/themes.ts`:
- Timer colors match current theme
- Dark mode support
- Maintain ADHD-friendly compact design
- Animations respect `prefers-reduced-motion`

---

## 🔮 Future Enhancements (Post-MVP)

- [ ] Ambient sound integration (rain, cafe, lofi)
- [ ] Smart break suggestions based on energy level
- [ ] Pomodoro scheduling: "I'll work on this for 2 pomodoros"
- [ ] Team pomodoros (co-working sessions)
- [ ] Integration with calendar for focused time blocks
- [ ] AI suggestions: "This task typically takes 3 pomodoros"
- [ ] Custom pomodoro lengths per task type
- [ ] Deep work mode (2-hour focus blocks)

---

## 📝 Notes

- Keep UI minimal and non-intrusive (ADHD-friendly)
- Timer must be accurate (no drift from setInterval)
- Settings should have sensible defaults
- Break screens should be skippable (respect flow state)
- Celebrate completions with dopamine hits
- Track everything for analytics/learning
- Maintain existing task workflow (don't disrupt)

