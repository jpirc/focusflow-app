/**
 * useTasks Hook - Manages all task state and operations
 * Provides optimistic updates with automatic rollback on error
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Task, Subtask, TaskStatus, TimeBlock, TaskDependency } from '@/types';
import { taskApi, dependencyApi, CreateTaskInput, UpdateTaskInput } from '@/lib/api/client';

interface UseTasksOptions {
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** Callback when data finishes loading */
    onLoadComplete?: () => void;
}

interface UseTasksReturn {
    tasks: Task[];
    loading: boolean;
    
    // Task CRUD
    createTask: (input: CreateTaskInput) => Promise<Task | null>;
    updateTask: (id: string, updates: UpdateTaskInput) => Promise<void>;
    deleteTask: (id: string) => Promise<boolean>;
    
    // Status & positioning
    updateStatus: (id: string, status: TaskStatus) => Promise<void>;
    moveTask: (taskId: string, date: string, timeBlock: TimeBlock) => Promise<void>;
    
    // Subtasks
    addSubtask: (taskId: string, title: string, estimatedMinutes?: number) => Promise<void>;
    toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
    updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => Promise<void>;
    deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
    
    // Dependencies
    addDependency: (taskId: string, dependsOnId: string) => Promise<void>;
    removeDependency: (taskId: string, dependencyId: string) => Promise<void>;
    
    // Bulk operations
    applyAIBreakdown: (taskId: string, subtasks: Subtask[]) => void;
    refreshTasks: () => Promise<void>;
}

export function useTasks({ isAuthenticated, onLoadComplete }: UseTasksOptions): UseTasksReturn {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

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
            await taskApi.rollover();
            // Then fetch all tasks
            await refreshTasks();
        };

        init();
    }, [isAuthenticated, refreshTasks]);

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
        // Optimistic update - convert null to undefined for local state
        const localUpdates: Partial<Task> = {};
        for (const [key, value] of Object.entries(updates)) {
            (localUpdates as any)[key] = value === null ? undefined : value;
        }
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...localUpdates } : t));

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
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));

        if (!isAuthenticated) return;

        const result = await taskApi.update(id, { status });
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

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? {
                    ...t,
                    subtasks: t.subtasks?.map(s =>
                        s.id === subtaskId ? { ...s, completed: newCompleted } : s
                    ),
                }
                : t
        ));

        if (!isAuthenticated) return;

        const result = await taskApi.update(subtaskId, { completed: newCompleted });
        if (result.error) {
            await refreshTasks(); // Rollback
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
    // Bulk Operations
    // ============================================

    const applyAIBreakdown = useCallback((taskId: string, subtasks: Subtask[]) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, subtasks: [...(t.subtasks || []), ...subtasks], aiGenerated: true }
                : t
        ));
    }, []);

    return {
        tasks,
        loading,
        createTask,
        updateTask,
        deleteTask,
        updateStatus,
        moveTask,
        addSubtask,
        toggleSubtask,
        updateSubtask,
        deleteSubtask,
        addDependency,
        removeDependency,
        applyAIBreakdown,
        refreshTasks,
    };
}
