# Dopatika Performance & Efficiency Audit
**Date**: January 5, 2026  
**Branch**: `optimize/performance-audit`

## 🎯 Executive Summary

### Current State
- **Build Time**: ~10-15s (Prisma generate + Next.js compilation)
- **Type Safety**: Strict TypeScript with comprehensive types
- **Bundle Size**: Not yet optimized
- **Database Queries**: Some N+1 potential, but parallelized where possible
- **React Patterns**: Good use of hooks, some re-render opportunities

### Quick Wins Identified
1. ✅ **FIXED**: Missing drag-drop handlers in QuickEditTaskCard
2. 🔴 **Critical**: Batch task updates during reordering (currently sequential)
3. 🟡 **Medium**: Memoize expensive computations in main page
4. 🟡 **Medium**: Add React.memo to TaskCard components
5. 🟢 **Low**: Consider virtualizing long task lists

---

## 🐛 Bugs Fixed

### 1. Drag-and-Drop Reordering Not Working
**Status**: ✅ FIXED

**Problem**:
- `QuickEditTaskCard` was missing `onDragOver`, `onDragLeave`, and `onDrop` handlers
- Only `TaskCard` (old component) had the reordering logic
- TimeBlockColumn was setting up window global correctly, but cards weren't responding

**Fix Applied**:
```tsx
// Added to QuickEditTaskCard:
const [isDragOver, setIsDragOver] = useState(false);

onDragOver={(e) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedTaskId = e.dataTransfer.getData('text/plain');
    if (draggedTaskId !== task.id) {
        setIsDragOver(true);
    }
}}
onDragLeave={() => setIsDragOver(false)}
onDrop={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const draggedTaskId = e.dataTransfer.getData('text/plain');
    if (draggedTaskId && draggedTaskId !== task.id) {
        (window as any).__dropBeforeTaskId = task.id;
    }
}}
```

**Visual Feedback**: Purple border on hover (`border-t-2 border-t-purple-500`)

---

## ⚡ Performance Issues

### 1. Sequential Task Updates (CRITICAL)
**File**: `app/page.tsx` lines 357-385  
**Severity**: 🔴 **Critical**

**Problem**:
```tsx
// Currently: Sequential updates - SLOW for many tasks
for (let i = 0; i < reorderedTasks.length; i++) {
    await updateTask(reorderedTasks[i].id, { order: i });
}
```

**Impact**:
- Reordering 10 tasks = 10 sequential API calls
- Each call waits for previous to complete
- Total time: 10 × (network latency + processing) ≈ 500-2000ms

**Recommended Fix**:
```tsx
// Parallel updates - FAST
await Promise.all(
    reorderedTasks.map((task, i) =>
        updateTask(task.id, { order: i })
    )
);
```

**Estimated Improvement**: 5-10x faster for bulk reorders

---

### 2. Component Re-renders
**Files**: `app/page.tsx`, `components/QuickEditTaskCard.tsx`  
**Severity**: 🟡 **Medium**

**Problem**:
- `QuickEditTaskCard` re-renders on every state change in parent
- `TimeBlockColumn` re-renders all task cards when any task updates
- No memoization of expensive computations

**Evidence**:
```tsx
// page.tsx - Expensive computations on every render
const todayTasks = tasks.filter(t => t.date === today && !t.parentTaskId);
const tomorrowTasks = tasks.filter(t => t.date === tomorrow && !t.parentTaskId);
// ... runs every time `tasks` changes
```

**Recommended Fixes**:

#### A. Memoize Task Lists
```tsx
const todayTasks = useMemo(
    () => tasks.filter(t => t.date === today && !t.parentTaskId),
    [tasks, today]
);
const tomorrowTasks = useMemo(
    () => tasks.filter(t => t.date === tomorrow && !t.parentTaskId),
    [tasks, tomorrow]
);
```

#### B. Memo-ize TaskCard
```tsx
export const QuickEditTaskCard = React.memo<QuickEditTaskCardProps>((props) => {
    // ... component logic
}, (prevProps, nextProps) => {
    // Custom comparison - only re-render if task actually changed
    return (
        prevProps.task.id === nextProps.task.id &&
        prevProps.task.title === nextProps.task.title &&
        prevProps.task.status === nextProps.task.status &&
        prevProps.task.order === nextProps.task.order &&
        prevProps.isSelected === nextProps.isSelected
    );
});
```

**Estimated Improvement**: 30-50% fewer re-renders

