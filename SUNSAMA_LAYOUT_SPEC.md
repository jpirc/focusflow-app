# Sunsama-Style Layout Specification

## Overview
Transform FocusFlow's main interface from a pure time-block layout to a dual-panel design inspired by Sunsama: **67% time blocks (left)** + **33% timeline (right)**. This creates a hybrid view combining the contextual richness of time blocks with the precise scheduling of a timeline.

## Goals
- **Hybrid Context**: Time blocks show full task details; timeline shows scheduled time positions
- **Visual Clarity**: See both the "what" (detailed cards) and "when" (timeline position) simultaneously
- **Bilateral Drag & Drop**: Drag tasks between time blocks ↔ timeline seamlessly
- **Reduced Cognitive Load**: One unified view instead of switching between tabs/modes
- **Maintain Existing Features**: All current functionality (Top 3, subtasks, dependencies, celebrations, etc.) preserved

---

## Layout Structure

### Desktop Layout (>768px)
```
┌─────────────────────────────────────────────────────────────┐
│                        Header                                │
├──────┬──────────────────────────────────────────────────────┤
│      │  Time Blocks (67%)         │  Timeline (33%)         │
│ Side │  ┌──────────────────────┐  │  ┌──────────────────┐  │
│ bar  │  │ Top 3 Section        │  │  │ 6am              │  │
│      │  ├──────────────────────┤  │  │ 7am              │  │
│ (Nav │  │ Morning              │  │  │ 8am ■ Task 1     │  │
│  &   │  │  ▢ Task 1 (detailed) │  │  │ 9am              │  │
│ Pro- │  │  ▢ Task 2 (detailed) │  │  │ 10am ■ Task 3    │  │
│ jects│  ├──────────────────────┤  │  │ 11am             │  │
│  )   │  │ Afternoon            │  │  │ 12pm             │  │
│      │  │  ▢ Task 3 (detailed) │  │  │ 1pm              │  │
│      │  ├──────────────────────┤  │  │ 2pm              │  │
│      │  │ Evening              │  │  │ 3pm              │  │
│      │  │  ▢ Task 4 (detailed) │  │  │ 4pm ■ Task 4     │  │
│      │  └──────────────────────┘  │  │ 5pm              │  │
│      │                             │  │ 6pm              │  │
└──────┴─────────────────────────────┴──────────────────────┘
```

### Responsive (<768px) - Options to Decide
**Option A**: Stack vertically (time blocks on top, timeline below)
**Option B**: Hide timeline on mobile, add toggle button to switch views
**Option C**: Show timeline only, add "Show Details" button to expand cards

---

## Timeline Panel (Right 33%)

### Visual Structure
- **Range**: 6am - 6pm (12 hours)
- **Hour Grid**: Each hour labeled (6am, 7am, ..., 6pm)
- **Height**: 60px per hour = 720px total
- **Positioning**: 1px = 1 minute (same as existing TimelineView)

### Task Cards in Timeline
- **Compact Layout**: Minimal height when no `startTime` (fallback to hour slot)
- **Precise Positioning**: If `startTime` is set (e.g., 8:30am), position at 8am + 30px
- **Content**:
  - Title (truncated if needed)
  - Time badge (e.g., "8:30 AM" or "15 min")
  - Project color indicator (left border or dot)
- **Visual States**:
  - Completed: Dashed border + muted colors (same as existing)
  - In-progress: Pulsing border
  - Selected/Hovered: Highlighted background

### Current Time Indicator
- Red line spanning full width of timeline
- Updates every minute
- Position calculated as: `(currentHour - 6) * 60 + currentMinute` px from top

### Drag & Drop Zones
- Each hour slot is a drop zone
- Visual feedback: Highlight hour slot on drag-over
- Snap to 15-minute intervals (0, 15, 30, 45)

---

## Time Block Panel (Left 67%)

### Structure
- **Keep all existing sections**: Top 3, Morning, Afternoon, Evening, Anytime, Finished
- **Keep all existing features**: Detailed cards, subtasks, dependencies, badges, context menus
- **No changes to card layout**: Full TaskCard component with all details

### Drag & Drop
- Existing drag-to-reorder within time blocks
- **New**: Drag FROM time blocks TO timeline (sets `startTime`)
- Visual feedback: Ghost/preview during drag

---

## Cross-Panel Interactions

