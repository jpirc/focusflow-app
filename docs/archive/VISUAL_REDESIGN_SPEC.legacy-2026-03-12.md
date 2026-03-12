# Dopatika Visual Redesign Specification

**Status**: Design & Planning Phase  
**Priority**: High - Core UX improvement for ADHD users  
**Updated**: January 13, 2026

---

## 🎯 Design Philosophy

Dopatika's current design uses abstract time blocks (morning/afternoon/evening). While flexible, this creates **temporal disorientation** for ADHD users who struggle with:

1. **Time blindness**: Can't visualize when things happen
2. **Capacity estimation**: Schedule 14 hours of work in 8-hour days
3. **Current context**: "Where am I in the day?"
4. **Progress tracking**: Hard to see what's done vs remaining

**Solution**: Transform into a **concrete, visual timeline** that makes time visible, tangible, and actionable.

---

## 📐 Phase 1: Timeline View (HIGHEST PRIORITY)

### Current State
```
┌─────────────┬─────────────┬─────────────┐
│ Morning     │ Afternoon   │ Evening     │
├─────────────┼─────────────┼─────────────┤
│ • Task A    │ • Task D    │ • Task F    │
│ • Task B    │ • Task E    │             │
│ • Task C    │             │             │
└─────────────┴─────────────┴─────────────┘
```

**Problems:**
- No sense of actual time (morning = 6am? 8am? noon?)
- Can't see if tasks fit in available hours
- No way to know "where am I now?"
- Abstract blocks don't create temporal awareness

### Proposed Timeline View
```
┌──────────────────────────────────────────┐
│ TODAY - Monday, Jan 13                   │
│ ████████████░░░░░░ 8h scheduled / 14h    │
└──────────────────────────────────────────┘

6am  ┌─────────────────────────────────────┐
     │ ░░░░░░░░ Morning Block ░░░░░░░░     │
     ├─────────────────────────────────────┤
7am  │ 🌅 Morning Routine (30m) ✓          │
8am  │ ☕ Coffee & email (15m)              │
     ├─────────────────────────────────────┤
9am  │ 💻 Write report (2h) 🔴             │
     │ ↓ 9:23 AM ← YOU ARE HERE            │
11am │                                      │
     ├─────────────────────────────────────┤
12pm │ ░░░░░░ Afternoon Block ░░░░░░       │
     ├─────────────────────────────────────┤
1pm  │ 🥗 Lunch break (1h)                 │
2pm  │ 👥 Team meeting (1h) 🟡             │
3pm  │ 📝 Code review (45m) 🟢             │
     ├─────────────────────────────────────┤
6pm  │ ░░░░░░░ Evening Block ░░░░░░        │
     ├─────────────────────────────────────┤
7pm  │ 🏋️ Workout (30m) 🟢                │
8pm  │                                      │
9pm  │                                      │
     └─────────────────────────────────────┘
     
     Anytime (3 tasks) →
```

### Key Features

#### 1. Hour Grid
- **Left gutter**: Hour markers (6am, 7am, 8am, etc.)
- **Grid lines**: Subtle horizontal lines every hour
- **Scrollable**: Scroll to see earlier/later hours
- **Configurable range**: User sets work hours (default 6am-10pm)

#### 2. Time Block Regions
- **Shaded backgrounds**: Visual zones for morning/afternoon/evening
- **Color coding**: Morning=yellow tint, afternoon=blue, evening=purple
- **Flexible boundaries**: Morning 6am-12pm, afternoon 12pm-6pm, evening 6pm-10pm
- **Visual separation**: Clear borders between blocks

#### 3. Task Positioning
- **Vertical placement**: Tasks appear at their scheduled hour
- **Height = Duration**: 30-minute task = smaller card, 2-hour task = taller
- **Overflow handling**: If multiple tasks at same time, stack horizontally or show warning
- **Drag to reschedule**: Drag task up/down to change time

#### 4. Current Time Indicator
- **Live marker**: Red line showing current time (e.g., "9:23 AM")
- **"You are here" label**: Makes it obvious where you are in the day
- **Auto-scroll**: On page load, scroll to show current time
- **Updates every minute**: Marker moves in real-time

#### 5. Capacity Visualization
- **Top bar**: Shows total scheduled time vs realistic available time
- **Per-block indicators**: "Morning: 4h used / 6h available"
- **Color coding**: Green (plenty of time), yellow (getting full), red (overloaded)
- **Smart warnings**: "You've scheduled 10 hours—that's a lot! Consider moving some tasks."

### Technical Implementation

