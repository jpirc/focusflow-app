# ADHD-Friendly Features Development Plan

## Overview
Features designed specifically to help with executive dysfunction, time blindness, decision fatigue, and activation energy - the core challenges of ADHD.

---

## Priority 1: "Start Now" Button ⚡
**Impact:** 🔥🔥🔥🔥🔥 | **Effort:** 1-2 hours | **Status:** 🔄 In Progress

### Problem
Decision paralysis + activation energy barrier. Current flow requires:
1. Pick a task
2. Decide when to schedule it
3. Move it to timeline
4. Set status to in-progress
5. Start timer
= **5 decisions** before you can start working

### Solution
Single button that does EVERYTHING:
```
[⚡ Start Now] →
  • Schedules task at current time
  • Sets status to in-progress
  • Starts Pomodoro timer
  • Optional: Enter focus mode
```

### Implementation Plan
**Files to modify:**
- `components/CompactInboxTask.tsx` - Add button to inbox tasks
- `components/QuickEditTaskCard.tsx` - Add button to task cards
- `components/Top3Section.tsx` - Add button to top 3 priorities
- `components/QuickWinSuggestions.tsx` - Add button to quick wins
- `hooks/useTasks.ts` - Add `startTaskNow()` method
- `hooks/usePomodoro.ts` - Already has `startPomodoro(task)` method

**New component:**
- `components/ui/StartNowButton.tsx` - Reusable button component

**Logic:**
```typescript
const startTaskNow = async (task: Task) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Determine time block
  const timeBlock = getTimeBlockForHour(currentHour);

  // Batch update: schedule + set in-progress
  await taskApi.batchUpdate([
    {
      id: task.id,
      data: {
        date: formatDate(now),
        timeBlock,
        scheduledHour: currentHour,
        scheduledMinute: currentMinute,
        status: 'in-progress',
        startedAt: now.toISOString(),
      }
    }
  ]);

  // Start timer
  pomodoro.startPomodoro(task);
};
```

**UI States:**
- Default: `⚡ Start Now`
- Loading: `⏳ Starting...`
- Success: `✅ Started!` (brief, then hide)

**Acceptance Criteria:**
- [ ] Button appears on inbox tasks
- [ ] Button appears on task cards (sidebar, timeline)
- [ ] Button appears in Top 3 section
- [ ] Button appears in Quick Win modal
- [ ] Single click schedules + starts + timer
- [ ] Works from all locations consistently
- [ ] Visual feedback during action
- [ ] Error handling if API fails

---

## Priority 2: "I Have X Minutes" Filter 🕐
**Impact:** 🔥🔥🔥🔥 | **Effort:** 1 hour | **Status:** 📋 Planned

### Problem
Time blindness leads to picking tasks that don't fit available time. ADHD brains struggle with time estimation and matching tasks to time slots.

### Solution
Quick filter buttons in inbox/sidebar:
```
Filter by time:  [15m] [30m] [1h] [2h] [All]
↓
Shows only tasks with estimatedMinutes ≤ selected duration
Sorts by: Quick wins first → High priority → Rollover count
```

### Implementation Plan
**Files to modify:**
- `components/layout/Sidebar.tsx` - Add filter buttons above inbox
- `hooks/useTaskFilters.ts` - Add `timeFilter` state + filtered logic

**New component:**
- `components/ui/TimeFilterButtons.tsx` - Reusable filter UI

**Logic:**
```typescript
const [timeFilter, setTimeFilter] = useState<number | null>(null);

const filteredInboxTasks = useMemo(() => {
  let filtered = inboxTasks;

  if (timeFilter !== null) {
    filtered = filtered.filter(t =>
      (t.estimatedMinutes || 30) <= timeFilter
    );
  }

  // Sort: quick wins first, then priority, then rollover
  return filtered.sort((a, b) => {
    // Quick wins (≤15 min) first
    const aQuick = (a.estimatedMinutes || 30) <= 15 ? 1 : 0;
    const bQuick = (b.estimatedMinutes || 30) <= 15 ? 1 : 0;
    if (aQuick !== bQuick) return bQuick - aQuick;

    // Then priority
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    if (aPriority !== bPriority) return bPriority - aPriority;

    // Then rollover count
    const aRollovers = a.rolloverCount || 0;
    const bRollovers = b.rolloverCount || 0;
    return bRollovers - aRollovers;
  });
}, [inboxTasks, timeFilter]);
```