### Highlighting & Selection
- **Hover in Time Block**: Highlight corresponding card in timeline (if scheduled)
- **Hover in Timeline**: Highlight corresponding card in time block
- **Click in Timeline**: Select task (could open quick-edit or scroll to time block card)

### Bilateral Drag & Drop
1. **Time Block → Timeline**: 
   - Drag detailed card from time block
   - Drop on timeline hour slot
   - Sets `startTime` field (e.g., drop at 8:15am slot)
   - Task remains in original time block (timeBlock unchanged)
   - Now appears in both panels

2. **Timeline → Time Block**:
   - Drag timeline card
   - Drop on different time block column
   - Updates `timeBlock` field
   - Keeps `startTime` if already set
   - Updates position in timeline if time block has default hour

3. **Within Timeline**:
   - Drag to different hour
   - Updates `startTime` only
   - Snaps to 15-min intervals

---

## Task Creation Workflow

### Default Behavior
- **New tasks**: Created in time blocks (inbox/unscheduled) as usual
- **No startTime by default**: Tasks only appear in time blocks initially

### Scheduling from Inbox
- Drag unscheduled task from "Anytime" to timeline
- Sets both `timeBlock` (based on hour) and `startTime`
- Task moves to appropriate time block AND appears in timeline

### Smart Capture Modal
- Optional: Add "Schedule Time" picker (hour + minute)
- If set, task created with `startTime` and appears in timeline immediately

---

## Database Schema Updates

### Existing Fields (already in schema)
```prisma
scheduledHour   Int?      // Hour component (0-23)
scheduledMinute Int?      // Minute component (0-59) - NEEDS MIGRATION
```

### New Fields to Add
```prisma
startTime       DateTime? // Precise scheduled datetime (replaces need for hour+minute)
estimatedDuration Int?    // Duration in minutes for visual sizing
```

**Decision**: Use `startTime` DateTime OR `scheduledHour + scheduledMinute`?
- **Option A**: Keep hour/minute separate (already partially implemented)
- **Option B**: Migrate to single `startTime` DateTime (cleaner, but more migration work)

---

## Technical Implementation

### Component Structure

#### New Components
1. **`TimelinePanel.tsx`**
   - Hour grid (6am-6pm)
   - Current time indicator
   - Task card rendering at precise positions
   - Drop zones for each hour

2. **`TimelineTaskCard.tsx`**
   - Compact task card for timeline
   - Props: task, height (based on duration), isSelected, onDragStart, onClick
   - Similar to QuickEditTaskCard but more minimal

3. **`DualPanelLayout.tsx`**
   - Wrapper component
   - 67/33 grid layout
   - Manages cross-panel highlighting state
   - Coordinates drag & drop between panels

#### Component Reuse
- **TimeBlockColumn**: No changes needed, keep as-is
- **TaskCard**: Keep using full detailed cards in time blocks
- **QuickEditTaskCard**: Could be adapted for timeline cards OR create new TimelineTaskCard

### State Management (in `useTasks` hook)

#### New State
```typescript
const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
```

#### New Functions
```typescript
// Update task startTime when dragged in timeline
updateTaskStartTime: (taskId: string, startTime: Date) => Promise<void>

// Schedule task from inbox to timeline
scheduleTask: (taskId: string, timeBlock: string, startTime: Date) => Promise<void>
```

### API Updates

#### `PATCH /api/tasks/[id]`
- Accept `startTime` field
- Accept `estimatedDuration` field
- Validate startTime is within reasonable range (6am-11pm?)

#### `POST /api/tasks`
- Accept optional `startTime` and `estimatedDuration` in creation

---

## Visual Design