#### Component Structure
```typescript
// New component: TimelineView.tsx
<TimelineView
  date={selectedDate}
  tasks={tasksForDate}
  hourRange={{ start: 6, end: 22 }}
  currentTime={new Date()}
  onTaskMove={(taskId, newHour) => {...}}
  onTaskClick={(task) => {...}}
/>

// Sub-components
<HourGrid start={6} end={22} />
<TimeBlockRegion type="morning" start={6} end={12} />
<TaskTimelineCard task={task} hour={9} duration={120} />
<CurrentTimeMarker time={currentTime} />
<CapacityBar scheduled={8} available={14} />
```

#### Data Requirements
- Add optional `scheduledHour` field to Task model (number 0-23)
- If not set, use time block defaults:
  - Morning → 9am
  - Afternoon → 2pm
  - Evening → 7pm
  - Anytime → bottom of timeline
- Calculate duration from `estimatedMinutes`

#### Migration Strategy
- **Phase 1a**: Build timeline view alongside existing columns
- **Phase 1b**: Add view toggle button ("Blocks" vs "Timeline")
- **Phase 1c**: Make timeline default, keep blocks as option
- **Phase 1d**: Eventually deprecate blocks once timeline is proven

---

## 📦 Phase 2: Compact Card Design (HIGH PRIORITY)

### Current Card Issues
```
┌─────────────────────────────────────┐
│                                     │  ← Too much whitespace
│  Write report                       │
│  Project: Work | Priority: High     │
│  30 minutes                         │
│                                     │  ← More whitespace
└─────────────────────────────────────┘
```

**Problems:**
- Excessive padding (6-8px) wastes vertical space
- Metadata on separate lines = harder to scan
- Priority shown as text, not visual
- Can only see 3-4 tasks without scrolling

### Proposed Compact Design
```
┌─────────────────────────────────────┐
│ ★ Write report            [30m] 🟢 │ ← All info on one/two lines
│   Project: Work | Morning           │ ← Metadata inline, muted
│   🔗 Blocks: Client email           │ ← Dependencies inline if present
└─────────────────────────────────────┘
```

**Improvements:**
- Reduced padding (2-3px vertical, 3px horizontal)
- Time estimate and energy inline with title
- Priority shown as colored left border (not badge)
- Project color as subtle card background tint
- Dependency info only shows when relevant
- Can see 6-8 tasks in same space

### Visual Hierarchy
```
Level 1 (Most Important): 
  - Task title (bold, 14px)
  - Time estimate (inline, colored based on duration)
  - Energy level (emoji, right-aligned)

Level 2 (Context):
  - Project name (small, project color)
  - Time block (small, gray)
  - Status indicators (icons only)

Level 3 (Metadata):
  - Dependencies (inline, only if present)
  - Subtask count (small pill)
  - Last updated (hover only)
```

### Color-Coded Left Border
```typescript
// Priority visualization
Low:     border-l-4 border-gray-300
Medium:  border-l-4 border-blue-400
High:    border-l-4 border-orange-500
Urgent:  border-l-4 border-red-600 + glow animation

// Status visualization  
Pending:    Normal border
In Progress: Pulsing green border
Blocked:    Gray + lock icon
Overdue:    Red glow effect
```

### Project Color Tinting
```typescript
// Subtle background tint using project color
// Example: Project "Work" = blue #3b82f6

background: `rgba(59, 130, 246, 0.05)` // 5% opacity
border: `1px solid rgba(59, 130, 246, 0.2)` // 20% opacity

// Benefits:
// - Visual grouping: same-project tasks visually similar
// - Still readable: low opacity doesn't interfere with text
// - Colorful: makes app feel vibrant without being loud
```

---

## 📊 Phase 3: Visual Time Budget (MEDIUM PRIORITY)

### Problem: Time Overload
ADHD brains struggle with realistic capacity estimation. Common pattern:
- User schedules: 3 × 2-hour tasks + 5 × 1-hour tasks = 11 hours
- Actual available time: 6-8 hours (accounting for breaks, context switching)
- Result: **Overwhelm, guilt, incomplete work**

### Solution: Visual Capacity Tracking

#### Daily Capacity Bar (Top of Each Day)
```
┌─────────────────────────────────────────┐
│ Today's Capacity                        │
│ ████████████░░░░░░░░░░░ 8h / 14h (57%)  │
│ ⚠️ Consider: You have 6h of free time   │
└─────────────────────────────────────────┘

Colors:
- Green (0-70%): Healthy schedule
- Yellow (70-90%): Getting full, be careful
- Red (90-100%): Overloaded! Move tasks
- Dark red (>100%): Impossible schedule
```