**Acceptance Criteria:**
- [ ] Filter buttons appear above inbox
- [ ] Clicking filter shows only matching tasks
- [ ] Shows count: "Showing 5 tasks (≤30 min)"
- [ ] Sorts intelligently (quick wins → priority → rollover)
- [ ] Works with project filter
- [ ] Clear visual indication of active filter

---

## Priority 3: Visual Time Budget 📊
**Impact:** 🔥🔥🔥🔥 | **Effort:** 1 hour | **Status:** 📋 Planned

### Problem
Overcommitting is very ADHD - you can't "see" time, so you schedule 14 hours in a 12-hour day. Need concrete visual feedback.

### Solution
Progress bar showing scheduled time vs available time:
```
Today: ████████░░░░  8h scheduled / 12h available ✅
       ⬆ Good capacity

vs

Today: ████████████▓▓  14h / 12h ⚠️ OVERBOOKED
       ⬆ 2 hours over capacity!
```

**Traffic Light Colors:**
- 🟢 Green: < 80% capacity (comfortable)
- 🟡 Yellow: 80-100% (full but doable)
- 🔴 Red: > 100% (overbooked - reality check!)

### Implementation Plan
**Files to modify:**
- `components/layout/Header.tsx` - Add time budget bar
- `hooks/useTaskFilters.ts` - Add time budget calculation

**New component:**
- `components/ui/TimeBudgetBar.tsx`

**Logic:**
```typescript
const timeBudget = useMemo(() => {
  const todayTasks = tasks.filter(t =>
    t.date === todayDateStr &&
    t.status !== 'completed'
  );

  const scheduledMinutes = todayTasks.reduce((sum, t) =>
    sum + (t.estimatedMinutes || 0), 0
  );

  // Assume 12-hour workday (6am - 10pm = 16h, but realistic is ~12h)
  const availableMinutes = 12 * 60; // 720 minutes

  const percentUsed = (scheduledMinutes / availableMinutes) * 100;

  return {
    scheduled: scheduledMinutes / 60, // hours
    available: availableMinutes / 60,
    percentUsed,
    status: percentUsed < 80 ? 'good' :
            percentUsed <= 100 ? 'full' : 'over',
    overBy: scheduledMinutes > availableMinutes ?
            (scheduledMinutes - availableMinutes) / 60 : 0
  };
}, [tasks, todayDateStr]);
```

**Acceptance Criteria:**
- [ ] Bar appears in header (not intrusive)
- [ ] Updates in real-time as tasks are added/removed
- [ ] Color changes based on capacity
- [ ] Shows "X hours scheduled / Y available"
- [ ] Red state shows "N hours over capacity"
- [ ] Tooltip with breakdown on hover

---

## Priority 4: "Continue Task" Resume 🔄
**Impact:** 🔥🔥🔥 | **Effort:** 2 hours | **Status:** 📋 Planned

### Problem
Context switching is expensive for ADHD brains. Forgetting what you were working on = wasted energy re-orienting.

### Solution
**In header** (when task is in-progress):
```
┌────────────────────────────────────┐
│ 🟢 "Write blog post" (23min)      │
│ [▶ Continue] [⏸ Pause] [✓ Done]   │
└────────────────────────────────────┘
```

**On app open** (if stale in-progress task):
```
Modal:
"You were working on: Write blog post
Last active: 2 hours ago"

[▶ Resume] [✓ Mark Done] [❌ I Forgot - Move to Inbox]
```

### Implementation Plan
**Files to modify:**
- `components/layout/Header.tsx` - Add continue bar (already has activeTask!)
- `app/page.tsx` - Add stale task detection on mount

**New component:**
- `components/StaleTaskModal.tsx`

**Logic:**
```typescript
// Check for stale in-progress task on mount
useEffect(() => {
  const inProgressTask = tasks.find(t => t.status === 'in-progress');

  if (inProgressTask && inProgressTask.startedAt) {
    const minutesSinceActive = (Date.now() - new Date(inProgressTask.startedAt).getTime()) / 60000;

    // If inactive for > 5 minutes, prompt
    if (minutesSinceActive > 5 && !pomodoro.isActive) {
      setStaleTask(inProgressTask);
      setStaleTaskModalOpen(true);
    }
  }
}, [tasks]);
```

