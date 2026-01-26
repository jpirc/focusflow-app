/**
 * useTaskFilters - Task filtering and derived data
 * - Inbox tasks (unscheduled)
 * - Today's top priorities
 * - Active task tracking
 * - Display days calculation
 */

import { useMemo, useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { formatDate, formatDisplayDate, addDays, getWeekStart, isToday, isWeekend } from '@/lib/utils/date';

interface UseTaskFiltersProps {
    tasks: Task[];
    projects: Project[];
    currentDate: Date;
    viewDays: number;
    selectedProjectId: string | null;
}

export function useTaskFilters({
    tasks,
    projects,
    currentDate,
    viewDays,
    selectedProjectId,
}: UseTaskFiltersProps) {
    // Inbox tasks (unscheduled)
    const inboxTasks = useMemo(() =>
        tasks.filter(t =>
            !t.date &&
            t.status !== 'completed' &&
            (!selectedProjectId || t.projectId === selectedProjectId)
        ),
        [tasks, selectedProjectId]
    );

    // Today's date string for Top 3 priorities
    const todayDateStr = useMemo(() => formatDate(new Date()), []);

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
        inboxTasks,
        todayDateStr,
        todayTopPriorities,
        activeTask,
        displayDays,
    };
}