#### Per-Block Capacity
```
Morning Block (6am-12pm)
████████░░░░ 4h / 6h (67%) ✓ Good

Afternoon Block (12pm-6pm)  
██████████░░ 5h / 6h (83%) ⚠️ Near capacity

Evening Block (6pm-10pm)
░░░░░░░░░░░ 0h / 4h (0%) 💡 Room to add
```

#### Smart Warnings
```typescript
// Trigger warnings based on thresholds
if (scheduledHours > availableHours * 0.9) {
  showWarning({
    type: 'overload',
    message: `You've scheduled ${scheduledHours}h but only have ${availableHours}h available. Consider moving some tasks to tomorrow or next week.`,
    suggestions: [
      { label: 'Move 2h task to tomorrow', action: () => {...} },
      { label: 'Reduce estimates', action: () => {...} },
      { label: 'I'll be fine', action: () => dismiss() }
    ]
  });
}
```

#### Configurable Realistic Capacity
```typescript
// User settings (defaults)
const capacitySettings = {
  dailyWorkHours: 8, // Realistic work hours per day
  breakBuffer: 1.5,  // Lunch + coffee breaks
  contextSwitchingTax: 0.8, // 20% overhead for task switching
  
  // Calculated available time
  effectiveHours: dailyWorkHours - breakBuffer * contextSwitchingTax
  // Example: 8 - 1.5 = 6.5 * 0.8 = 5.2 effective hours
};
```

---

## 🎨 Phase 4: Energy & Time Matching (MEDIUM PRIORITY)

### Problem: Energy Misalignment
ADHD users have **non-negotiable energy patterns**. Scheduling high-energy tasks during low-energy times = guaranteed failure.

### Solution: Visual Energy Matching

#### Energy-Coded Cards
```
High Energy Tasks:
  Background: rgba(239, 68, 68, 0.08)   // Subtle red tint
  Border:     rgba(239, 68, 68, 0.3)     // Red border
  Icon:       🔥 Flame icon

Medium Energy Tasks:
  Background: rgba(34, 197, 94, 0.08)   // Subtle green tint
  Border:     rgba(34, 197, 94, 0.3)     // Green border  
  Icon:       ⚡ Lightning icon

Low Energy Tasks:
  Background: rgba(59, 130, 246, 0.08)  // Subtle blue tint
  Border:     rgba(59, 130, 246, 0.3)    // Blue border
  Icon:       🌙 Moon icon
```

#### Time Block Energy Profiles
```
Morning (6am-12pm):
  Default energy: High 🔥
  Best for: Deep work, creative tasks, hard problems
  Background: Warm yellow tint

Afternoon (12pm-6pm):
  Default energy: Medium ⚡
  Best for: Meetings, collaboration, medium tasks
  Background: Neutral blue-gray

Evening (6pm-10pm):
  Default energy: Low 🌙
  Best for: Admin, easy tasks, planning
  Background: Cool purple tint
```

#### Matching Glow Effect
```typescript
// When task energy matches block energy
if (task.energyLevel === timeBlock.defaultEnergy) {
  // Add subtle glow to indicate good match
  boxShadow: `0 0 8px ${energyColor}40`,  // 40 = 25% opacity
  border: `2px solid ${energyColor}80`,   // 80 = 50% opacity
  
  // Optional: Tooltip on hover
  title: "✅ Energy match! This task fits well in this time block"
}

// When mismatched (high energy task in evening)
if (task.energyLevel === 'high' && timeBlock === 'evening') {
  // Warning indicator
  icon: '⚠️',
  title: "Consider moving this high-energy task to morning when you're most alert"
}
```

#### Smart Energy Suggestions
```
Scenario: User drags high-energy task to evening block

Show tooltip:
┌─────────────────────────────────────┐
│ ⚠️ Energy Mismatch                  │
│                                     │
│ This task needs high focus, but    │
│ evenings are usually low energy.   │
│                                     │
│ Suggestion: Move to morning instead│
│                                     │
│ [Move to 9am] [Keep Here] [Dismiss]│
└─────────────────────────────────────┘
```

---

## 📈 Phase 5: Progress Visualization (LOW PRIORITY)

### Current: Text-Only Progress
```
Write Report
Subtasks: 3 incomplete, 2 complete
```

### Proposed: Visual Progress

#### Subtask Progress Bars
```
┌─────────────────────────────────────┐
│ Write Report                        │
│ ████████░░░░░░░ 2/5 subtasks (40%)  │
│                                     │
│ ✓ Outline                           │
│ ✓ Draft intro                       │
│ ○ Write body                        │
│ ○ Add examples                      │
│ ○ Edit & review                     │
└─────────────────────────────────────┘
```

#### Mini Progress Indicators
```
On collapsed task card:
┌─────────────────────────────────────┐
│ Write Report        ████░░ 40% [2h] │
└─────────────────────────────────────┘

