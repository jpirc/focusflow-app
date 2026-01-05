/**
 * DailyPrioritiesModal Component
 * Morning prompt to set Top 3 priorities for the day
 * Helps ADHD users focus by forcing prioritization
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Star, X, Check, Target, Sparkles } from 'lucide-react';
import { Task, Project } from '@/types';

interface DailyPrioritiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    projects: Project[];
    todayDateStr: string;
    onSetTopPriorities: (taskIds: string[]) => void;
    existingTopPriorities: string[];
}

export function DailyPrioritiesModal({
    isOpen,
    onClose,
    tasks,
    projects,
    todayDateStr,
    onSetTopPriorities,
    existingTopPriorities,
}: DailyPrioritiesModalProps) {
    // Selected task IDs (max 3)
    const [selectedIds, setSelectedIds] = useState<string[]>(existingTopPriorities);

    // Filter to show only today's pending/in-progress tasks + inbox tasks
    const availableTasks = useMemo(() => {
        return tasks.filter(t =>
            t.status !== 'completed' &&
            !t.subtasks?.length && // Don't show subtasks
            (t.date === todayDateStr || t.date === null) // Today or inbox
        ).sort((a, b) => {
            // Sort by: priority first, then by whether it's scheduled
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            const aPriority = priorityOrder[a.priority] ?? 2;
            const bPriority = priorityOrder[b.priority] ?? 2;
            if (aPriority !== bPriority) return aPriority - bPriority;
            // Scheduled tasks before inbox
            if (a.date && !b.date) return -1;
            if (!a.date && b.date) return 1;
            return 0;
        });
    }, [tasks, todayDateStr]);

    const toggleTask = (taskId: string) => {
        setSelectedIds(prev => {
            if (prev.includes(taskId)) {
                return prev.filter(id => id !== taskId);
            }
            if (prev.length >= 3) {
                // Replace the oldest selection with the new one
                return [...prev.slice(1), taskId];
            }
            return [...prev, taskId];
        });
    };

    const handleConfirm = () => {
        onSetTopPriorities(selectedIds);
        onClose();
    };

    const handleSkip = () => {
        // Close without setting any priorities
        onClose();
    };

    if (!isOpen) return null;

    const getProject = (projectId?: string) => projects.find(p => p.id === projectId);

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
                            <h2 className="text-lg font-bold">Set Your Top 3</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-white/80 mt-1">
                        What are the 3 most important things to accomplish today?
                    </p>
                </div>

                {/* Task Selection */}
                <div className="p-4 max-h-[400px] overflow-y-auto">
                    {availableTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Sparkles size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No tasks for today yet.</p>
                            <p className="text-xs mt-1">Add some tasks first, then set your priorities!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableTasks.map((task, index) => {
                                const isSelected = selectedIds.includes(task.id);
                                const selectionIndex = selectedIds.indexOf(task.id);
                                const project = getProject(task.projectId);

                                return (
                                    <button
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                            isSelected
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        {/* Selection indicator */}
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            isSelected
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {isSelected ? (
                                                <span className="font-bold text-sm">{selectionIndex + 1}</span>
                                            ) : (
                                                <Star size={14} />
                                            )}
                                        </div>

                                        {/* Task details */}
                                        <div className="flex-1 min-w-0">
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
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                                {task.date ? (
                                                    <span className="capitalize">{task.timeBlock}</span>
                                                ) : (
                                                    <span className="text-amber-600">Inbox</span>
                                                )}
                                                {task.estimatedMinutes && (
                                                    <span>{task.estimatedMinutes}m</span>
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
                                            <Check size={18} className="text-purple-500 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            {selectedIds.length === 0 ? (
                                'Select up to 3 priorities'
                            ) : selectedIds.length === 3 ? (
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <Check size={14} /> All 3 selected!
                                </span>
                            ) : (
                                `${selectedIds.length} of 3 selected`
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSkip}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Skip for now
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={selectedIds.length === 0}
                                className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <Star size={14} />
                                Set Top {selectedIds.length || 3}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
