# Dopatika Visual Guide
## Understanding Visual Cues & ADHD-Friendly Features

**Last Updated:** January 28, 2026

This guide explains all the visual cues, color coding, and indicators used in Dopatika to help ADHD users quickly understand their tasks at a glance.

---

## 🎨 Visual Time Urgency System

Dopatika uses **color-coded borders** and **animations** to help you instantly identify which tasks need attention NOW. This fights time blindness by making urgency visual, not just textual.

### Color Meanings

#### 🔴 **RED (Critical - Pulsing)**
- **When you see it:** Overdue tasks OR tasks due in less than 1 hour
- **Visual effect:** Red left border + subtle pulsing animation
- **What it means:** DROP EVERYTHING - This needs attention RIGHT NOW
- **Example scenarios:**
  - Task scheduled for 2:00 PM, it's now 2:30 PM (overdue)
  - Task due at 11:00 AM, it's now 10:15 AM (45 minutes away)

#### 🟠 **ORANGE (Urgent)**
- **When you see it:** Tasks due in 1-2 hours
- **Visual effect:** Orange left border + subtle glow (no pulse)
- **What it means:** Start wrapping up what you're doing - this is coming soon
- **Example:** Task due at 3:00 PM, it's now 1:30 PM

#### 🟡 **AMBER (Due Today)**
- **When you see it:** Tasks scheduled for today but more than 2 hours away
- **Visual effect:** Amber/yellow left border
- **What it means:** On today's list, but not immediately urgent
- **Example:** Task due at 5:00 PM, it's now 10:00 AM

#### 🟢 **YELLOW (Tomorrow)**
- **When you see it:** Tasks due tomorrow
- **Visual effect:** Yellow left border
- **What it means:** Not urgent, but coming up soon
- **Example:** Task due tomorrow at any time

#### 🟢 **GREEN (This Week)**
- **When you see it:** Tasks due in 2-7 days
- **Visual effect:** Green left border
- **What it means:** Plenty of time, but keep it on your radar
- **Example:** Task due in 3 days

#### ⚪ **GRAY (Flexible)**
- **When you see it:** Tasks with no specific deadline
- **Visual effect:** Gray left border
- **What it means:** Do whenever you have time
- **Example:** "Clean out garage" with no due date

---

## 📊 Time Budget Indicator

The progress bar at the top of each day shows your scheduled time vs. available time.

### Visual Elements

**Two-Tone Progress Bar:**
- **Dark Green section:** Time you've already completed (shows your progress!)
- **Lighter colored section:** Time still scheduled (changes color based on capacity)

### Color States