---

### 3. Database Query Optimization
**Files**: `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`  
**Severity**: 🟡 **Medium**

**Current State**: ✅ Already good!
```tsx
// GET /api/tasks - Already parallelized
const completeTasks = await Promise.all(
    parentTasks.map(async (task) => {
        const [subtasks, dependencies] = await Promise.all([...]);
        // ...
    })
);
```

**Potential Issue**: Large task lists (100+ tasks)
- Could benefit from pagination or cursor-based loading
- Not critical for current use case (ADHD users typically have 5-20 active tasks)

**Recommendation**: Monitor, optimize if users report >50 tasks per day

---

### 4. Bundle Size & Code Splitting
**Severity**: 🟢 **Low Priority**

**Current Imports**:
```tsx
// Large icon library imported
import {
    Play, Pause, Wand2, MoreHorizontal, Edit3, Link2, Copy, Trash2,
    ChevronUp, ChevronDown, GripVertical, CheckCircle2, Circle,
    Sparkles, ArrowRight, Target, Flag, BatteryLow, BatteryMedium, BatteryFull,
    Coffee, Briefcase, Home, Heart, Dumbbell, BookOpen, RotateCcw, Clock, Star,
    Check, X, Calendar, Plus
} from 'lucide-react';
```

**Impact**: ~20-30KB of icons (acceptable for our use case)

**Recommendation**: Consider lazy loading modals if bundle gets >500KB

---

## 🏗️ Architecture Review

### Strengths
1. ✅ **Clear separation**: Hooks handle logic, components handle UI
2. ✅ **Type safety**: Comprehensive TypeScript coverage
3. ✅ **API design**: RESTful, predictable, well-validated (Zod)
4. ✅ **Database schema**: Normalized, indexed properly
5. ✅ **Optimistic UI**: Immediate feedback, rolls back on error

### Weaknesses
1. 🔴 **Sequential operations**: Batch updates needed
2. 🟡 **Missing memoization**: Re-renders more than necessary
3. 🟡 **No virtualization**: Could struggle with >100 tasks
4. 🟢 **No caching**: API calls could be cached (react-query?)

---

## 📊 Recommended Optimizations

### Phase 1: Quick Wins (1-2 hours)
**Priority**: HIGH  
**Impact**: HIGH

1. **Batch Reordering Updates** (30 min)
   - Change sequential loop to `Promise.all`
   - File: `app/page.tsx` line 378
   - Estimated improvement: 5-10x faster

2. **Memoize Task Filters** (30 min)
   - Wrap all task filter operations in `useMemo`
   - File: `app/page.tsx` throughout
   - Estimated improvement: 20-30% fewer re-renders

3. **Add React.memo to TaskCard** (30 min)
   - Wrap component export
   - Add custom comparison function
   - File: `components/QuickEditTaskCard.tsx`
   - Estimated improvement: 30-50% fewer re-renders

### Phase 2: Medium Gains (3-4 hours)
**Priority**: MEDIUM  
**Impact**: MEDIUM

1. **Add React Query** (2 hours)
   - Install `@tanstack/react-query`
   - Wrap API calls with caching
   - Automatic background refetching
   - Estimated improvement: Faster perceived performance

2. **Optimize API Routes** (1 hour)
   - Add database indexes on `(userId, date, timeBlock)`
   - Consider composite index for ordering
   - File: `prisma/schema.prisma`

3. **Add Loading States** (1 hour)
   - Skeleton screens during fetch
   - Better UX during slow connections

### Phase 3: Advanced (8-12 hours)
**Priority**: LOW  
**Impact**: LOW (unless usage scales)

1. **Virtual Scrolling** (4 hours)
   - `react-window` or `react-virtual`
   - Only render visible tasks
   - Useful if users have >50 tasks/day

2. **Service Worker** (4 hours)
   - Offline support
   - Background sync
   - Cache static assets

3. **Database Read Replicas** (4 hours)
   - Separate read/write connections
   - Supabase supports this natively

---

## 🎨 Code Quality Review

### Type Consistency
**Status**: ✅ Excellent

- All types defined in `types/index.ts`
- API client has proper input/output types
- Zod schemas match TypeScript types
- Database schema generates types automatically

**Recent Fix**: Added `order` field to all type layers:
- Prisma schema ✅
- TypeScript interfaces ✅
- API client types ✅
- Zod validation schemas ✅

### Error Handling
**Status**: ✅ Good

