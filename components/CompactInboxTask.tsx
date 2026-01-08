/**
 * CompactInboxTask - Minimal task display for sidebar inbox
 */

'use client';

import React from 'react';
import { Play, GripVertical } from 'lucide-react';
import { Task, Project } from '@/types';

const iconMap: Record<string, string> = {
    coffee: '☕', briefcase: '💼', home: '🏠', heart: '❤️', 
    dumbbell: '💪', book: '📚', target: '🎯', rocket: '🚀',
    // Add more as needed
};

interface CompactInboxTaskProps {
    task: Task;
    project?: Project;
    isSelected?: boolean;
    onSelect: (id: string) => void;
    onStartDrag: (item: any) => void;
    onEdit: (task: Task) => void;
}

export function CompactInboxTask({ 
    task, 
    project, 
    isSelected = false,
    onSelect,
    onStartDrag,
    onEdit,
}: CompactInboxTaskProps) {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        onStartDrag({ type: 'task', id: task.id, task });
    };

    const priorityColor = {
        low: 'text-slate-400',
        medium: 'text-blue-500',
        high: 'text-orange-500',
        urgent: 'text-red-500',
    }[task.priority];

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={() => onEdit(task)}
            className={`
                group flex items-center gap-1.5 px-2 py-1.5 rounded
                hover:bg-gray-50 cursor-pointer transition-colors
                ${isSelected ? 'bg-purple-50 ring-1 ring-purple-200' : ''}
            `}
        >
            {/* Drag handle */}
            <button
                className="opacity-0 group-hover:opacity-40 hover:opacity-100 text-gray-400 cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <GripVertical size={12} />
            </button>

            {/* Play button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(task.id);
                }}
                className="flex-shrink-0 p-0.5 text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded transition-colors"
                title="Start task"
            >
                <Play size={11} />
            </button>

            {/* Project color dot */}
            {project && (
                <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: project.color }}
                />
            )}

            {/* Task title */}
            <span className="flex-1 text-xs text-gray-700 truncate min-w-0 font-medium">
                {task.title}
            </span>

            {/* Time estimate */}
            {task.estimatedMinutes && (
                <span className="flex-shrink-0 text-[10px] text-gray-500">
                    {task.estimatedMinutes}m
                </span>
            )}

            {/* Priority indicator */}
            {(task.priority === 'high' || task.priority === 'urgent') && (
                <span className={`flex-shrink-0 text-xs ${priorityColor}`}>
                    •
                </span>
            )}
        </div>
    );
}
