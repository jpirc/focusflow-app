/**
 * useTaskFilters - Task filtering and derived data
 * - Inbox tasks (single unified list)
 * - Time-based filtering ("I Have X Minutes")
 * - Today's top priorities
 * - Active task tracking
 * - Display days calculation
 */

import { useMemo, useState, useEffect } from 'react';
import { Task, Project, TaskDependency } from '@/types';
import { formatDate, formatDisplayDate, addDays, getWeekStart, isToday, isWeekend } from '@/lib/utils/date';

interface UseTaskFiltersProps {
    tasks: Task[];
    projects: Project[];
    currentDate: Date;
    viewDays: number;
    selectedProjectId: string | null;
}

const priorityOrder: Record<string, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
};
const TIME_FILTER_STORAGE_KEY = 'dopatika_inbox_time_filter';
const LEGACY_TIME_FILTER_STORAGE_KEY = 'dopatika_queue_time_filter';

function dateValue(task: Task): number {
    if (!task.date) return Number.MAX_SAFE_INTEGER;
    const parsed = new Date(`${task.date}T00:00:00`).getTime();
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function scheduledValue(task: Task): number {
    if (task.scheduledHour === null || task.scheduledHour === undefined) return Number.MAX_SAFE_INTEGER;
    return task.scheduledHour * 60 + (task.scheduledMinute || 0);
}

function priorityValue(task: Task): number {
    return priorityOrder[task.priority || 'medium'] || 2;
}

function isDependencyComplete(dep: TaskDependency): boolean {
    const depTask = dep.dependsOn;
    if (!depTask) return false;
    return depTask.status === 'completed' || depTask.completed === true;
}

function isTaskReady(task: Task): boolean {
    const dependencies = task.dependencies || [];
    if (dependencies.length === 0) return true;
    return dependencies.every(isDependencyComplete);
}

function urgencyRank(task: Task, now: Date): number {
    if (!task.date) return 6;

    const todayStr = formatDate(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    if (task.date < todayStr) return 0;

    if (task.date === todayStr) {
        if (task.scheduledHour !== null && task.scheduledHour !== undefined) {
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            const taskMinutes = task.scheduledHour * 60 + (task.scheduledMinute || 0);
            const minutesUntil = taskMinutes - nowMinutes;

            if (minutesUntil < -15) return 0;
            if (minutesUntil <= 30) return 1;
            if (minutesUntil <= 120) return 2;
            return 3;
        }
        return 3;
    }

    if (task.date === tomorrowStr) return 4;
    return 5;
}

function stageRank(task: Task): number {
    if (!isTaskReady(task)) return 4;
    if ((task.rolloverCount || 0) > 0) return 0;
    if (task.date && task.scheduledHour !== null && task.scheduledHour !== undefined) return 1;
    if (task.date) return 2;
    return 3;
}

function sortQueueTasks(tasks: Task[]): Task[] {
    const now = new Date();

    return [...tasks].sort((a, b) => {
        const aUrgency = urgencyRank(a, now);
        const bUrgency = urgencyRank(b, now);
        if (aUrgency !== bUrgency) return aUrgency - bUrgency;

        const stageDiff = stageRank(a) - stageRank(b);
        if (stageDiff !== 0) return stageDiff;

        const aQuickWin = (a.estimatedMinutes || 30) <= 15;
        const bQuickWin = (b.estimatedMinutes || 30) <= 15;
        if (aQuickWin !== bQuickWin) return bQuickWin ? 1 : -1;

        const dateDiff = dateValue(a) - dateValue(b);
        if (dateDiff !== 0) return dateDiff;

        const scheduledDiff = scheduledValue(a) - scheduledValue(b);
        if (scheduledDiff !== 0) return scheduledDiff;

        const priorityDiff = priorityValue(b) - priorityValue(a);
        if (priorityDiff !== 0) return priorityDiff;

        const aRollovers = a.rolloverCount || 0;
        const bRollovers = b.rolloverCount || 0;
        if (aRollovers !== bRollovers) return bRollovers - aRollovers;

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

export function useTaskFilters({
    tasks,
    projects,
    currentDate,
    viewDays,
    selectedProjectId,
}: UseTaskFiltersProps) {
    // Time filter state for "I Have X Minutes" feature
    const [timeFilter, setTimeFilter] = useState<number | null>(() => {
        if (typeof window === 'undefined') return null;
        const stored =
            localStorage.getItem(TIME_FILTER_STORAGE_KEY) ??
            localStorage.getItem(LEGACY_TIME_FILTER_STORAGE_KEY);
        if (!stored) return null;
        const parsed = Number(stored);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (timeFilter === null) {
            localStorage.removeItem(TIME_FILTER_STORAGE_KEY);
            localStorage.removeItem(LEGACY_TIME_FILTER_STORAGE_KEY);
            return;
        }
        localStorage.setItem(TIME_FILTER_STORAGE_KEY, String(timeFilter));
        localStorage.removeItem(LEGACY_TIME_FILTER_STORAGE_KEY);
    }, [timeFilter]);

    // Inbox tasks are only tasks with no date/time placement yet
    const unscheduledQueueTasks = useMemo(() =>
        tasks.filter(t =>
            !t.date &&
            t.status !== 'completed' &&
            t.status !== 'skipped' &&
            t.status !== 'in-progress' &&
            (!selectedProjectId || t.projectId === selectedProjectId)
        ),
        [tasks, selectedProjectId]
    );

    const queueTasks = useMemo(() => {
        const filtered = (timeFilter !== null && timeFilter > 0)
            ? unscheduledQueueTasks.filter(task => (task.estimatedMinutes || 30) <= timeFilter)
            : unscheduledQueueTasks;

        return sortQueueTasks(filtered);
    }, [unscheduledQueueTasks, timeFilter]);

    const queueCount = unscheduledQueueTasks.length;

    // Task counts for each time filter option
    const timeFilterCounts = useMemo(() => {
        return {
            '15': unscheduledQueueTasks.filter(t => (t.estimatedMinutes || 30) <= 15).length,
            '30': unscheduledQueueTasks.filter(t => (t.estimatedMinutes || 30) <= 30).length,
            '60': unscheduledQueueTasks.filter(t => (t.estimatedMinutes || 30) <= 60).length,
            '120': unscheduledQueueTasks.filter(t => (t.estimatedMinutes || 30) <= 120).length,
            all: unscheduledQueueTasks.length,
        };
    }, [unscheduledQueueTasks]);

    // Today's date string for Top 3 priorities
    const todayDateStr = formatDate(new Date());

    // Get existing Top 3 priorities for today
    const todayTopPriorities = useMemo(() =>
        tasks
            .filter(t => t.isTopPriority && t.topPriorityDate === todayDateStr)
            .map(t => t.id),
        [tasks, todayDateStr]
    );

    // Active task (currently in-progress) for header nudge
    const [elapsedTime, setElapsedTime] = useState(0);

    const activeTask = useMemo(() => {
        const task = tasks.find(t => t.status === 'in-progress');
        if (!task || !task.startedAt) return null;
        const project = projects.find(p => p.id === task.projectId);
        const currentSubtask = task.subtasks?.find(s => !s.completed);
        return {
            id: task.id,
            title: task.title,
            projectColor: project?.color || '#6b7280',
            elapsedMinutes: elapsedTime,
            startedAt: task.startedAt,
            currentSubtask: currentSubtask?.title,
        };
    }, [tasks, projects, elapsedTime]);

    // Update elapsed time every minute for active task
    useEffect(() => {
        const task = tasks.find(t => t.status === 'in-progress');
        if (task && task.startedAt) {
            const updateElapsed = () => {
                const currentSessionMinutes = Math.floor((Date.now() - new Date(task.startedAt!).getTime()) / 60000);
                const accumulatedMinutes = task.actualMinutes || 0;
                setElapsedTime(currentSessionMinutes + accumulatedMinutes);
            };
            updateElapsed(); // Initial update
            const interval = setInterval(updateElapsed, 60000); // Update every minute
            return () => clearInterval(interval);
        } else {
            setElapsedTime(0);
        }
    }, [tasks]);

    // For week view (7 days), start from Sunday of current week
    const displayDays = useMemo(() => {
        const startDate = viewDays === 7 ? getWeekStart(currentDate) : currentDate;

        return Array.from({ length: viewDays }, (_, i) => {
            const date = addDays(startDate, i);
            const dateStr = formatDate(date);
            const dayTasks = tasks.filter(t =>
                t.date && formatDate(t.date) === dateStr &&
                t.status !== 'completed' &&
                (!selectedProjectId || t.projectId === selectedProjectId)
            );
            // Get completed tasks for this day (by completedAt date)
            const completedTasks = tasks.filter(t => {
                if (t.status !== 'completed' || !t.completedAt) return false;
                const completedDate = formatDate(new Date(t.completedAt));
                return completedDate === dateStr && (!selectedProjectId || t.projectId === selectedProjectId);
            });
            // For timeline view: include completed tasks with scheduled times so they show as ghosts
            const timelineTasks = tasks.filter(t => {
                // Include incomplete tasks for this day
                if (t.date && formatDate(t.date) === dateStr && t.status !== 'completed' &&
                    (!selectedProjectId || t.projectId === selectedProjectId)) {
                    return true;
                }
                // Include completed tasks if they have a scheduled time
                if (t.status === 'completed' && t.completedAt &&
                    (t.scheduledHour !== null && t.scheduledHour !== undefined) &&
                    (!selectedProjectId || t.projectId === selectedProjectId)) {
                    const completedDate = formatDate(new Date(t.completedAt));
                    return completedDate === dateStr;
                }
                return false;
            });
            return {
                date,
                dateStr,
                display: formatDisplayDate(dateStr),
                isToday: isToday(dateStr),
                isWeekend: isWeekend(date),
                tasks: dayTasks,
                completedTasks,
                timelineTasks,
            };
        });
    }, [tasks, currentDate, viewDays, selectedProjectId]);

    return {
        queueTasks,
        queueCount,
        todayDateStr,
        todayTopPriorities,
        activeTask,
        displayDays,
        // Time filter
        timeFilter,
        setTimeFilter,
        timeFilterCounts,
    };
}