```tsx
// Consistent pattern across app
const result = await taskApi.create({ ... });
if (result.error) {
    console.error('Failed:', result.error);
    return; // Rollback optimistic update
}
```

**Recommendation**: Add toast notifications for user-facing errors

### Testing
**Status**: ⚠️ Missing

**Recommendation**:
1. Add Vitest for unit tests
2. Add Playwright for E2E tests
3. Test critical paths: task CRUD, drag-drop, timer

---

## 🔍 Build Analysis

### Current Build Process
```bash
1. npx prisma generate  # ~2-3s
2. next build           # ~8-12s
   - TypeScript check
   - ESLint
   - Compilation
   - Static generation
```

### Bottlenecks
1. ✅ Prisma generate is fast (uses cache)
2. 🟡 TypeScript check could be faster
   - Currently checking ~30 files
   - Incremental builds help

### Recommendations
1. **Separate lint from build** (CI/CD)
   ```json
   "build": "prisma generate && next build",
   "lint": "next lint",
   "typecheck": "tsc --noEmit"
   ```

2. **Use SWC minifier** (already enabled in Next.js 14)

3. **Analyze bundle**:
   ```bash
   npm install -D @next/bundle-analyzer
   ```

---

## 🚀 Deployment Optimizations

### Vercel Configuration
**Current**: Auto-deploy on push to main

**Recommendations**:
1. **Enable Edge Functions** for API routes (faster global response)
2. **Add ISR** for static pages (if we add marketing pages)
3. **Configure caching headers**:
   ```tsx
   // API routes
   export const revalidate = 0; // Dynamic
   
   // Static pages
   export const revalidate = 3600; // 1 hour
   ```

4. **Add Vercel Speed Insights**:
   ```bash
   npm install @vercel/speed-insights
   ```

### Database (Supabase)
**Current**: Pooled connection via Prisma

**Recommendations**:
1. ✅ Already using connection pooling
2. Consider **Supabase Edge Functions** for real-time features
3. Monitor query performance with Supabase dashboard
4. Add composite indexes:
   ```prisma
   @@index([userId, date, timeBlock])
   @@index([userId, status, date])
   ```

---

## 📈 Metrics to Track

### Performance Metrics
1. **Time to Interactive (TTI)**: Target <2s
2. **First Contentful Paint (FCP)**: Target <1s
3. **API Response Time**: Target <200ms
4. **Re-render Count**: Monitor with React DevTools

### User Experience Metrics
1. **Task Creation Time**: Click to save
2. **Drag-Drop Latency**: Drop to update
3. **Timer Accuracy**: Start to pause precision

### Monitoring Tools
1. **Vercel Analytics**: Built-in performance monitoring
2. **Sentry**: Error tracking (optional)
3. **PostHog**: User analytics (optional)

---

## 🎯 Action Plan

### Immediate (This Branch)
- [x] Fix drag-drop handlers in QuickEditTaskCard
- [ ] Batch task reordering updates (Promise.all)
- [ ] Add useMemo to task filters
- [ ] Test performance improvements

### Next Sprint
- [ ] Add React.memo to TaskCard
- [ ] Install React Query for caching
- [ ] Add loading skeletons
- [ ] Set up bundle analyzer

### Future Considerations
- [ ] Virtual scrolling (if needed)
- [ ] Service worker (offline support)
- [ ] E2E testing suite
- [ ] Performance monitoring dashboard

---

## 📝 Notes

### Why This Matters for ADHD Users
- **Speed**: Fast interactions reduce cognitive load
- **Feedback**: Immediate visual feedback builds trust
- **Reliability**: No lag = no frustration = sustained focus

### Technical Debt Assessment
**Overall Health**: ✅ **Good**

The codebase is well-structured with minimal tech debt. Main opportunities are performance optimizations, not architectural changes.

**Debt Items**:
1. 🟡 Missing tests (medium priority)
2. 🟡 No error monitoring (medium priority)
3. 🟢 Could use more documentation (low priority)

---

## 🔗 Related Files

- [Master Architecture + Roadmap](./docs/MASTER_ARCHITECTURE_ROADMAP.md)
- [Quick Edit Guide](./QUICK_EDIT_GUIDE.md)
- [Session Notes](./SESSION_NOTES.md)

---

**Generated**: January 5, 2026  
**Branch**: `optimize/performance-audit`  
**Next Review**: After Phase 1 optimizations
