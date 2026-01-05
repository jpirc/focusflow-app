/**
 * RolloverNotification - Shows tasks that were automatically rolled over
 * Displays count, pattern warnings, and action buttons
 */

'use client';

import React, { useMemo } from 'react';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';
import { Task } from '@/types';

interface RolloverNotificationProps {
    rolledOverTasks: Array<{ id: string; title: string; originalDate: string | null }>;
    allTasks: Task[];
    onDismiss: () => void;
}

export function RolloverNotification({ rolledOverTasks, allTasks, onDismiss }: RolloverNotificationProps) {
    // Detect tasks with high rollover counts (pattern detection)
    const frequentRollovers = useMemo(() => {
        const taskMap = new Map(allTasks.map(t => [t.id, t]));
        return rolledOverTasks
            .map(rt => {
                const task = taskMap.get(rt.id);
                return task && (task.rolloverCount ?? 0) >= 3 ? { ...rt, count: task.rolloverCount ?? 0, task } : null;
            })
            .filter((t): t is NonNullable<typeof t> => t !== null);
    }, [rolledOverTasks, allTasks]);

    if (rolledOverTasks.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200 shadow-sm">
            <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            <RotateCcw size={18} className="text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    {rolledOverTasks.length} task{rolledOverTasks.length === 1 ? '' : 's'} rolled over from yesterday
                                </h3>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                                Incomplete tasks from previous days have been moved to today's "Anytime" block.
                            </p>

                            {/* Pattern Detection Warning */}
                            {frequentRollovers.length > 0 && (
                                <div className="bg-amber-100 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-amber-700 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-amber-900 mb-1">
                                                Pattern detected: {frequentRollovers.length} task{frequentRollovers.length === 1 ? ' has' : 's have'} been rolled over 3+ times
                                            </p>
                                            <div className="space-y-1">
                                                {frequentRollovers.slice(0, 3).map(task => (
                                                    <div key={task.id} className="text-xs text-amber-800">
                                                        <span className="font-medium">"{task.title}"</span>
                                                        {' '}– rolled over <span className="font-semibold">{task.count}×</span>
                                                        {' '}
                                                        <span className="text-amber-600">
                                                            Consider breaking down, delegating, or archiving
                                                        </span>
                                                    </div>
                                                ))}
                                                {frequentRollovers.length > 3 && (
                                                    <div className="text-xs text-amber-600 italic">
                                                        +{frequentRollovers.length - 3} more...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Task List (compact) */}
                            <div className="mt-2 space-y-1">
                                {rolledOverTasks.slice(0, 5).map(task => (
                                    <div key={task.id} className="text-xs text-gray-600">
                                        • {task.title}
                                        {task.originalDate && (
                                            <span className="text-gray-400 ml-1">
                                                (from {new Date(task.originalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {rolledOverTasks.length > 5 && (
                                    <div className="text-xs text-gray-500 italic">
                                        +{rolledOverTasks.length - 5} more tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title="Dismiss notification"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
