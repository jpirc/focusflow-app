/**
 * useTasks Hook - Manages all task state and operations
 * Provides optimistic updates with automatic rollback on error
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Task, Subtask, TaskStatus, TimeBlock, TaskDependency } from '@/types';
import { taskApi, dependencyApi, CreateTaskInput, UpdateTaskInput } from '@/lib/api/client';
import { formatDate, getCurrentTimeBlock, isPastTimeBlock, getNextTimeBlock } from '@/lib/utils/date';
import { useNotifications } from './useNotifications';

interface UseTasksOptions {
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** Callback when data finishes loading */
    onLoadComplete?: () => void;
    /** Callback when task is completed for celebration */
    onTaskComplete?: () => void;
}

interface UseTasksReturn {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    loading: boolean;
    rolledOverTasks: Array<{ id: string; title: string; originalDate: string | null }>;
    dismissRolloverNotification: () => void;
    unblockedTasks: Array<{ task: Task; completedDependency: string }>;
    dismissUnblockedNotification: () => void;

    // Task CRUD
    createTask: (input: CreateTaskInput) => Promise<Task | null>;
    updateTask: (id: string, updates: UpdateTaskInput) => Promise<void>;
    deleteTask: (id: string) => Promise<boolean>;

    // Status & positioning
    updateStatus: (id: string, status: TaskStatus) => Promise<void>;
    pauseTask: (id: string) => Promise<void>;
    uncompleteToInbox: (id: string) => Promise<void>;
    moveTask: (taskId: string, date: string, timeBlock: TimeBlock) => Promise<void>;

    // Subtasks
    addSubtask: (taskId: string, title: string, estimatedMinutes?: number) => Promise<void>;
    toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
    updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => Promise<void>;
    deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

    // Dependencies
    addDependency: (taskId: string, dependsOnId: string) => Promise<void>;
    removeDependency: (taskId: string, dependencyId: string) => Promise<void>;

    // Top 3 Priorities
    setTopPriorities: (taskIds: string[], dateStr: string) => Promise<void>;

    // Bulk operations
    applyAIBreakdown: (taskId: string, subtasks: Subtask[]) => void;
    clearFinishedTasks: (taskIds: string[]) => Promise<void>;
    refreshTasks: () => Promise<void>;

    // ADHD-friendly quick actions
    startTaskNow: (taskId: string) => Promise<void>;
}

