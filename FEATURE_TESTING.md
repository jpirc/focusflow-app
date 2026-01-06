# Feature Testing Guide

## ✨ Smart Task Input Enhancement (COMPLETED)

### What We Built
Enhanced the natural language parser with better keyword detection and visual feedback.

### Improvements Made

1. **Better Fallback Parser** (`app/api/tasks/parse/route.ts`)
   - Enhanced energy level detection: "quick", "easy", "simple" → low energy
   - Complex project keywords: "complex", "difficult", "challenging" → high energy
   - Duration extraction: "30 min", "2 hours" → accurate estimatedMinutes
   - Week-based scheduling: "next week" → calculates specific date
   - Broader icon inference: work, home, fitness, health, food keywords
   - Triple exclamation urgency: "!!!" → urgent priority
   
2. **Enhanced UI** (`components/SmartCaptureModal.tsx`)
   - Monospace font for input (clearer for parsing keywords)
   - Purple info panel showing all supported patterns
   - Visual examples with inline code styling
   - Better placeholder with complete example
   - Updated hint text to mention duration detection

### How to Test

1. **Open Smart Capture**
   - Click the purple sparkle button OR press `Cmd+K`
   
2. **Test Natural Language Patterns**
   
   **Basic Date & Time:**
   ```
   Call mom tomorrow morning
   ```
   Expected: Task for tomorrow's date, "morning" time block
   
   **With Duration:**
   ```
   Finish quarterly report Friday afternoon - 2 hours
   ```
   Expected: Next Friday date, "afternoon" block, 120 min estimate
   
   **With Priority:**
   ```
   Fix server bug - urgent!!!
   ```
   Expected: "urgent" priority (red badge)
   
   **With Energy Level:**
   ```
   Quick email to boss - 15 min
   ```
   Expected: "low" energy (single battery), 15 min estimate
   
   **Complex Project:**
   ```
   Difficult algorithm implementation next week - high priority
   ```
   Expected: "high" energy (3 batteries), "high" priority, next Monday date
   
   **Multiple Tasks (one per line):**
   ```
   Call dentist tomorrow morning - quick 10 min
   Finish project proposal Friday - complex 3 hours
   Gym workout evening - 1 hour
   ```
   Expected: 3 tasks with different dates, times, durations

3. **Verify Parsing Results**
   - Check each task appears in correct day column
   - Verify time block badges (morning/afternoon/evening)
   - Confirm priority badges (colors match urgency)
   - Check energy badges (battery icons)
   - Verify estimated minutes shown in task
   - Test icon inference (briefcase for work, home for chores, etc.)

---

## ⏱️ Task Timer UI (ALREADY IMPLEMENTED!)

### What Exists
The timer system was already fully implemented! We discovered:
- Automatic timer tracking when task status changes
- Visual elapsed time display with color-coded warnings
- Time overrun detection with pulse animations

### How It Works

1. **Timer Start** (`app/api/tasks/[id]/route.ts`)
   - When task status → `in-progress`: Sets `startedAt` timestamp
   
2. **Timer Display** (`components/TaskCard.tsx`)
   - Live elapsed time updates every minute
   - Shows as `{elapsed}m` next to task title
   - Visual states:
     * Blue (normal): 0-100% of estimate
     * Yellow (warning): 100-150% of estimate
     * Orange (overrun): 150-200% of estimate, pulsing
     * Red (critical): 200%+ of estimate, pulsing
   
3. **Timer Stop** (`app/api/tasks/[id]/route.ts`)
   - When task status → `completed`: Calculates `actualMinutes`
   - Accumulates time from current session + any previous sessions
   
4. **Status Reset**
   - When task → `pending`: Clears `startedAt` (resets timer)

### How to Test

1. **Create a Task with Estimate**
   ```
   Test timer task tomorrow morning - 30 min
   ```
   
2. **Start the Timer**
   - Click the circular checkbox → selects task
   - In edit panel, change status from "Pending" → "In Progress"
   - Notice: Blue circle with pulsing dot appears on checkbox
   - Timer starts counting (updates every minute)

3. **Watch Timer Display**
   - Small clock icon with elapsed time appears inline
   - Hover to see tooltip: "Estimated: 30m • Elapsed: {X}m"
   - Color changes as you approach/exceed estimate:
     * First 30 min: Blue background
     * 30-45 min: Yellow background (warning)
     * 45-60 min: Orange background + pulse animation
     * 60+ min: Red background + pulse animation

