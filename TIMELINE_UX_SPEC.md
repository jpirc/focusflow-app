# Timeline UX Improvements - Implementation Spec

**Created:** January 28, 2026
**Updated:** January 28, 2026
**Status:** In Progress
**Priority:** Critical (blocks visual redesign completion)

## Recent Progress (Jan 28, 2026)

✅ **Completed:**
- Timeline header removed to save vertical space
- Adaptive timeline card layouts (short/medium/long tasks)
- Title-first visual hierarchy for better scanability
- Compact mode applied universally across all views
- Panel split changed from 67/33 to 50/50
- Floating tasks band implemented (all-day section at top)

🔧 **Known Issues:**
- Page refreshes when dragging to expand tasks on timeline (needs state management fix)
- TimeBudget doesn't include completed tasks (progress disappears when tasks are done)
- No configurable time range for TimeBudget (should support 9-5, 8-6, etc.)

---

---

## Problem Statement

Current timeline limitations:
1. **No support for "floating" tasks** - Tasks that need to happen today but not at a specific time (e.g., "respond to emails when you have time")
2. **Can't overlap tasks** - Only one task per time slot, but real life has parallel tasks (meetings, phone calls during other work)
3. **Drag/drop needs improvement** - Current implementation has issues with smooth snapping and conflict handling

---

## Feature 1: Floating / All-Day Tasks

### User Story
> "As a user, I want to add tasks that must happen today but aren't tied to a specific time, so I can see my flexible work without blocking my scheduled tasks."

### Examples
- "Respond to emails throughout the day"
- "Review documents when you have time"
- "Quick admin tasks"
- "Background research"

### Design

#### Visual Layout
```
┌─────────────────────────────────────┐
│  FLOATING TASKS (All-Day Band)      │ ← New section at top
│  ┌────────────┐  ┌────────────┐     │
│  │ Emails     │  │ Admin      │     │
│  └────────────┘  └────────────┘     │
├─────────────────────────────────────┤
│  6am ─────────────────────────────  │
│     ┌──────────────┐                │
│     │ Morning Call │                │ ← Regular scheduled tasks
│     └──────────────┘                │
│  9am ─────────────────────────────  │
│  ...                                │
└─────────────────────────────────────┘
```

#### Database Schema
```prisma
model Task {
  // ... existing fields

  // New field for floating tasks
  isFloating        Boolean   @default(false)

  // When isFloating = true:
  // - scheduledHour and scheduledMinute are NULL
  // - date is set (shows which day it's for)
  // - timeBlock can be 'anytime' or specific block for suggestions
}
```

#### Component Changes

**TimelinePanel.tsx:**
```typescript
// Add floating tasks band at top (before hour grid)
<div className="floating-tasks-band bg-blue-50 border-b border-blue-200 p-2">
  <div className="text-xs font-semibold text-blue-600 mb-1">Today (anytime)</div>
  <div className="flex flex-wrap gap-2">
    {floatingTasks.map(task => (
      <FloatingTaskCard
        key={task.id}
        task={task}
        onSchedule={(hour, minute) => {
          // Convert floating task to scheduled task
          updateTask(task.id, {
            isFloating: false,
            scheduledHour: hour,
            scheduledMinute: minute
          });
        }}
      />
    ))}
  </div>
</div>
```

**SmartCaptureModal.tsx:**
```typescript
// When parsing, detect phrases like "when I have time", "throughout the day"
// Set isFloating = true, scheduledHour = null

// Examples:
// "respond to emails throughout the day" → isFloating: true
// "call client at 2pm" → isFloating: false, scheduledHour: 14
```

#### User Interactions
1. **Create floating task**: Natural language "emails throughout the day" OR click "Add Floating Task" button
2. **Schedule floating task**: Drag from floating band → timeline converts to scheduled
3. **Un-schedule task**: Drag scheduled task → floating band converts to floating
4. **Quick schedule**: Right-click floating task → "Schedule now" (uses current time)

---

## Feature 2: Overlapping Tasks (Multi-Lane Timeline)

### User Story
> "As a user, I want to schedule multiple tasks at the same time, so I can handle parallel work like meetings during projects or back-to-back calls."