**Acceptance Criteria:**
- [ ] Header shows continue bar when task is in-progress
- [ ] Continue button resumes timer
- [ ] Pause button pauses task + timer
- [ ] Done button marks complete + celebration
- [ ] Modal appears on app open if stale task exists
- [ ] Modal offers 3 clear actions
- [ ] Works with Pomodoro timer state

---

## Priority 5: "Let Me Pick For You" Smart Suggestion 🎲
**Impact:** 🔥🔥🔥 | **Effort:** 2-3 hours | **Status:** 📋 Planned

### Problem
Decision fatigue. Sometimes you just can't decide what to work on next.

### Solution
AI-ish algorithm that picks the "best" next task:
```
[🎲 What should I work on?]
↓
Modal shows:
"I think you should: Write blog post (30min, medium energy)"

Why this task:
- Matches current time of day (afternoon → medium energy)
- High priority
- Rolled over 2 times
- Fits in your schedule

[⚡ Start It] [🔄 Pick Different] [✕ Cancel]
```

### Algorithm Rules
```typescript
const suggestNextTask = (tasks: Task[], timeOfDay: 'morning' | 'afternoon' | 'evening') => {
  // 1. Filter out blocked tasks
  const available = tasks.filter(t => !isBlocked(t));

  // 2. Match energy level to time of day
  const energyMatch = {
    morning: 'high',
    afternoon: 'medium',
    evening: 'low'
  };

  const energyMatched = available.filter(t =>
    t.energyLevel === energyMatch[timeOfDay]
  );

  // 3. Score tasks
  const scored = (energyMatched.length > 0 ? energyMatched : available).map(t => ({
    task: t,
    score: (
      (t.priority === 'urgent' ? 100 :
       t.priority === 'high' ? 50 :
       t.priority === 'medium' ? 25 : 10) +
      (t.rolloverCount || 0) * 20 +
      (t.isTopPriority ? 30 : 0) +
      ((t.estimatedMinutes || 30) <= 15 ? 15 : 0) // quick win bonus
    )
  }));

  // 4. Sort by score + add variety (avoid same project 3x in a row)
  scored.sort((a, b) => b.score - a.score);

  return scored[0].task;
};
```

**Acceptance Criteria:**
- [ ] Button appears in header or sidebar
- [ ] Algorithm considers time of day, energy, priority, rollovers
- [ ] Shows reasoning for suggestion
- [ ] "Pick Different" shows next best option
- [ ] "Start It" button uses "Start Now" flow
- [ ] Avoids suggesting same project consecutively

---

## Priority 6: Focus Mode 👁️
**Impact:** 🔥🔥🔥 | **Effort:** 2 hours | **Status:** 📋 Planned

### Problem
Overwhelm from seeing everything when you should just focus on one thing.

### Solution
When task is in-progress, option to hide everything else:
```
[Enter Focus Mode] (when task is in-progress)
↓
Shows ONLY:
- Current task (large)
- Timer
- Subtasks (if any)
- Minimal UI (just Exit button)

Big friendly message: "You're doing great. Just this one thing."
```

**Keyboard shortcut:** `F` or `Cmd+Shift+F`

### Implementation Plan
**Files to modify:**
- `app/page.tsx` - Add focus mode state
- `components/layout/Header.tsx` - Hide in focus mode
- `components/layout/Sidebar.tsx` - Hide in focus mode

**New component:**
- `components/FocusModeView.tsx`

**Acceptance Criteria:**
- [ ] Button appears when task is in-progress
- [ ] Hides sidebar, header (except essentials), other tasks
- [ ] Shows current task large and centered
- [ ] Shows timer prominently
- [ ] Shows subtasks if they exist
- [ ] Press Esc or click Exit to return
- [ ] Calming, minimal design
- [ ] Optional: white noise player?

---

## Priority 7: Reality Check Report 📉
**Impact:** 🔥🔥 | **Effort:** 3 hours | **Status:** 📋 Planned

### Problem
ADHD brains are notoriously bad at time estimation. Need data-driven feedback loop.

