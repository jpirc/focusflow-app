/**
 * DailyPrioritiesModal Component
 * Select up to 3 tasks to focus on today
 */

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Star, X, Check, Target } from 'lucide-react';
import { Task, Project } from '@/types';

interface DailyPrioritiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    projects: Project[];
    onSetTopPriorities: (taskIds: string[]) => void;
    existingTopPriorities: string[];
}

export function DailyPrioritiesModal({
    isOpen,
    onClose,
    tasks,
    projects,
    onSetTopPriorities,
    existingTopPriorities,
}: DailyPrioritiesModalProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const wasOpen = useRef(false);
    
    // Initialize selections only when modal transitions from closed to open
    useEffect(() => {
        if (isOpen && !wasOpen.current) {
            // Modal just opened - load current priorities
            setSelectedIds([...existingTopPriorities]);
        }
        wasOpen.current = isOpen;
    }, [isOpen, existingTopPriorities]);

    // All open (non-completed) tasks available for selection
    const availableTasks = useMemo(() => {
        return tasks
            .filter(t => t.status !== 'completed')
            .sort((a, b) => {
                const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                const aPriority = priorityOrder[a.priority] ?? 2;
                const bPriority = priorityOrder[b.priority] ?? 2;
                if (aPriority !== bPriority) return aPriority - bPriority;
                if (a.date && !b.date) return -1;
                if (!a.date && b.date) return 1;
                return 0;
            });
    }, [tasks]);

    const toggleTask = (taskId: string) => {
        setSelectedIds(prev => {
            if (prev.includes(taskId)) {
                // Deselect
                return prev.filter(id => id !== taskId);
            }
            if (prev.length >= 3) {
                // Max 3 - replace oldest
                return [...prev.slice(1), taskId];
            }
            // Add new selection
            return [...prev, taskId];
        });
    };

    const handleSave = () => {
        onSetTopPriorities(selectedIds);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target size={24} />
                            <h2 className="text-xl font-bold">Top 3 Focus Tasks</h2>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded p-1">
                            <X size={24} />
                        </button>
                    </div>
                    <p className="text-sm text-white/90 mt-1">
                        Select up to 3 tasks to focus on ({selectedIds.length}/3 selected)
                    </p>
                </div>

                {/* Task List */}
                <div className="px-6 py-4 max-h-96 overflow-y-auto">
                    {availableTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No open tasks available.</p>
                            <p className="text-sm mt-1">Create some tasks to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableTasks.map(task => {
                                const isSelected = selectedIds.includes(task.id);
                                const selectionIndex = selectedIds.indexOf(task.id);
                                const project = projects.find(p => p.id === task.projectId);

                                return (
                                    <button
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                            isSelected
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {/* Selection indicator */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            isSelected
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {isSelected ? (
                                                <span className="font-bold">{selectionIndex + 1}</span>
                                            ) : (
                                                <Star size={16} />
                                            )}
                                        </div>

                                        {/* Task details */}
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center gap-2">
                                                {project && (
                                                    <div
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: project.color }}
                                                    />
                                                )}
                                                <span className={`font-medium truncate ${isSelected ? 'text-purple-900' : 'text-gray-800'}`}>
                                                    {task.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                {task.date ? (
                                                    <span className="capitalize">{task.timeBlock}</span>
                                                ) : (
                                                    <span className="text-amber-600">Inbox</span>
                                                )}
                                                {task.estimatedMinutes && (
                                                    <span>• {task.estimatedMinutes}m</span>
                                                )}
                                                {task.priority !== 'medium' && (
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                        task.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                                                        task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {task.priority}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Check indicator */}
                                        {isSelected && (
                                            <Check size={20} className="text-purple-500 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