### Examples
- Two 30-min calls scheduled at same time (can handle both)
- Meeting during a larger project block
- Multiple short tasks that can be done in parallel

### Design

#### Visual Layout (Google Calendar Style)
```
9:00 ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ Call A   │ │ Call B   │ │ Email    │  ← 3 tasks at 9am
     │ 30 min   │ │ 30 min   │ │ 15 min   │
9:30 └──────────┘ └──────────┘ │          │
                                └──────────┘

10:00 ┌───────────────────────┐
      │ Single task           │  ← No overlap, full width
      │ 60 min                │
11:00 └───────────────────────┘
```

#### Overlap Detection Algorithm
```typescript
interface OverlapGroup {
  startTime: number; // minutes from midnight
  endTime: number;
  tasks: Task[];
  columns: number; // how many lanes
}

function detectOverlaps(tasks: Task[]): OverlapGroup[] {
  // Sort by start time
  const sorted = tasks
    .filter(t => t.scheduledHour !== null)
    .sort((a, b) => {
      const aStart = a.scheduledHour * 60 + (a.scheduledMinute || 0);
      const bStart = b.scheduledHour * 60 + (b.scheduledMinute || 0);
      return aStart - bStart;
    });

  const groups: OverlapGroup[] = [];
  let currentGroup: Task[] = [];
  let groupEnd = 0;

  for (const task of sorted) {
    const taskStart = task.scheduledHour * 60 + (task.scheduledMinute || 0);
    const taskEnd = taskStart + (task.estimatedMinutes || 30);

    // If task starts before current group ends, it overlaps
    if (taskStart < groupEnd && currentGroup.length > 0) {
      currentGroup.push(task);
      groupEnd = Math.max(groupEnd, taskEnd);
    } else {
      // No overlap, save previous group and start new one
      if (currentGroup.length > 0) {
        groups.push({
          startTime: /* calculate */,
          endTime: groupEnd,
          tasks: currentGroup,
          columns: currentGroup.length,
        });
      }
      currentGroup = [task];
      groupEnd = taskEnd;
    }
  }

  // Save last group
  if (currentGroup.length > 0) {
    groups.push({
      startTime: /* calculate */,
      endTime: groupEnd,
      tasks: currentGroup,
      columns: currentGroup.length,
    });
  }

  return groups;
}
```

#### Rendering with Columns
```typescript
function renderOverlapGroup(group: OverlapGroup) {
  const columnWidth = 100 / group.columns; // e.g., 50% for 2 columns

  return (
    <div className="relative" style={{ height: calculateHeight(group) }}>
      {group.tasks.map((task, index) => (
        <div
          key={task.id}
          className="absolute"
          style={{
            left: `${index * columnWidth}%`,
            width: `${columnWidth - 1}%`, // -1% for gap
            top: calculateTopOffset(task, group.startTime),
            height: calculateHeight(task),
          }}
        >
          <TimelineTaskCard task={task} compact={group.columns > 2} />
        </div>
      ))}
    </div>
  );
}
```

#### Overflow Handling
- **Max 3 visible columns**: If more than 3 overlapping tasks, show "+2 more" indicator
- **Click to expand**: Opens modal showing all overlapping tasks
- **Priority sorting**: Show highest priority/earliest tasks first

#### Database Impact
- No schema changes needed!
- Rendering logic handles overlaps dynamically

---

## Feature 3: Improved Drag & Drop

### Current Issues
1. Snapping feels "jumpy" on fast drags
2. Preview doesn't always show correctly
3. Conflict handling interrupts drag operation
4. No visual feedback for drop zones

### Improvements

#### Smooth Snapping
```typescript
// Use requestAnimationFrame for smooth updates
const handleDrag = useCallback((e: DragEvent) => {
  requestAnimationFrame(() => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    const minutesSinceMidnight = (y / HOUR_HEIGHT) * 60 + START_HOUR * 60;

    // Snap to 15 min intervals
    const snapped = Math.round(minutesSinceMidnight / 15) * 15;
    const hour = Math.floor(snapped / 60);
    const minute = snapped % 60;

    setDropPreview({ hour, minute, visible: true });
  });
}, []);
```