### Solution
Weekly gentle report comparing estimates vs reality:
```
Weekly Report (appears Monday morning):

"This week you:
✅ Completed 12 tasks (awesome!)
⏱️ Estimated 18 hours, actually took 24 hours

💡 Insight: Your tasks usually take 1.3x longer than estimated

Patterns:
- Writing tasks: 1.5x longer than estimated
- Quick tasks (≤15min): accurate!
- Deep work: 1.8x longer

[Adjust All Future Estimates +30%] [Remind Me Next Week]"
```

### Implementation Plan
**Files to create:**
- `app/api/analytics/time-accuracy/route.ts` - Calculate stats
- `components/RealityCheckModal.tsx` - Weekly report modal
- `hooks/useTimeAccuracy.ts` - Fetch and display stats

**Acceptance Criteria:**
- [ ] Calculates estimate vs actual for completed tasks
- [ ] Shows overall accuracy ratio
- [ ] Breaks down by task type or project
- [ ] Option to auto-adjust future estimates
- [ ] Appears weekly (Monday morning)
- [ ] Can be dismissed/snoozed
- [ ] Non-judgmental, encouraging tone

---

## Priority 8: Body Double Mode 🤝
**Impact:** 🔥🔥 | **Effort:** 1 hour | **Status:** 📋 Planned

### Problem
Many ADHD people work better with "body doubling" - someone just being present provides accountability.

### Solution
Optional encouraging presence during work sessions:
```
When timer starts:
"I'm here with you. Let's do this together."

Every 15 minutes:
"Still here. You're doing great."

When pomodoro completes:
"Nice work! Take a breather."

When task completes:
"We did it! That was solid work."
```

**Tone:** Supportive, not patronizing. Friend, not coach.

### Implementation Plan
**Files to modify:**
- `hooks/usePomodoro.ts` - Add body double messages
- `components/PomodoroOverlay.tsx` - Display messages

**Settings option:**
- Toggle on/off
- Choose message frequency (every 5min, 10min, 15min, 30min)
- Choose tone (encouraging, neutral, minimal)

**Acceptance Criteria:**
- [ ] Messages appear during Pomodoro sessions
- [ ] Configurable in settings
- [ ] Non-intrusive, subtle display
- [ ] Genuine, not cheesy
- [ ] Can be dismissed/minimized
- [ ] Works with focus mode

---

## Implementation Order

### Week 1: Quick Wins (High Impact, Low Effort)
1. **Day 1-2:** "Start Now" Button ⚡ (Priority 1)
2. **Day 3:** "I Have X Minutes" Filter 🕐 (Priority 2)
3. **Day 4:** Visual Time Budget 📊 (Priority 3)
4. **Day 5:** Testing & refinement

### Week 2: Medium Features
5. **Day 1-2:** "Continue Task" Resume 🔄 (Priority 4)
6. **Day 3-4:** "Let Me Pick For You" 🎲 (Priority 5)
7. **Day 5:** Focus Mode 👁️ (Priority 6)

### Week 3: Analytics & Polish
8. **Day 1-2:** Reality Check Report 📉 (Priority 7)
9. **Day 3:** Body Double Mode 🤝 (Priority 8)
10. **Day 4-5:** Polish, testing, user feedback

---

## Design Principles

1. **Reduce Friction:** Every feature should REMOVE decisions, not add them
2. **Concrete > Abstract:** Make invisible things (time, progress) visible
3. **Gentle Nudges:** Never shame, always encourage
4. **One-Click Actions:** Default to fastest path
5. **Fail Gracefully:** Errors shouldn't break flow
6. **Respect Energy:** Match task suggestions to energy level
7. **Build Trust:** Accurate time estimates build better planning over time

---

## Success Metrics

### Activation Energy (Goal: -50%)
- Clicks to start task: 5 → 1 ✅
- Time from "I should work" to actually working: measure

### Time Awareness (Goal: +30% accuracy)
- Estimate vs actual ratio: track weekly
- Overcommitting frequency: measure days over capacity

### Completion Rate (Goal: +25%)
- Tasks completed per day: track
- Rolled over tasks: reduce
- Abandoned tasks: reduce

### Subjective (User Feedback)
- "I felt less overwhelmed" (1-10 scale)
- "I knew what to work on" (1-10 scale)
- "I didn't overcommit" (1-10 scale)
- "I actually started tasks" (1-10 scale)
