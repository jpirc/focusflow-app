import axios from 'axios';
import type { Task, Project, AIBreakdownResponse, TimeBlock } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('focusflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

// ============================================
// TASK API
// ============================================

export const taskApi = {
  // Get all tasks with optional filters
  getAll: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    projectId?: string;
    status?: string;
    includeInbox?: boolean;
  }): Promise<Task[]> => {
    const { data } = await api.get('/tasks', { params });
    return transformTasksFromApi(data);
  },

  // Get inbox (unscheduled) tasks
  getInbox: async (): Promise<Task[]> => {
    const { data } = await api.get('/tasks/inbox');
    return transformTasksFromApi(data);
  },

  // Get single task
  getById: async (id: string): Promise<Task> => {
    const { data } = await api.get(`/tasks/${id}`);
    return transformTaskFromApi(data);
  },

  // Create new task
  create: async (task: Partial<Task>): Promise<Task> => {
    const { data } = await api.post('/tasks', transformTaskToApi(task));
    return transformTaskFromApi(data);
  },

  // Update task
  update: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const { data } = await api.put(`/tasks/${id}`, transformTaskToApi(updates));
    return transformTaskFromApi(data);
  },

  // Delete task
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Complete task
  complete: async (id: string): Promise<Task> => {
    const { data } = await api.post(`/tasks/${id}/complete`);
    return transformTaskFromApi(data);
  },

  // Start task
  start: async (id: string): Promise<Task> => {
    const { data } = await api.post(`/tasks/${id}/start`);
    return transformTaskFromApi(data);
  },

  // Move task to different date/time block
  move: async (taskId: string, targetDate: string | null, targetTimeBlock: TimeBlock): Promise<Task> => {
    const { data } = await api.post('/tasks/move', {
      task_id: taskId,
      target_date: targetDate,
      target_time_block: targetTimeBlock,
    });
    return transformTaskFromApi(data);
  },

  // Link two tasks (create dependency)
  link: async (parentTaskId: string, dependentTaskId: string): Promise<void> => {
    await api.post('/tasks/link', {
      parent_task_id: parentTaskId,
      dependent_task_id: dependentTaskId,
    });
  },

  // Unlink tasks (remove dependency)
  unlink: async (parentTaskId: string, dependentTaskId: string): Promise<void> => {
    await api.delete('/tasks/link', {
      data: {
        parent_task_id: parentTaskId,
        dependent_task_id: dependentTaskId,
      },
    });
  },

  // Toggle subtask completion
  toggleSubtask: async (taskId: string, subtaskId: string): Promise<Task> => {
    const { data } = await api.post(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
    return transformTaskFromApi(data);
  },

  // Carry over incomplete tasks
  carryOver: async (fromDate: string, toDate: string): Promise<{ carriedOver: number; taskIds: string[] }> => {
    const { data } = await api.post('/tasks/carry-over', null, {
      params: { from_date: fromDate, to_date: toDate },
    });
    return data;
  },
};

// ============================================
// PROJECT API
// ============================================

export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await api.get('/projects');
    return data.map(transformProjectFromApi);
  },

  create: async (project: Partial<Project>): Promise<Project> => {
    const { data } = await api.post('/projects', transformProjectToApi(project));
    return transformProjectFromApi(data);
  },

  getStats: async (projectId: string) => {
    const { data } = await api.get(`/projects/${projectId}/stats`);
    return data;
  },
};

// ============================================
// AI API
// ============================================

export const aiApi = {
  // Break down a task into smaller subtasks
  breakdownTask: async (
    taskTitle: string,
    taskDescription?: string,
    estimatedMinutes?: number,
    context?: string
  ): Promise<AIBreakdownResponse> => {
    const { data } = await api.post('/ai/breakdown', {
      task_title: taskTitle,
      task_description: taskDescription,
      estimated_minutes: estimatedMinutes,
      context: context,
    });
    return {
      subtasks: data.subtasks.map((s: any) => ({
        title: s.title,
        estimatedMinutes: s.estimated_minutes,
        energyLevel: s.energy_level,
        tips: s.tips,
      })),
      totalEstimatedMinutes: data.total_estimated_minutes,
      suggestedApproach: data.suggested_approach,
      motivationTip: data.motivation_tip,
    };
  },

  // Get schedule suggestions based on energy levels
  getScheduleSuggestions: async (tasks: Task[], date: string) => {
    const { data } = await api.post('/ai/schedule-suggestions', {
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        energy_level: t.energyLevel,
        priority: t.priority,
        estimated_minutes: t.estimatedMinutes,
      })),
      date: date,
    });
    return data;
  },
};

