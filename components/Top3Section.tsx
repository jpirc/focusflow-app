/**
 * Top3Section Component
 * Displays the user's Top 3 priorities for the day in a prominent, clean section
 * Collapsible to save space
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Star, Edit2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, Project } from '@/types';

interface Top3SectionProps {
    topPriorities: Task[];
    projects: Project[];
    onEdit: (task: Task) => void;
    onSetPriorities: () => void;
    onStatusChange: (taskId: string, status: 'completed' | 'in-progress') => void;
}

export function Top3Section({
    topPriorities,
    projects,
    onEdit,
    onSetPriorities,
    onStatusChange,
}: Top3SectionProps) {
    const [isExpanded, setIsExpanded] = useState(() => {
        // Load saved preference from localStorage
        const saved = localStorage.getItem('focusflow_top3_expanded');
        return saved !== null ? saved === 'true' : true; // Default to expanded
    });

    // Save preference when changed
    useEffect(() => {
        localStorage.setItem('focusflow_top3_expanded', String(isExpanded));
    }, [isExpanded]);

    const getProject = (projectId?: string) => projects.find(p => p.id === projectId);

    const completedCount = topPriorities.filter(t => t.status === 'completed').length;
    const hasAnyPriorities = topPriorities.length > 0;
    
    // Create array of exactly 3 slots, filling missing ones with null
    const prioritySlots = Array.from({ length: 3 }, (_, i) => topPriorities[i] || null);

    return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 mb-2 overflow-hidden">
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-2 hover:bg-white/30 transition-colors"
            >
                <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-purple-600 fill-purple-600" />
                    <h3 className="text-xs font-bold text-purple-900">
                        Top 3 Today
                    </h3>
                    {hasAnyPriorities && (
                        <span className="text-[10px] text-purple-600 font-medium">
                            {completedCount}/{topPriorities.length} ✓
                        </span>
                    )}
                    {!hasAnyPriorities && (
                        <span className="text-[10px] text-purple-500">
                            Not set
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {isExpanded && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onSetPriorities();
                            }}
                            className="text-[10px] text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-0.5 px-1 cursor-pointer"
                        >
                            <Edit2 size={10} />
                            Edit
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronUp size={14} className="text-purple-600" />
                    ) : (
                        <ChevronDown size={14} className="text-purple-600" />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="px-2 pb-2">
                    <div className="space-y-1.5">
                        {!hasAnyPriorities ? (
                            <button
                                onClick={onSetPriorities}
                                className="w-full text-left p-2 bg-white/50 rounded border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-white/70 transition-colors"
                            >
                                <p className="text-xs text-purple-600 font-medium">
                                    + Set your Top 3 priorities
                                </p>
                                <p className="text-[10px] text-purple-500 mt-0.5">
                                    Focus on what matters most today
                                </p>
                            </button>
                        ) : (
                            // Always show all 3 slots
                            prioritySlots.map((task, index) => {
                                if (!task) {
                                    // Empty slot - show placeholder
                                    return (
                                        <button
                                            key={`empty-${index}`}
                                            onClick={onSetPriorities}
                                            className="w-full flex items-center gap-2 p-1.5 bg-white/30 border-2 border-dashed border-purple-200 hover:border-purple-300 hover:bg-white/50 transition-all"
                                        >
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-purple-200 text-purple-400">
                                                {index + 1}
                                            </div>
                                            <span className="text-[10px] text-purple-400 italic">
                                                Add priority #{index + 1}
                                            </span>
                                        </button>
                                    );
                                }
                                
                                const project = getProject(task.projectId);
                                const isCompleted = task.status === 'completed';

                                return (
                                    <div
                                        key={task.id}
                                        className={`flex items-center gap-2 p-1.5 bg-white border transition-all ${
                                            isCompleted
                                                ? 'border-green-200 bg-green-50/50'
                                                : 'border-purple-200 hover:border-purple-300 hover:shadow-sm'
                                        }`}
                                    >
                                        {/* Priority number */}
                                        <div
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                                isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-purple-500 text-white'
                                            }`}
                                        >
                                            {isCompleted ? <Check size={12} /> : index + 1}
                                        </div>

                                        {/* Task content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                {project && (
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: project.color }}
                                                    />
                                                )}
                                                <span
                                                    className={`text-[10px] font-medium truncate ${
                                                        isCompleted
                                                            ? 'line-through text-gray-500'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {task.title}
                                                </span>
                                            </div>
                                            {task.estimatedMinutes && !isCompleted && (
                                                <span className="text-[9px] text-gray-500">
                                                    {task.estimatedMinutes}m
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {!isCompleted && (
                                            <div className="flex items-center gap-0.5">
                                                <button
                                                    onClick={() => onStatusChange(task.id, 'completed')}
                                                    className="p-0.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="Mark complete"
                                                >
                                                    <Check size={12} />
                                                </button>
                                                <button
                                                    onClick={() => onEdit(task)}
                                                    className="p-0.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                    title="Edit task"
                                                >
                                                    <Edit2 size={10} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {completedCount === 3 && (
                        <div className="mt-1.5 p-1.5 bg-green-100 border border-green-300 rounded text-center">
                            <p className="text-[10px] font-bold text-green-800">
                                🎉 All priorities complete!
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
