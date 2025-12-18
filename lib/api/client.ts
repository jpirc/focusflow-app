/**
 * API Client - Centralized fetch wrappers with typed responses
 * All API calls go through here for consistent error handling
 */

import { Task, Project, Subtask, TaskDependency, TimeBlock, TaskStatus, Priority, EnergyLevel } from '@/types';

// ============================================
// Types
// ============================================

export interface ApiError {
    error: string;
    details?: unknown;
}

export interface ApiResult<T> {
    data?: T;
    error?: string;
}

// ============================================
// Base fetch wrapper
// ============================================

async function apiFetch<T>(
    url: string,
    options?: RequestInit
): Promise<ApiResult<T>> {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            return { error: errorBody.error || `Request failed: ${response.status}` };
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        console.error(`API Error [${url}]:`, error);
        return { error: 'Network error. Please try again.' };
    }
}

// ============================================
// Task API
// ============================================

export interface CreateTaskInput {
    title: string;
    description?: string;
    date?: string | null;
    timeBlock?: TimeBlock;
    projectId?: string;
    parentTaskId?: string;
    estimatedMinutes?: number;
    priority?: Priority;
    energyLevel?: EnergyLevel;
    icon?: string;
    aiGenerated?: boolean;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    date?: string | null;
    timeBlock?: TimeBlock;
    projectId?: string | null;
    status?: TaskStatus;
    priority?: Priority;
    energyLevel?: EnergyLevel;
    estimatedMinutes?: number;
    actualMinutes?: number | null;
    completed?: boolean;
}

export const taskApi = {
    /**
     * Fetch all tasks for the current user
     */
    async getAll(): Promise<ApiResult<Task[]>> {
        return apiFetch<Task[]>('/api/tasks');
    },

    /**
     * Create a new task
     */
    async create(input: CreateTaskInput): Promise<ApiResult<Task>> {
        return apiFetch<Task>('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    /**
     * Update an existing task
     */
    async update(id: string, input: UpdateTaskInput): Promise<ApiResult<Task>> {
        return apiFetch<Task>(`/api/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(input),
        });
    },

    /**
     * Delete a task
     */
    async delete(id: string): Promise<ApiResult<{ success: boolean }>> {
        return apiFetch<{ success: boolean }>(`/api/tasks/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Rollover incomplete tasks from past days
     */
    async rollover(): Promise<ApiResult<{ count: number }>> {
        return apiFetch<{ count: number }>('/api/tasks/rollover', {
            method: 'POST',
        });
    },
};

// ============================================
// Project API
// ============================================

export interface CreateProjectInput {
    name: string;
    color: string;
    icon?: string;
    description?: string;
}

export interface UpdateProjectInput {
    name?: string;
    color?: string;
    icon?: string;
    description?: string;
}

export const projectApi = {
    /**
     * Fetch all projects for the current user
     */
    async getAll(): Promise<ApiResult<Project[]>> {
        return apiFetch<Project[]>('/api/projects');
    },

    /**
     * Create a new project
     */
    async create(input: CreateProjectInput): Promise<ApiResult<Project>> {
        return apiFetch<Project>('/api/projects', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    /**
     * Update an existing project
     */
    async update(id: string, input: UpdateProjectInput): Promise<ApiResult<Project>> {
        return apiFetch<Project>(`/api/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(input),
        });
    },

    /**
     * Delete a project (tasks move to inbox)
     */
    async delete(id: string): Promise<ApiResult<{ success: boolean }>> {
        return apiFetch<{ success: boolean }>(`/api/projects/${id}`, {
            method: 'DELETE',
        });
    },
};

// ============================================
// Dependency API
// ============================================

export const dependencyApi = {
    /**
     * Add a dependency to a task
     */
    async add(taskId: string, dependsOnId: string): Promise<ApiResult<TaskDependency>> {
        return apiFetch<TaskDependency>(`/api/tasks/${taskId}/dependencies`, {
            method: 'POST',
            body: JSON.stringify({ dependsOnId }),
        });
    },

    /**
     * Remove a dependency from a task
     */
    async remove(taskId: string, dependencyId: string): Promise<ApiResult<{ success: boolean }>> {
        return apiFetch<{ success: boolean }>(`/api/tasks/${taskId}/dependencies/${dependencyId}`, {
            method: 'DELETE',
        });
    },
};