// ============================================
// SCHEDULE API
// ============================================

export const scheduleApi = {
  getDay: async (date: string) => {
    const { data } = await api.get(`/schedule/${date}`);
    return {
      date: data.date,
      morning: transformTasksFromApi(data.morning),
      afternoon: transformTasksFromApi(data.afternoon),
      evening: transformTasksFromApi(data.evening),
      anytime: transformTasksFromApi(data.anytime),
      stats: data.stats,
    };
  },

  getRange: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/schedule/range', {
      params: { start_date: startDate, end_date: endDate },
    });
    return data;
  },
};

// ============================================
// UNDO/REDO API
// ============================================

export const historyApi = {
  undo: async () => {
    const { data } = await api.post('/undo');
    return data;
  },

  redo: async () => {
    const { data } = await api.post('/redo');
    return data;
  },
};

// ============================================
// DATA TRANSFORMERS (snake_case <-> camelCase)
// ============================================

function transformTaskFromApi(apiTask: any): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    projectId: apiTask.project_id,
    date: apiTask.date,
    timeBlock: apiTask.time_block,
    estimatedMinutes: apiTask.estimated_minutes,
    actualMinutes: apiTask.actual_minutes,
    status: apiTask.status,
    priority: apiTask.priority,
    energyLevel: apiTask.energy_level,
    icon: apiTask.icon,
    subtasks: apiTask.subtasks || [],
    dependsOn: apiTask.depends_on || [],
    dependents: apiTask.dependents || [],
    carriedOverFrom: apiTask.carried_over_from,
    notes: apiTask.notes,
    recurrenceType: apiTask.recurrence_type || 'none',
    recurrenceDays: apiTask.recurrence_days,
    createdAt: apiTask.created_at,
    updatedAt: apiTask.updated_at,
  };
}

function transformTasksFromApi(apiTasks: any[]): Task[] {
  return (apiTasks || []).map(transformTaskFromApi);
}

function transformTaskToApi(task: Partial<Task>): any {
  const result: any = {};
  
  if (task.title !== undefined) result.title = task.title;
  if (task.description !== undefined) result.description = task.description;
  if (task.projectId !== undefined) result.project_id = task.projectId;
  if (task.date !== undefined) result.date = task.date;
  if (task.timeBlock !== undefined) result.time_block = task.timeBlock;
  if (task.estimatedMinutes !== undefined) result.estimated_minutes = task.estimatedMinutes;
  if (task.actualMinutes !== undefined) result.actual_minutes = task.actualMinutes;
  if (task.status !== undefined) result.status = task.status;
  if (task.priority !== undefined) result.priority = task.priority;
  if (task.energyLevel !== undefined) result.energy_level = task.energyLevel;
  if (task.icon !== undefined) result.icon = task.icon;
  if (task.subtasks !== undefined) result.subtasks = task.subtasks;
  if (task.dependsOn !== undefined) result.depends_on = task.dependsOn;
  if (task.notes !== undefined) result.notes = task.notes;
  if (task.recurrenceType !== undefined) result.recurrence_type = task.recurrenceType;
  if (task.recurrenceDays !== undefined) result.recurrence_days = task.recurrenceDays;
  
  return result;
}

function transformProjectFromApi(apiProject: any): Project {
  return {
    id: apiProject.id,
    name: apiProject.name,
    color: apiProject.color,
    bgColor: apiProject.bg_color,
    icon: apiProject.icon,
    description: apiProject.description,
  };
}

function transformProjectToApi(project: Partial<Project>): any {
  const result: any = {};
  
  if (project.name !== undefined) result.name = project.name;
  if (project.color !== undefined) result.color = project.color;
  if (project.bgColor !== undefined) result.bg_color = project.bgColor;
  if (project.icon !== undefined) result.icon = project.icon;
  if (project.description !== undefined) result.description = project.description;
  
  return result;
}

export default api;