- 🟢 **Green:** < 80% of available time scheduled (comfortable)
- 🟡 **Yellow:** 80-100% of time scheduled (almost full)
- 🔴 **Red:** Over 100% scheduled (OVERBOOKED - you've scheduled more than possible!)

### Time Range Display
- Shows working hours (default: 8am-6pm, configurable)
- Completed tasks stay in the bar (you don't lose progress!)
- Hover to see breakdown: "✓ 2.5h + ⏳ 3.0h / 10.0h"

**Why this matters for ADHD:**
- Prevents over-scheduling (visual capacity check)
- Shows progress made (dopamine!)
- Helps you see "how much time is left" concretely

---

## 🎯 Task Status Indicators

### Status Colors & Icons

**⚪ Pending (Not Started)**
- Empty circle checkbox
- Normal opacity
- Ready to start

**▶️ In Progress (Active)**
- Blue pulsing ring animation
- Large shadow effect
- Shows elapsed time
- **Only ONE task can be in-progress at a time**

**⏸️ Paused**
- Amber/yellow ring
- Shows total time tracked
- Can resume later

**✅ Completed**
- Green checkmark
- 50% opacity (faded)
- Shows in "completed" section of time budget

**🔒 Blocked (Dependencies)**
- Lock icon overlay
- Red tint background
- Cannot start until blocking task is done
- Shows which task is blocking it

---

## 🏆 Top 3 Priorities

### Visual Treatment
- ⭐ **Star icon** next to task title
- Purple-tinted section at top of each day
- Chips/badges in compact mode
- Daily completion tracked

**Morning Prompt:**
- Appears 5am-11am if you haven't set Top 3
- "What are your 3 must-dos today?"
- Forces prioritization to prevent overwhelm

**End of Day:**
- Shows "You completed 2/3 priorities!"
- Tracks completion rate over time

---

## ⏱️ Pomodoro Timer Integration

### Visual States

**Timer Active:**
- Floating timer widget shows countdown
- Optional overlay modes:
  - **Off:** No overlay
  - **Subtle:** Light dim
  - **Full:** Strong focus mode

**Break Time:**
- Different sound/visual
- Encourages actual breaks

**Timer on Task Card:**
- Shows which task timer is linked to
- One-click start from any task

---

## 📅 Timeline View Features

### Auto-Scroll Behavior
- On page load: scrolls to current time
- Current time positioned near top (120px padding)
- Red line with circle shows "NOW"

### Time Block Shading
- Morning (6am-12pm): Light blue tint
- Afternoon (12pm-5pm): Light amber tint
- Evening (5pm-10pm): Light purple tint

### Task Cards on Timeline

**Adaptive Layouts:**
- **Short tasks (≤45 min):** Single horizontal line (title first, then time)
- **Medium tasks (45-90 min):** Two lines (title on line 1, metadata on line 2)
- **Long tasks (>90 min):** Full vertical layout with all details

**Overlapping Tasks:**
- Multi-lane rendering (side-by-side)
- Up to 3 tasks can overlap
- Each gets proportional width

### Floating Tasks Band
- Top section shows "Today (Anytime)" tasks
- Tasks scheduled for today but no specific time
- Drag to timeline to schedule at specific hour

---

## 🔄 Rollover & Task Age

### Rollover Badge
- Shows how many times a task has been pushed forward
- Orange/red as count increases
- Indicates tasks you keep avoiding (may need breakdown!)

### Task Age Badge
- "Started 3 days ago" indicator
- Helps identify stale tasks
- Prevents tasks from languishing

---

## 🔁 Restart My Day

**When to use:** Day went sideways? Meeting threw you off? Behind schedule?

### What It Does

1. **Preserves Top 3 Priorities** - Your focus tasks stay where they are
2. **Smart Rescheduling** - Automatically moves all other incomplete tasks to available time slots
3. **Starts from Now** - Fills from current time → evening (no point rescheduling the past!)
4. **Respects Duration** - Uses your task time estimates to pack efficiently
5. **Optional Note** - Track what derailed you ("What threw me off?")

### Visual Indicator

- **Amber "Restart" button** in the header
- Click to open modal showing:
  - Tasks to be rescheduled
  - What will stay vs. move
  - Optional reflection note field

### How Rescheduling Works

**Algorithm:**
- Finds next 15-minute boundary from current time
- Avoids Top 3 priority time slots (they're protected)
- Packs tasks chronologically: morning → afternoon → evening
- Respects task durations (no overlaps)
- Skips tasks that won't fit in remaining time

**Example:**
- Current time: 2:30 PM
- Top 3 tasks at 3pm, 4pm, 6pm (protected)
- Other incomplete tasks get scheduled: 2:45pm, 5pm, 7pm, 8pm
- Everything fits around your priorities!

### Use Cases

- **Unexpected meeting derailed your morning** → Restart at noon
- **Energy crash / got distracted** → Reset and refocus
- **Urgent task came up** → Make it a Top 3, then Restart to rebalance
- **Too many tasks in one block** → Restart spreads them out

**Why this matters for ADHD:**
- Reduces decision paralysis ("What should I do now?")
- One-click recovery from common derailments
- Preserves your priorities while adapting to reality
- Note tracking helps identify patterns

---

## 📌 Drag & Drop Visual Feedback

### States

**Dragging:**
- Task becomes semi-transparent
- Slight rotation effect on drag
- Cursor changes to "grabbing"

**Drop Target (Valid):**
- Column highlights with blue tint
- Blue border appears
- "Drop here" indicator

**Drop on Task (Reorder):**
- Purple line appears above task
- Inserts before that task

---

## 🎬 Micro-Animations

### Task Creation
- Slides in from top
- Subtle bounce effect
- Appears in correct time slot

### Task Completion
- Checkmark pops with scale animation
- Row fades to 50% opacity
- Moves to "completed" section
- **Celebration message** appears (streak counter!)

### Progress Bars
- Smooth fill animation (0.5s cubic-bezier)
- Width transitions smoothly as tasks complete

---

## 🎨 Project Color System

### Visual Treatment
- Left border uses project color
- Very light tint of project color as background
- Project badge with icon + name
- Inline editing: click project badge to change

### Default Colors
- No project assigned: Gray border

---

## ⚡ Quick Actions & Shortcuts

### Keyboard Shortcuts
- **Cmd/Ctrl + K:** Quick Capture (create task anywhere)
- **Cmd/Ctrl + W:** Quick Win suggestions (short tasks)
- **Space:** Start timer on selected task
- **Esc:** Cancel editing/close modals

### One-Click Actions
- **Start Now:** Schedules task + sets to in-progress (no timer)
- **Start Pomodoro:** Schedules + in-progress + starts timer
- **AI Breakdown:** Breaks complex task into subtasks
- **Restart My Day:** Mid-day reset that reschedules incomplete tasks

---

## 🔔 Smart Notifications

### Rollover Notification
- Appears at start of day if tasks were moved forward
- Shows list of rolled-over tasks
- Quick action to move to today

### Unblocked Tasks
- Shows when blocking dependency is completed
- "Task X is now unblocked!"
- Quick move to today

### Overload Warning (TimeBudget)
- Appears when scheduled > available time
- "You've scheduled 9h in an 8h day"
- Suggests moving tasks to tomorrow

---

## 🧠 ADHD-Specific Features

### Why These Visual Cues Matter

**Time Blindness:**
- Urgency colors make time visible
- Timeline shows concrete hours, not abstract blocks
- "NOW" line shows where you are in the day

**Executive Dysfunction:**
- Top 3 forces prioritization
- Quick actions reduce decision paralysis
- "Start Now" = one click to begin

**Overwhelm Prevention:**
- Time budget shows capacity visually
- Overload warnings before it's too late
- Quick wins surface easy victories

**Dopamine & Motivation:**
- Completion animations
- Streak tracking
- Progress bars that fill (not empty)
- Completed time stays visible

**Working Memory:**
- Visual urgency (don't have to remember what's urgent)
- Blocked task indicators
- Task age badges

---

## 🎓 Pro Tips

### Reading the Timeline at a Glance

1. **Look at border colors first** - Instantly see what's urgent
2. **Check the red "NOW" line** - Orient yourself in time
3. **Scan the floating tasks** - What needs scheduling?
4. **Time budget at top** - Am I overbooked?

### Using Urgency Colors Effectively

- **See red pulsing?** Drop what you're doing
- **Lots of orange?** Batch similar tasks to save context-switching
- **All green?** Good time to tackle a deep-work task
- **Too much yellow?** Consider spreading tasks across more days

### Managing Cognitive Load

- **Collapse "Anytime" section** - Hide non-urgent tasks
- **Use compact mode** - More info, less scrolling
- **Top 3 only** - Ignore everything else until these are done

---

## 📝 Future Enhancements (Coming Soon)

- **Focus Mode:** Full-screen single task view
- **Transition Warnings:** 5-minute alerts before task switches
- **Energy Matching:** Task energy vs. time-of-day energy
- **Hyperfocus Detection:** Gentle nudge after 90+ minutes
- **Restart Analytics:** Track patterns in what throws you off track

---

## 📚 Additional Resources

- **ROADMAP.md** - Full feature roadmap and priorities
- **TIMELINE_UX_SPEC.md** - Technical spec for timeline features
- **CLAUDE.md** - Development notes and architecture

---

**Questions or Suggestions?**
This is YOUR productivity tool. If a visual cue isn't working for you, or you have ideas for improvements, please share feedback!

Remember: The goal is to make time and urgency **visible** instead of **invisible**. Every color, animation, and indicator is designed to reduce cognitive load and support ADHD brains.