### Timeline Panel Styling
- **Background**: Slightly different shade than time blocks (e.g., bg-gray-50 vs bg-white)
- **Hour Labels**: Left-aligned, gray text, 12-hour format
- **Hour Dividers**: Thin gray border between hours
- **Current Time Line**: Red (#ef4444) 2px solid line with shadow
- **Task Cards**: White background, subtle shadow, left border in project color

### Cross-Panel Highlighting
- **Hover Effect**: Soft blue/purple glow (`ring-2 ring-purple-300`)
- **Selected State**: Bolder border (`ring-2 ring-purple-500`)
- **Animation**: Smooth transition (150ms)

### Drag & Drop Feedback
- **Dragging from Time Block**: Semi-transparent ghost follows cursor
- **Dragging in Timeline**: Visual preview of time slot (dotted outline)
- **Drop Zone Highlight**: Background color change (bg-blue-50)

---

## Implementation Phases

### Phase 1: Core Layout & Static Timeline ✅ START HERE
- [ ] Add `startTime` and `estimatedDuration` to Prisma schema
- [ ] Run migration: `npx prisma migrate dev --name add_start_time`
- [ ] Create `TimelinePanel.tsx` component with hour grid (6am-6pm)
- [ ] Create `TimelineTaskCard.tsx` compact card component
- [ ] Create `DualPanelLayout.tsx` wrapper component
- [ ] Update `page.tsx` to use DualPanelLayout (67/33 split)
- [ ] Render tasks with `startTime` in timeline at correct positions
- [ ] Add current time indicator line
- [ ] Style timeline panel (backgrounds, borders, hour labels)

**Acceptance**: Side-by-side layout renders, tasks with `startTime` appear in timeline at correct hour/minute position

### Phase 2: Cross-Panel Interactions
- [ ] Implement hover state synchronization (time block ↔ timeline)
- [ ] Implement click selection in timeline (highlights in both panels)
- [ ] Add keyboard navigation (arrow keys to move between tasks)
- [ ] Scroll time block into view when timeline task clicked

**Acceptance**: Hovering/clicking task in either panel highlights it in both

### Phase 3: Drag & Drop from Time Blocks to Timeline
- [ ] Add drag handlers to TaskCard in time blocks
- [ ] Implement drop zones in timeline (hour slots)
- [ ] Handle drop event: Update task with `startTime`
- [ ] Optimistic UI updates
- [ ] Visual feedback during drag (ghost preview)

**Acceptance**: Can drag task from time block to timeline, sets `startTime`, appears in both panels

### Phase 4: Drag & Drop within Timeline & Back to Blocks
- [ ] Enable dragging timeline cards to different hours
- [ ] Implement 15-minute interval snapping
- [ ] Allow dragging timeline card back to time block column
- [ ] Update `timeBlock` when dropped on column
- [ ] Handle edge cases (invalid drops, overlaps)

**Acceptance**: Full bilateral drag & drop working smoothly

### Phase 5: Polish & Edge Cases
- [ ] Handle overlapping tasks in timeline (stack or offset)
- [ ] Responsive design (mobile view decision)
- [ ] Empty state messaging ("Drag tasks here to schedule")
- [ ] Animations (smooth positioning, transitions)
- [ ] Performance optimization (virtualization if needed for many tasks)
- [ ] Keyboard shortcuts (T for timeline focus, Esc to clear selection)
- [ ] Accessibility (ARIA labels, keyboard navigation)

**Acceptance**: Production-ready, smooth, accessible

---

## Open Questions

1. **Mobile Strategy**: Stack vertically or hide timeline?
2. **Default Duration**: If `estimatedDuration` not set, what height for timeline cards? (Default to 30 min?)
3. **All-Day Tasks**: How to handle tasks without specific time? (Show in separate "all-day" row at top?)
4. **Overlapping Tasks**: Stack horizontally or show warning?
5. **Time Range**: 6am-6pm sufficient or make configurable?
6. **Database Field**: Use separate hour/minute OR single `startTime` DateTime?
7. **Multi-Day Timeline**: Phase 1 is single-day; future multi-day timeline view?

---

## Success Criteria

### MVP (Phase 1-2)
- ✅ Dual-panel layout renders correctly (67/33)
- ✅ Tasks with `startTime` appear in timeline at correct position
- ✅ Current time indicator shows and updates
- ✅ Hover highlighting works across panels
- ✅ No regressions in existing time block functionality

### Full Feature (Phase 3-5)
- ✅ Drag task from time block to timeline sets `startTime`
- ✅ Drag within timeline updates `startTime` with 15-min snapping
- ✅ Drag from timeline to time block updates `timeBlock`
- ✅ Visual feedback during all drag operations
- ✅ Responsive design works on mobile
- ✅ Performance remains smooth with 50+ tasks
- ✅ Accessible via keyboard navigation

---

## Notes
- This spec serves as the **source of truth** for the feature implementation
- Update this doc as decisions are made on open questions
- Each phase should be committed separately to maintain clean git history
- Test thoroughly at each phase before proceeding to next
