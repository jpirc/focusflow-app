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
    order?: number;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    date?: string | null;
    timeBlock?: TimeBlock | 'inbox';
    scheduledHour?: number | null;
    scheduledMinute?: number | null;
    startTime?: string | null;
    estimatedDuration?: number | null;
    projectId?: string | null;
    status?: TaskStatus;
    priority?: Priority;
    energyLevel?: EnergyLevel;
    estimatedMinutes?: number;
    actualMinutes?: number | null;
    completed?: boolean;
    isTopPriority?: boolean;
    topPriorityDate?: string | null;
    order?: number;
    startedAt?: string | null;
    completedAt?: string | null;
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
    async rollover(): Promise<ApiResult<{ count: number; tasks: Array<{ id: string; title: string; originalDate: string | null }> }>> {
        return apiFetch<{ count: number; tasks: Array<{ id: string; title: string; originalDate: string | null }> }>('/api/tasks/rollover', {
            method: 'POST',
        });
    },

    /**
     * Parse natural language text into task objects
     */
    async parse(text: string): Promise<ApiResult<{ tasks: CreateTaskInput[] }>> {
        return apiFetch<{ tasks: CreateTaskInput[] }>('/api/tasks/parse', {
            method: 'POST',
            body: JSON.stringify({ text }),
        });
    },

    /**
     * Batch update multiple tasks in a single transaction
     */
    async batchUpdate(updates: Array<{ id: string; data: UpdateTaskInput }>): Promise<ApiResult<{ tasks: Task[] }>> {
        return apiFetch<{ tasks: Task[] }>('/api/tasks/batch', {
            method: 'POST',
            body: JSON.stringify({ updates }),
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

// ============================================
// Intelligence API
// ============================================

export interface AIBreakdownInput {
    taskId: string;
    taskTitle: string;
    taskDescription?: string;
    estimatedMinutes?: number;
    energyLevel?: EnergyLevel;
    priority?: Priority;
    projectId?: string;
    timeBlock?: TimeBlock;
}

export interface AIBreakdownResponse {
    subtasks: Array<{ title: string; estimatedMinutes: number }>;
    totalEstimate: number;
    tips: string[];
    reasoning?: string;
    fallback?: boolean;
    error?: string;
}

export const intelligenceApi = {
    /**
     * Generate AI-powered task breakdown
     */
    async breakdown(input: AIBreakdownInput): Promise<ApiResult<AIBreakdownResponse>> {
        return apiFetch<AIBreakdownResponse>('/api/intelligence/breakdown', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    /**
     * Get AI suggestions for the user
     */
    async getSuggestions(status?: 'pending' | 'accepted' | 'dismissed'): Promise<ApiResult<any[]>> {
        const params = status ? `?status=${status}` : '';
        return apiFetch<any[]>(`/api/intelligence${params}`);
    },

    /**
     * Get user insights
     */
    async getInsights(): Promise<ApiResult<any[]>> {
        return apiFetch<any[]>('/api/intelligence?type=insights');
    },

    /**
     * Generate new suggestions
     */
    async generateSuggestions(): Promise<ApiResult<any[]>> {
        return apiFetch<any[]>('/api/intelligence', {
            method: 'POST',
        });
    },
};