4. **Complete the Task**
   - Click checkbox to mark complete
   - Timer stops, `actualMinutes` saved to database
   - Task shows green checkmark

5. **View Historical Data**
   - Completed tasks retain their actual time
   - Can compare estimated vs actual in task details
   - Intelligence API uses this for timing insights

---

## 🧪 Combined Testing Workflow

### Real-World Scenario

1. **Monday Morning Planning**
   ```
   Open Smart Capture (Cmd+K) and paste:
   
   Reply to client emails - quick 20 min
   Team standup meeting - 30 min
   Code review urgent PR - high priority 45 min
   Deep work on new feature - complex 2 hours
   ```

2. **Start Working**
   - Select "Reply to client emails"
   - Status → In Progress
   - Watch timer count: 5m, 10m, 15m...
   - Complete when done (should stay under 20m)

3. **Move to Next Task**
   - Status → Completed (timer stops, actual time saved)
   - Select "Code review urgent PR"
   - Status → In Progress (new timer starts)
   - Watch for overrun warnings if it takes longer than 45m

4. **Review Your Day**
   - Check completed tasks' actual vs estimated times
   - Notice patterns: Do you underestimate emails? Overestimate reviews?
   - Timing Intelligence API can analyze this data

---

## 📊 Timing Insights (Ready to Test)

### Already Built Components
- `/api/intelligence/stats` - Timing analysis endpoint
- `TimingInsightsCard.tsx` - Visual component for insights

### Requirements
- Need tasks with both `estimatedMinutes` and `actualMinutes`
- Complete at least 5-10 tasks to see meaningful patterns

### What It Shows
- Average estimation accuracy (e.g., "You typically take 120% of estimates")
- Accuracy by time of day (morning tasks more accurate?)
- Accuracy by project
- Tasks that were significantly over/under

### How to Populate Data
1. Use Smart Capture to create tasks with estimates
2. Work on them with timer tracking (in-progress status)
3. Complete them (actual time gets saved)
4. After ~10 tasks, check `/analytics` page for insights

---

## 🎯 Success Criteria

### Smart Task Input ✅
- [x] Parses dates (today, tomorrow, next week, Friday)
- [x] Extracts time blocks (morning, afternoon, evening)
- [x] Detects priority (urgent, high, low)
- [x] Infers energy level (quick, complex)
- [x] Extracts durations (30 min, 2 hours)
- [x] Multiple tasks per input (one per line)
- [x] Visual feedback panel with examples
- [x] Works with and without OpenAI API

### Task Timer ✅
- [x] Auto-starts when status → in-progress
- [x] Live updates every minute
- [x] Visual color coding (blue/yellow/orange/red)
- [x] Pulse animation for overruns
- [x] Auto-stops when status → completed
- [x] Saves actual time to database
- [x] Tooltip shows estimated vs actual
- [x] Resets when status → pending

---

## 🐛 Known Limitations

### Smart Task Input
- **OpenAI Dependency**: Best results require `OPENAI_API_KEY` in `.env`
- **Fallback Parser**: Less sophisticated than GPT-4o-mini
- **Date Ambiguity**: "Friday" means "next Friday", not "this Friday" if today is Friday
- **Multi-line Descriptions**: Not supported (each line = new task)

### Task Timer
- **Minute Granularity**: Updates every 60 seconds, not real-time
- **No Pause Feature**: Can't pause timer without changing status
- **Accumulation Logic**: Changing pending→in-progress→pending→in-progress will create multiple sessions
- **No History View**: Can't see previous timer sessions (only final actualMinutes)

---

## 🚀 Future Enhancements

### Smart Task Input
- [ ] Project auto-detection ("Project Alpha: task name")
- [ ] Subtask parsing ("- parent task\n  - subtask 1\n  - subtask 2")
- [ ] Dependency inference ("after [other task]")
- [ ] Recurring task syntax ("every Monday morning")
- [ ] Specific date formats ("12/20", "Dec 20")

### Task Timer
- [ ] Real-time display (update every second)
- [ ] Timer pause/resume without status change
- [ ] Session history (show all timer segments)
- [ ] Background notifications (task running 2x estimate)
- [ ] Timer controls in header (global start/stop)
- [ ] Pomodoro integration (25min work, 5min break)

### Timing Insights
- [ ] Weekly/monthly reports
- [ ] Accuracy trends over time
- [ ] Best time of day recommendations
- [ ] Task type specialization (faster at emails than coding?)
- [ ] Burnout detection (consistently overworking?)