Tooltip on hover:
2 of 5 subtasks done
Estimated: 2h total
Spent: 0.8h so far
```

#### Time vs Estimate Comparison
```
After task completion:
┌─────────────────────────────────────┐
│ ✓ Write Report (completed)          │
│                                     │
│ Estimated: ░░░░░░░░░░░ 2h           │
│ Actual:    ████████████ 2.5h        │
│                                     │
│ 25% over estimate (pretty close!)  │
└─────────────────────────────────────┘
```

---

## 🔄 Phase 6: Contextual Slide Panels (LOW PRIORITY)

### Problem: Modal Overload
Current edit flow loses context:
1. Click edit on task
2. Modal covers entire screen
3. Can't see other tasks for reference
4. Must close modal to see calendar
5. Disorienting, breaks flow

### Solution: Side Panels

#### Layout
```
┌────────────────────┬─────────────────────┐
│ Main Timeline      │ Edit Panel (400px) │
│                    │ ╔═════════════════╗ │
│ Morning:           │ ║ Edit Task       ║ │
│ • Task A           │ ║                 ║ │
│ • Task B ← viewing │ ║ Title: [____]   ║ │
│ • Task C           │ ║                 ║ │
│                    │ ║ Time: [30] min  ║ │
│ Afternoon:         │ ║                 ║ │
│ • Task D           │ ║ Energy: 🟢      ║ │
│ • Task E           │ ║                 ║ │
│                    │ ║ [Save] [Cancel] ║ │
│                    │ ╚═════════════════╝ │
└────────────────────┴─────────────────────┘
```

#### Benefits
- **Context preserved**: See other tasks while editing
- **Faster workflow**: No modal open/close cycle
- **Multi-edit**: Arrow keys to move between tasks
- **Reference**: Can check other task times, dependencies
- **Less disorienting**: Main view stays visible

#### Keyboard Navigation
```typescript
// In edit panel
Arrow Up:   Move to previous task
Arrow Down: Move to next task
Escape:     Close panel
Cmd+S:      Save and close
Cmd+Enter:  Save and move to next task
```

---

## 🌈 Phase 7: Smart Color System (FUTURE)

### Semantic Status Colors

#### Overdue Tasks
```typescript
// Red glow + pulsing animation
border: '2px solid #ef4444',
boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
animation: 'pulse 2s ease-in-out infinite',

// Label
<span className="text-xs text-red-600">
  ⏰ {daysOverdue} days overdue
</span>
```

#### Due Today
```typescript
// Yellow border + subtle highlight
border: '2px solid #f59e0b',
background: 'rgba(245, 158, 11, 0.05)',

<span className="text-xs text-yellow-600">
  📅 Due today
</span>
```

#### In Progress
```typescript
// Green pulsing border
border: '2px solid #10b981',
animation: 'pulse 1.5s ease-in-out infinite',

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

#### Blocked by Dependencies
```typescript
// Gray + lock icon
border: '2px solid #9ca3af',
background: 'rgba(156, 163, 175, 0.1)',
opacity: 0.7,

<div className="flex items-center gap-1 text-gray-500">
  🔒 Waiting on 2 tasks
</div>
```

#### Top 3 Daily Priorities
```typescript
// Gold star + subtle gold background
background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))',
border: '2px solid rgba(251, 191, 36, 0.4)',

<div className="absolute -top-2 -right-2">
  ⭐ {/* Gold star icon */}
</div>
```

---

## 🚀 Implementation Priority

### Phase 1: MVP (2-3 days)
1. Basic timeline view with hour grid
2. Compact card design
3. Capacity bar (top level only)
4. Current time marker

### Phase 2: Enhancement (2-3 days)
5. Energy color coding
6. Per-block capacity
7. Drag-and-drop in timeline
8. Smart warnings

### Phase 3: Polish (2-3 days)
9. Progress visualizations
10. Slide panel editing
11. Advanced color system
12. User preferences/toggles

---

## 📊 Success Metrics

After redesign, measure:
1. **Task completion rate**: Did it increase?
2. **Overload incidents**: Fewer days with >100% capacity scheduled?
3. **Energy match rate**: More tasks in appropriate time blocks?
4. **User feedback**: Qualitative improvement in "I know where I am"?
5. **Time estimation accuracy**: Better estimates with visual timeline?

---

## 🎨 Design Mockups

See Figma: [Dopatika Timeline View](link-to-mockups)

- Daily timeline view (hour grid)
- Capacity visualization
- Energy-coded cards
- Slide panel editing
- Mobile responsive layout