#### Visual Drop Zones
```typescript
// Highlight valid drop targets
<div
  className={`drop-zone ${isDragOver ? 'bg-blue-100 border-blue-300' : ''}`}
  onDragEnter={handleDragEnter}
  onDragLeave={handleDragLeave}
>
  {/* Timeline hour slot */}
</div>
```

#### Conflict Resolution
```typescript
// Instead of blocking drop, auto-adjust to next available slot
const handleDrop = async (taskId: string, hour: number, minute: number) => {
  const conflicts = detectConflicts(taskId, hour, minute);

  if (conflicts.length > 0) {
    // Option 1: Allow overlap (new multi-lane feature)
    if (userPrefersOverlap) {
      await scheduleTask(taskId, hour, minute);
    }

    // Option 2: Auto-adjust to next slot
    else {
      const nextSlot = findNextAvailableSlot(hour, minute);
      await scheduleTask(taskId, nextSlot.hour, nextSlot.minute);
      showToast(`Moved to ${formatTime(nextSlot)} to avoid conflict`);
    }
  }
};
```

---

## Implementation Plan

### Phase 1: Floating Tasks (Week 1)
- [ ] Add `isFloating` field to Task model + migration
- [ ] Create FloatingTaskCard component
- [ ] Add floating tasks band to TimelinePanel
- [ ] Update SmartCaptureModal to detect floating tasks
- [ ] Implement drag floating → scheduled conversion
- [ ] Add "Schedule now" quick action

### Phase 2: Overlapping Tasks (Week 2)
- [ ] Implement overlap detection algorithm
- [ ] Create multi-lane rendering system
- [ ] Test with 2, 3, 4+ overlapping tasks
- [ ] Add overflow indicator (+N more)
- [ ] Handle edge cases (tasks spanning multiple groups)
- [ ] Update drag/drop to allow overlaps

### Phase 3: Drag & Drop Polish (Week 1)
- [ ] Smooth snapping with requestAnimationFrame
- [ ] Visual drop zone highlights
- [ ] Better conflict resolution UX
- [ ] Drag preview improvements
- [ ] Test across all drag sources (inbox, time blocks, floating)

---

## User Preferences

Add settings for timeline behavior:

```typescript
interface TimelinePreferences {
  allowOverlappingTasks: boolean; // Default: true
  maxOverlappingTasks: number;    // Default: 3
  autoAdjustConflicts: boolean;   // Default: false (allow overlap instead)
  showFloatingTasksBand: boolean; // Default: true
}
```

Store in `User.preferences` JSON field.

---

## Testing Checklist

### Floating Tasks
- [ ] Create floating task via natural language
- [ ] Drag floating task to timeline (converts to scheduled)
- [ ] Drag scheduled task to floating band (converts to floating)
- [ ] Floating tasks show on correct date
- [ ] Can't create floating task without date
- [ ] Quick "Schedule now" works

### Overlapping Tasks
- [ ] 2 tasks at same time render side-by-side
- [ ] 3 tasks render in 3 columns
- [ ] 4+ tasks show overflow indicator
- [ ] Clicking overflow shows all tasks
- [ ] Overlaps render correctly across hour boundaries
- [ ] Tasks with different durations overlap correctly

### Drag & Drop
- [ ] Smooth snapping to 15-min intervals
- [ ] Drop zones highlight on hover
- [ ] Can drag from inbox → timeline
- [ ] Can drag from time blocks → timeline
- [ ] Can drag from floating → timeline
- [ ] Can drag between timeline slots
- [ ] Auto-adjust works when conflicts detected
- [ ] Preview shows correct position while dragging

---

## Success Metrics

- Users schedule floating tasks for "anytime today" work
- Average overlapping tasks per day: 2-3 (shows feature is useful)
- Drag/drop success rate > 95% (less friction)
- Time to schedule a task: < 3 seconds

---

## Future Enhancements

- [ ] **Smart floating task suggestions**: "You have 30 min free at 2pm - want to do emails now?"
- [ ] **Floating task priority**: Order floating tasks by importance
- [ ] **Color-coded overlaps**: Different colors for different projects
- [ ] **Recurring floating tasks**: "Check emails" every day
- [ ] **Time budget for floating tasks**: Estimate total time for all floating tasks
