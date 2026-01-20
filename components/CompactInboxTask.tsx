/**
 * CompactInboxTask - Minimal task display for sidebar inbox
 */

'use client';

import React, { useState } from 'react';
import { Play, GripVertical, FileText, Link2, ChevronDown, ChevronRight } from 'lucide-react';
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
    onDelete: (id: string) => void;
}

export function CompactInboxTask({ 
    task, 
    project, 
    isSelected = false,
    onSelect,
    onStartDrag,
    onEdit,
    onDelete,
}: CompactInboxTaskProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

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

    const energyColors = {
        low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
        medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
        high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    };

    const hasDescription = !!task.description;
    const hasDependencies = task.dependencies && task.dependencies.length > 0;

    return (
        <div className="relative">
            {/* Hover tooltip */}
            {showTooltip && !isExpanded && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-gray-900 text-white text-xs rounded px-2 py-1.5 shadow-lg max-w-xs whitespace-normal">
                    <div className="font-medium mb-0.5">{task.title}</div>
                    {task.estimatedMinutes && (
                        <div className="text-gray-300">⏱️ {task.estimatedMinutes} min</div>
                    )}
                    {project && (
                        <div className="text-gray-300">📁 {project.name}</div>
                    )}
                </div>
            )}

            <div
                draggable
                onDragStart={handleDragStart}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`
                    group flex items-center gap-1.5 px-2 py-1.5 rounded
                    hover:bg-gray-50 cursor-pointer transition-colors
                    ${isSelected ? 'bg-purple-50 ring-1 ring-purple-200' : ''}
                    ${isExpanded ? 'bg-gray-50' : ''}
                `}
            >
                {/* Expand/collapse indicator */}
                <div className="flex-shrink-0 text-gray-400">
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>

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

                {/* Task title with visual cues */}
                <span className="flex-1 text-xs text-gray-700 truncate min-w-0 font-medium flex items-center gap-1">
                    {task.title}
                    {hasDescription && (
                        <FileText size={10} className="text-gray-400 flex-shrink-0" />
                    )}
                    {hasDependencies && (
                        <Link2 size={10} className="text-gray-400 flex-shrink-0" />
                    )}
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

            {/* Expanded details */}
            {isExpanded && (
                <div className="px-2 pb-2 pt-1 bg-gray-50 rounded-b border-l-2 border-gray-200 ml-6 space-y-1.5">
                    {/* Description */}
                    {task.description && (
                        <div className="text-[11px] text-gray-600 leading-relaxed">
                            {task.description}
                        </div>
                    )}

                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {/* Project */}
                        {project && (
                            <span className="px-1.5 py-0.5 rounded" style={{ 
                                backgroundColor: project.bgColor,
                                color: project.color 
                            }}>
                                {project.icon} {project.name}
                            </span>
                        )}

                        {/* Energy level */}
                        <span className={`px-1.5 py-0.5 rounded border ${energyColors[task.energyLevel].bg} ${energyColors[task.energyLevel].text} ${energyColors[task.energyLevel].border}`}>
                            {task.energyLevel === 'low' && '🔋 Low'}
                            {task.energyLevel === 'medium' && '⚡ Medium'}
                            {task.energyLevel === 'high' && '🔥 High'}
                        </span>

                        {/* Priority */}
                        <span className={`px-1.5 py-0.5 rounded bg-gray-100 ${priorityColor}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(task);
                            }}
                            className="text-[10px] text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Edit details →
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${task.title}"?`)) {
                                    onDelete(task.id);
                                }
                            }}
                            className="text-[10px] text-red-600 hover:text-red-700 font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
