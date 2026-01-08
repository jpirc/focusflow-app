# Visual Intelligence Layer - Design Specification

## Problem Statement
The app has sophisticated AI/learning backend but it's **invisible to users**. Suggestions exist but aren't shown. Patterns are learned but hidden. This creates a "black box" experience that doesn't build trust or engagement.

**Current Issues:**
- Too much white space in cards/modals
- Intelligence features hidden (suggestions, insights, patterns)
- No visual feedback loop showing what the app is learning
- Modals interrupt workflow (AI breakdown is good, but suggestions shouldn't be modal)

---

## Design Philosophy: ADHD-Friendly Intelligence

### Core Principles

1. **Glanceable > Detailed**
   - Show key insights at a glance
   - Details on demand (hover/click to expand)
   - Dense but scannable

2. **Inline > Modal**
   - Suggestions appear in context
   - Don't interrupt flow
   - Easy to dismiss or act on

3. **Contextual > Generic**
   - Show suggestions relevant to current task/time
   - Smart hints on tasks themselves
   - Time-aware (morning suggestions in morning)

4. **Rewarding > Nagging**
   - Celebrate when suggestions are followed
   - Show accuracy improvements over time
   - Positive reinforcement, not guilt

5. **Compact > Spacious**
   - Efficient use of space
   - More information visible without scrolling
   - Clean, not cluttered

---

## Component Architecture

### 1. Smart Suggestion Toasts (Top Priority)
**Location**: Floating at top of day columns, above tasks  
**Appearance**: Thin horizontal bars, stacked if multiple

```
┌────────────────────────────────────────────────────┐
│ 💡 You complete Marketing tasks 78% faster in      │
│    morning → [Move to Morning] [Dismiss]           │
└────────────────────────────────────────────────────┘
```

**Features:**
- Auto-appear on relevant conditions (e.g., task in wrong time block)
- Auto-collapse to icon after 10s (💡 + number badge)
- Expand on hover
- Smooth slide-in animation
- Gradient border based on confidence level
- Click "Move" → instant action + celebration
- Track accept/dismiss for learning

**Technical:**
- Component: `SmartSuggestionBanner.tsx`
- Hook: `useSuggestions()` - fetches and manages suggestions
- Position: Absolute/sticky at top of TimeBlockColumn
- Max 3 visible per column, rest collapse to "💡 2 more"

---

### 2. Insights Sidebar Panel (Secondary)
**Location**: Slides in from right side of screen  
**Trigger**: Click "📊 Insights" button in header

```
┌─────────────────────────────┐
│ Your Patterns               │
│ ───────────────────────     │
│ ⏰ Time Preferences          │
│ • Morning person (85%)      │
│ • Avoid evening (12% done)  │
│                             │
│ 📊 Project Patterns          │
│ • Client Work → Afternoons  │
│ • PTO → Mornings (100%)     │
│                             │
│ ⚡ Energy Insights           │
│ • High energy = 2x faster   │
│ • Low energy tasks pile up  │
│                             │
│ 🎯 Accuracy                  │
│ • Time estimates: 22% over  │
│ • Improving! ↗️             │
└─────────────────────────────┘
```

**Features:**
- Compact badge format with emoji icons
- Expandable sections
- Click badge → detailed chart modal
- Real-time updates as you complete tasks
- "Learning..." shimmer on new patterns

**Technical:**
- Component: `InsightsPanel.tsx`
- Slides over from right (doesn't push content)
- Fetches from `/api/intelligence` and `/api/intelligence/stats`
- Zustand store for open/closed state

---

### 3. Smart Task Hints (Inline Micro-Badges)
**Location**: Inside TaskCard, after title/icons  
**Appearance**: Tiny colored pills with icons

```
[Task Title] 🕐45m ☀️morning 🔥high-energy
```

**Hint Types:**
- **⏱️ Learned Duration**: "Usually 45m" (from past completions)
- **☀️ Best Time**: "Try morning" (from time preference patterns)
- **⚡ Energy Match**: "Needs high energy" (pattern match)
- **📈 Success Rate**: "90% done when scheduled" (completion pattern)
- **🎯 Similar Tasks**: "Like 'Review design'" (semantic match)

**Features:**
- Only show 1-2 hints max (most relevant)
- Subtle, doesn't clutter
- Hover for explanation
- Click to auto-apply suggestion

**Technical:**
- Calculate hints in `useTasks` hook
- Pass as `taskHints` prop to TaskCard
- Render as `<SmartHint />` micro-component
- Cache calculations (don't re-compute on every render)

---

### 4. Mini Analytics Strip (Header Bar)
**Location**: Top of screen, always visible (doesn't scroll)  
**Appearance**: Thin horizontal bar with key metrics

```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 3/8 done • 🔥 2-day streak • ⚡ Peak: afternoons • 📊 +15% │
└──────────────────────────────────────────────────────────────┘
```

**Metrics:**
- Today's progress (tasks done / total)
- Current streak
- Peak productivity time (learned)
- This week vs last week (trend ↗️↘️)

**Features:**
- Updates in real-time as you complete tasks
- Click to expand detailed analytics
- Confetti animation on streak milestones
- Subtle pulse on metrics that are improving

**Technical:**
- Component: `MiniAnalyticsStrip.tsx`
- Position: Fixed at top (below header)
- Height: ~32px (minimal)
- Data from useTasks + useIntelligence hooks

---

## Visual Design System

### Color Coding for Intelligence
- **High Confidence (>80%)**: Purple gradient `from-purple-500 to-blue-500`
- **Medium Confidence (50-80%)**: Blue gradient `from-blue-400 to-cyan-400`
- **Low Confidence (<50%)**: Gray `bg-gray-100 text-gray-600`
- **New Pattern**: Amber shimmer `bg-amber-50 border-amber-200 animate-pulse`

### Typography Scale
- **Micro text**: `text-[9px]` - Tiny hints, secondary info
- **Small text**: `text-[10px]` - Badges, metrics
- **Body text**: `text-xs` (12px) - Task titles, descriptions
- **Emphasis**: `text-sm` (14px) - Headers, important info

### Spacing Reduction
- Card padding: `p-1.5` (was `p-2` or more)
- Gap between elements: `gap-1` (was `gap-2`)
- Badge padding: `px-1.5 py-0.5` (minimal)
- Margins: `mb-1` instead of `mb-2`

### Animation Principles
- **Smooth but fast**: 150ms transitions (not 300ms+)
- **Subtle entrance**: `slide-in-from-top` for suggestions
- **Micro-interactions**: Scale on hover (1.02), not 1.05
- **Celebration moments**: Confetti on acceptance, checkmark pop

---

## Implementation Plan

### Phase 1: Foundation (Session 1)
1. Create `hooks/useIntelligence.ts` - Manages suggestions/insights
2. Create `components/SmartSuggestionBanner.tsx` - First visual component
3. Add to main page - Show 1-2 suggestions at top of today's column
4. Test with mock data, then connect to real API

### Phase 2: Inline Hints (Session 2)
1. Calculate hints in `useTasks` hook
2. Add `SmartHint.tsx` micro-component
3. Show 1 hint per task (most relevant)
4. Add click handlers to apply suggestions

### Phase 3: Analytics Strip (Session 3)
1. Create `MiniAnalyticsStrip.tsx`
2. Calculate real-time metrics
3. Add to Header (fixed position)
4. Polish animations

### Phase 4: Insights Panel (Session 4)
1. Create `InsightsPanel.tsx` sidebar
2. Fetch and display patterns
3. Add charts/visualizations
4. Slide-in animation

---

## Success Metrics

### User Engagement
- % of suggestions accepted vs dismissed
- Time to dismiss (too intrusive if <2s)
- Frequency of insights panel opens

### Learning Accuracy
- Suggestion acceptance rate by confidence level
- Pattern reinforcement over time
- Estimation accuracy improvement

### ADHD-Specific
- Task completion rate before/after suggestions
- Rollover reduction (stale task decrease)
- Time to task initiation (first step started faster)

---

## Visual Examples

### Compact Task Card (Before/After)

**Before** (too spacious):
```
┌─────────────────────────────────────┐
│                                     │
│  📁 Project • [High] [⚡High]        │
│                                     │
│  Review marketing plan              │
│                                     │
│  Description: Need to review...     │
│                                     │
│  ⏱️ 30 min                          │
│                                     │
└─────────────────────────────────────┘
```

**After** (compact + smart):
```
┌───────────────────────────────────┐
│ 📁 Project • [High] [⚡] ⏱️30m     │
│ Review marketing plan ☀️morning   │
│ 0/3 steps • Usually takes 45m     │
└───────────────────────────────────┘
```

### Suggestion Banner States

**Expanded**:
```
┌─────────────────────────────────────────────────┐
│ 💡 You complete Marketing tasks 78% faster      │
│    in the morning (based on 12 tasks)           │
│    → [Move to Morning] [Not now]                │
└─────────────────────────────────────────────────┘
```

**Collapsed**:
```
┌──────────┐
│ 💡 3     │
└──────────┘
```

---

## Next Steps

1. **Review this spec** - Feedback on visual approach?
2. **Build foundation** - Start with SmartSuggestionBanner
3. **Iterate quickly** - Ship small, test, refine
4. **Track metrics** - Are suggestions helpful or annoying?
5. **User testing** - ADHD users validate the design

---

*Last Updated: 2026-01-08*
