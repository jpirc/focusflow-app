import React from 'react';

export type TimeBlock = 'inbox' | 'anytime' | 'morning' | 'afternoon' | 'evening';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'skipped' | 'carried-over';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface TimeBlockConfig {
    id: TimeBlock;
    label: string;
    shortLabel?: string; // Short label for compact views (e.g., "AM", "PM", "Eve")
    icon: React.ReactNode;
    hours: string;
    energyMatch: EnergyLevel;
}

export interface Project {
    id: string;
    name: string;
    color: string;
    bgColor: string;
    icon: string;
    description?: string;
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    estimatedMinutes?: number;
}

export interface TaskDependency {
    id: string;
    taskId: string;
    dependsOnId: string;
    createdAt: string;
    // Resolved task object when joined on the client
    dependsOn: Task;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    projectId?: string;
    date: string | null;
    timeBlock: TimeBlock;
    isFloating?: boolean; // All-day task without specific time (like Google Calendar all-day events)
    scheduledHour?: number; // Specific hour (0-23) for timeline view
    scheduledMinute?: number; // Specific minute within hour (0, 15, 30, 45) for 15-min intervals
    startTime?: string | null; // Precise scheduled datetime for timeline panel
    order?: number;
    estimatedMinutes: number;
    estimatedDuration?: number; // Duration in minutes for timeline visual sizing
    actualMinutes?: number;
    completed?: boolean;
    completedAt?: string | null;
    startedAt?: string | null;
    status: TaskStatus;
    priority: Priority;
    energyLevel: EnergyLevel;
    icon: string;
    rolloverCount?: number;
    isTopPriority?: boolean;
    topPriorityDate?: string | null;
    subtasks: Subtask[];
    dependencies?: TaskDependency[];
    dependsOn: string[];
    dependents: string[];
    carriedOverFrom?: string;
    notes?: string;
    createdAt: string;
    aiGenerated?: boolean;
}

export interface DragItem {
    taskId: string;
    sourceDate: string | null;
    sourceTimeBlock: TimeBlock;
}

export interface AIBreakdownSuggestion {
    subtasks: { title: string; estimatedMinutes: number }[];
    totalEstimate: number;
    tips: string[];
}