export function useTasks({ isAuthenticated, onLoadComplete, onTaskComplete }: UseTasksOptions): UseTasksReturn {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [rolledOverTasks, setRolledOverTasks] = useState<Array<{ id: string; title: string; originalDate: string | null }>>([]);
    const [unblockedTasks, setUnblockedTasks] = useState<Array<{ task: Task; completedDependency: string }>>([]);

    // Notification system
    const { showNotification } = useNotifications();

    // ============================================
    // Fetch & Refresh
    // ============================================

    const refreshTasks = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const result = await taskApi.getAll();
        if (result.data) {
            setTasks(result.data);
        }
        setLoading(false);
        onLoadComplete?.();
    }, [isAuthenticated, onLoadComplete]);

    // Auto-rollover and initial fetch
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const init = async () => {
            // Rollover incomplete past tasks
            const rolloverResult = await taskApi.rollover();
            if (rolloverResult.data && rolloverResult.data.count > 0) {
                setRolledOverTasks(rolloverResult.data.tasks);

                // Send rollover notification
                const count = rolloverResult.data.count;
                showNotification({
                    title: 'Tasks Rolled Over',
                    body: `${count} task${count > 1 ? 's' : ''} moved to today from previous days`,
                    type: 'rollover',
                });
            }
            // Then fetch all tasks
            await refreshTasks();
        };

        init();
    }, [isAuthenticated, refreshTasks]);

    // ============================================
    // Smart Auto-Bump: DISABLED
    // ============================================
    // Note: Auto-bump feature has been disabled because we now have an "Unstarted Tasks"
    // bucket that shows pending tasks from past time blocks. This gives users visibility
    // without automatically changing their schedule. Users can manually start/reschedule
    // tasks from the Unstarted Tasks bucket.
    //
    // Previously, this would automatically move pending tasks from past time blocks
    // (e.g., morning tasks when it's now afternoon) to the current time block.
    // This was removed because it was moving tasks without user intent.

    // ============================================
    // Task CRUD
    // ============================================

    const createTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
        if (!isAuthenticated) return null;

        const result = await taskApi.create(input);
        if (result.data) {
            setTasks(prev => [...prev, result.data!]);
            return result.data;
        } else {
            alert(result.error || 'Failed to create task');
            return null;
        }
    }, [isAuthenticated]);

    const updateTask = useCallback(async (id: string, updates: UpdateTaskInput) => {
        // Optimistic update - cast to Task to avoid type conflicts
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } as Task : t));

        if (!isAuthenticated) return;

        const result = await taskApi.update(id, updates);
        if (result.error) {
            console.error('Failed to update task:', result.error);
            await refreshTasks(); // Rollback
        }
    }, [isAuthenticated, refreshTasks]);

    const deleteTask = useCallback(async (id: string): Promise<boolean> => {
        if (!confirm('Are you sure you want to delete this task?')) return false;
        if (!isAuthenticated) return false;

        // Store for rollback
        const deletedTask = tasks.find(t => t.id === id);
        
        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== id));

        const result = await taskApi.delete(id);
        if (result.error) {
            // Rollback
            if (deletedTask) {
                setTasks(prev => [...prev, deletedTask]);
            }
            alert('Failed to delete task. Please try again.');
            return false;
        }

        return true;
    }, [isAuthenticated, tasks]);

    // ============================================
    // Status & Position
    // ============================================

    const updateStatus = useCallback(async (id: string, status: TaskStatus) => {
        // Optimistic update - set timestamps based on status
        const nowDate = new Date();
        const now = nowDate.toISOString();
        const currentHour = nowDate.getHours();
        const currentMinute = nowDate.getMinutes();

        // If completing a task, check for newly unblocked tasks
        if (status === 'completed') {
            const completedTask = tasks.find(t => t.id === id);
            if (completedTask) {
                // Find tasks that depend on this completed task
                const newlyUnblocked = tasks.filter(task =>
                    task.dependencies?.some(dep => dep.dependsOnId === id) &&
                    task.status !== 'completed' &&
                    // Check if ALL dependencies are now completed
                    task.dependencies.every(dep => {
                        const depTask = tasks.find(t => t.id === dep.dependsOnId);
                        return depTask?.status === 'completed' || dep.dependsOnId === id;
                    })
                );

                if (newlyUnblocked.length > 0) {
                    setUnblockedTasks(prev => [
                        ...prev,
                        ...newlyUnblocked.map(task => ({
                            task,
                            completedDependency: completedTask.title
                        }))
                    ]);

                    // Send notification for unblocked tasks
                    if (newlyUnblocked.length === 1) {
                        showNotification({
                            title: 'Task Unlocked!',
                            body: `"${newlyUnblocked[0].title}" is now ready to work on`,
                            type: 'dependency',
                        });
                    } else {
                        showNotification({
                            title: 'Tasks Unlocked!',
                            body: `${newlyUnblocked.length} tasks are now ready to work on`,
                            type: 'dependency',
                        });
                    }
                }
            }
        }

        setTasks(prev => prev.map(t => {
            if (t.id !== id) return t;
            const updates: Partial<typeof t> = { status };
            if (status === 'in-progress') {
                updates.startedAt = now;
                // Update scheduled time to actual start time (for timeline accuracy)
                updates.scheduledHour = currentHour;
                updates.scheduledMinute = currentMinute;
            } else if (status === 'completed') {
                updates.completedAt = now;
                // Add current session's time to existing accumulated time
                let accumulatedMinutes = t.actualMinutes || 0;
                if (t.startedAt) {
                    const elapsed = Math.round((Date.now() - new Date(t.startedAt).getTime()) / 60000);
                    accumulatedMinutes += elapsed;
                }
                updates.actualMinutes = accumulatedMinutes;
            } else if (status === 'pending') {
                updates.startedAt = null;
                updates.completedAt = null;
            }
            return { ...t, ...updates };
        }));

        if (!isAuthenticated) return;

        // Build update payload with actual times
        const updatePayload: any = { status };
        if (status === 'in-progress') {
            updatePayload.startedAt = now;
            updatePayload.scheduledHour = currentHour;
            updatePayload.scheduledMinute = currentMinute;
        } else if (status === 'completed') {
            updatePayload.completedAt = now;
            // Calculate actual duration
            const task = tasks.find(t => t.id === id);
            if (task?.startedAt) {
                const elapsed = Math.round((Date.now() - new Date(task.startedAt).getTime()) / 60000);
                updatePayload.actualMinutes = (task.actualMinutes || 0) + elapsed;
            }
        }

        const result = await taskApi.update(id, updatePayload);
        if (result.error) {
            await refreshTasks(); // Rollback
        }
    }, [isAuthenticated, refreshTasks, tasks]);

    const pauseTask = useCallback(async (id: string) => {
        // Optimistic update - pause task and accumulate elapsed time
        setTasks(prev => prev.map(t => {
            if (t.id !== id) return t;
            let accumulatedMinutes = t.actualMinutes || 0;
            if (t.startedAt) {
                const elapsed = Math.round((Date.now() - new Date(t.startedAt).getTime()) / 60000);
                accumulatedMinutes += elapsed;
            }
            return {
                ...t,
                status: 'pending' as TaskStatus,
                startedAt: null,
                actualMinutes: accumulatedMinutes,
            };
        }));

        if (!isAuthenticated) return;

        // Get current task to calculate accumulated time
        const task = tasks.find(t => t.id === id);
        let accumulatedMinutes = task?.actualMinutes || 0;
        if (task?.startedAt) {
            const elapsed = Math.round((Date.now() - new Date(task.startedAt).getTime()) / 60000);
            accumulatedMinutes += elapsed;
        }

        const result = await taskApi.update(id, { 
            status: 'pending',
            actualMinutes: accumulatedMinutes,
        });
        if (result.error) {
            await refreshTasks(); // Rollback
        }
    }, [isAuthenticated, tasks, refreshTasks]);

    const uncompleteToInbox = useCallback(async (id: string) => {
        // Optimistic update - set to pending and clear date
        setTasks(prev => prev.map(t => 
            t.id === id 
                ? { ...t, status: 'pending' as TaskStatus, date: null, completedAt: null } 
                : t
        ));

        if (!isAuthenticated) return;

        const result = await taskApi.update(id, { 
            status: 'pending', 
            date: null,
            completed: false 
        });
        if (result.error) {
            await refreshTasks(); // Rollback
        }
    }, [isAuthenticated, refreshTasks]);

    const moveTask = useCallback(async (taskId: string, date: string, timeBlock: TimeBlock) => {
        // Optimistic update
        setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, date, timeBlock } : t
        ));

        if (!isAuthenticated) return;

        const result = await taskApi.update(taskId, { date, timeBlock });
        if (result.error) {
            await refreshTasks(); // Rollback
        }
    }, [isAuthenticated, refreshTasks]);

    // ============================================
    // Subtasks
    // ============================================

    const addSubtask = useCallback(async (taskId: string, title: string, estimatedMinutes = 15) => {
        if (!isAuthenticated) return;

        const result = await taskApi.create({
            title,
            parentTaskId: taskId,
            timeBlock: 'anytime',
            estimatedMinutes,
        });

        if (result.data) {
            const newSubtask = {
                ...result.data,
                completed: result.data.completed || false,
                estimatedMinutes: result.data.estimatedMinutes || estimatedMinutes,
            };

            setTasks(prev => prev.map(t =>
                t.id === taskId
                    ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
                    : t
            ));
        } else {
            alert(result.error || 'Failed to add subtask');
        }
    }, [isAuthenticated]);

    const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        const subtask = task?.subtasks?.find(s => s.id === subtaskId);
        if (!subtask) return;

        const newCompleted = !subtask.completed;

        // Auto-start parent task if not already in progress
        const shouldAutoStart = task && task.status === 'pending';

        // Check if completing the last subtask
        const incompleteSibling = task?.subtasks?.filter(s => 
            s.id !== subtaskId && !s.completed
        );
        const shouldAutoComplete = newCompleted && incompleteSibling?.length === 0;

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? {
                    ...t,
                    status: shouldAutoComplete ? 'completed' : (shouldAutoStart ? 'in-progress' : t.status),
                    startedAt: shouldAutoStart && !shouldAutoComplete ? new Date().toISOString() : t.startedAt,
                    completedAt: shouldAutoComplete ? new Date().toISOString() : t.completedAt,
                    subtasks: t.subtasks?.map(s =>
                        s.id === subtaskId ? { ...s, completed: newCompleted } : s
                    ),
                }
                : t
        ));

        if (!isAuthenticated) return;

        // Batch update: subtask + parent task (if needed)
        const updates: Array<{ id: string; data: UpdateTaskInput }> = [
            { id: subtaskId, data: { completed: newCompleted } }
        ];

        if (shouldAutoComplete) {
            updates.push({
                id: taskId,
                data: {
                    status: 'completed',
                    completedAt: new Date().toISOString()
                }
            });
        } else if (shouldAutoStart) {
            updates.push({
                id: taskId,
                data: {
                    status: 'in-progress',
                    startedAt: new Date().toISOString()
                }
            });
        }

        const result = await taskApi.batchUpdate(updates);
        if (result.error) {
            await refreshTasks(); // Rollback
        } else if (shouldAutoComplete) {
            onTaskComplete?.(); // Trigger celebration
        }
    }, [isAuthenticated, tasks, refreshTasks]);

    const updateSubtask = useCallback(async (
        taskId: string,
        subtaskId: string,
        updates: Partial<Subtask>
    ) => {
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? {
                    ...t,
                    subtasks: t.subtasks?.map(s =>
                        s.id === subtaskId ? { ...s, ...updates } : s
                    ),
                }
                : t
        ));

        if (!isAuthenticated) return;

        const result = await taskApi.update(subtaskId, updates as UpdateTaskInput);
        if (result.error) {
            await refreshTasks(); // Rollback
        }
    }, [isAuthenticated, refreshTasks]);

    const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, subtasks: t.subtasks?.filter(s => s.id !== subtaskId) }
                : t
        ));

        if (!isAuthenticated) return;

        const result = await taskApi.delete(subtaskId);
        if (result.error) {
            await refreshTasks(); // Rollback
        }
    }, [isAuthenticated, refreshTasks]);

    // ============================================
    // Dependencies
    // ============================================

    const addDependency = useCallback(async (taskId: string, dependsOnId: string) => {
        if (!isAuthenticated) return;

        const result = await dependencyApi.add(taskId, dependsOnId);
        if (result.data) {
            setTasks(prev => prev.map(t =>
                t.id === taskId
                    ? { ...t, dependencies: [...(t.dependencies || []), result.data!] }
                    : t
            ));
        } else {
            alert(result.error || 'Failed to add dependency');
        }
    }, [isAuthenticated]);

    const removeDependency = useCallback(async (taskId: string, dependencyId: string) => {
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, dependencies: t.dependencies?.filter(d => d.id !== dependencyId) }
                : t
        ));

        if (!isAuthenticated) return;

        const result = await dependencyApi.remove(taskId, dependencyId);
        if (result.error) {
            await refreshTasks(); // Rollback
        }
    }, [isAuthenticated, refreshTasks]);

    // ============================================
    // Top 3 Priorities
    // ============================================

    const setTopPriorities = useCallback(async (taskIds: string[], dateStr: string) => {
        // Optimistic update - set new priorities first, then clear old ones
        setTasks(prev => prev.map(t => {
            // If task should be a top priority, set it
            if (taskIds.includes(t.id)) {
                return {
                    ...t,
                    isTopPriority: true,
                    topPriorityDate: dateStr,
                    // Move to today (anytime) so they can be scheduled
                    date: dateStr,
                    timeBlock: 'anytime' as TimeBlock,
                };
            }
            // If task was a top priority for this date but is no longer selected, clear it
            if (t.topPriorityDate === dateStr) {
                return { ...t, isTopPriority: false, topPriorityDate: null };
            }
            return t;
        }));

        if (!isAuthenticated) return;

        // Clear existing priorities for this date
        const existingTopPriorities = tasks.filter(t => t.topPriorityDate === dateStr && !taskIds.includes(t.id));
        const clearPromises = existingTopPriorities.map(t =>
            taskApi.update(t.id, { isTopPriority: false, topPriorityDate: null })
        );

        // Set new priorities and move to today (anytime)
        const setPromises = taskIds.map(id =>
            taskApi.update(id, {
                isTopPriority: true,
                topPriorityDate: dateStr,
                date: dateStr,
                timeBlock: 'anytime',
            })
        );

        const results = await Promise.all([...clearPromises, ...setPromises]);

        // If any failed, refresh to sync
        if (results.some(r => r.error)) {
            await refreshTasks();
        }
    }, [isAuthenticated, tasks, refreshTasks]);

    // ============================================
    // Bulk Operations
    // ============================================

    const applyAIBreakdown = useCallback(async (taskId: string, subtasks: Subtask[]) => {
        if (!isAuthenticated) {
            // Just update local state if not authenticated
            setTasks(prev => prev.map(t =>
                t.id === taskId
                    ? { ...t, subtasks: [...(t.subtasks || []), ...subtasks], aiGenerated: true }
                    : t
            ));
            return;
        }

        // Create each subtask via API (they're stored as tasks with parentTaskId)
        const createdSubtasks = await Promise.all(
            subtasks.map(subtask => 
                taskApi.create({
                    title: subtask.title,
                    parentTaskId: taskId,
                    timeBlock: 'anytime',
                    estimatedMinutes: subtask.estimatedMinutes,
                })
            )
        );

        // Filter successful creations
        const successfulSubtasks = createdSubtasks
            .filter(result => result.data)
            .map(result => result.data!) as Subtask[];

        if (successfulSubtasks.length > 0) {
            // Update local state with created subtasks
            setTasks(prev => prev.map(t =>
                t.id === taskId
                    ? { ...t, subtasks: [...(t.subtasks || []), ...successfulSubtasks], aiGenerated: true }
                    : t
            ));
        }

        // Log any failures
        const failures = createdSubtasks.filter(result => result.error);
        if (failures.length > 0) {
            console.error('Some subtasks failed to save:', failures);
        }
    }, [isAuthenticated]);

    /**
     * Start Task Now - ADHD-friendly one-click start
     * Schedules task at current time and sets to in-progress
     */
    const startTaskNow = useCallback(async (taskId: string) => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDateStr = formatDate(now);

        // Determine which time block we're in
        const timeBlock: TimeBlock =
            currentHour >= 6 && currentHour < 12 ? 'morning' :
            currentHour >= 12 && currentHour < 17 ? 'afternoon' :
            currentHour >= 17 && currentHour < 22 ? 'evening' :
            'anytime';

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? {
                ...t,
                date: currentDateStr,
                timeBlock,
                scheduledHour: currentHour,
                scheduledMinute: currentMinute,
                status: 'in-progress' as TaskStatus,
                startedAt: now.toISOString(),
            } : t
        ));

        if (!isAuthenticated) return;

        // Use batch update for atomic operation
        const result = await taskApi.batchUpdate([{
            id: taskId,
            data: {
                date: currentDateStr,
                timeBlock,
                scheduledHour: currentHour,
                scheduledMinute: currentMinute,
                status: 'in-progress',
                startedAt: now.toISOString(),
            }
        }]);

        if (result.error) {
            console.error('Failed to start task now:', result.error);
            // Rollback optimistic update
            await refreshTasks();
            throw new Error(result.error);
        }
    }, [isAuthenticated, refreshTasks]);

    const clearFinishedTasks = useCallback(async (taskIds: string[]) => {
        if (taskIds.length === 0) return;

        // Optimistic update - remove all specified tasks
        setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));

        if (!isAuthenticated) return;

        // Delete all tasks in parallel
        const results = await Promise.all(
            taskIds.map(id => taskApi.delete(id))
        );

        // If any failed, refresh to sync
        if (results.some(r => r.error)) {
            await refreshTasks();
        }
    }, [isAuthenticated, refreshTasks]);

    return {
        tasks,
        setTasks,
        loading,
        rolledOverTasks,
        dismissRolloverNotification: () => setRolledOverTasks([]),
        unblockedTasks,
        dismissUnblockedNotification: () => setUnblockedTasks([]),
        createTask,
        updateTask,
        deleteTask,
        updateStatus,
        pauseTask,
        uncompleteToInbox,
        moveTask,
        addSubtask,
        toggleSubtask,
        updateSubtask,
        deleteSubtask,
        addDependency,
        removeDependency,
        setTopPriorities,
        applyAIBreakdown,
        clearFinishedTasks,
        refreshTasks,
        startTaskNow,
    };
}
