import React from 'react';

export type TimeBlock = 'anytime' | 'morning' | 'afternoon' | 'evening';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'skipped' | 'carried-over';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface TimeBlockConfig {
    id: TimeBlock;
    label: string;
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

export interface Task {
    id: string;
    title: string;
    description?: string;
    projectId?: string;
    date: string | null;
    timeBlock: TimeBlock;
    estimatedMinutes: number;
    actualMinutes?: number;
    completed?: boolean;
    status: TaskStatus;
    priority: Priority;
    energyLevel: EnergyLevel;
    icon: string;
    subtasks: Subtask[];
    dependencies?: any[];
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
