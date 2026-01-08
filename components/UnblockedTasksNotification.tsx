/**
 * UnblockedTasksNotification - Celebrates when tasks become unblocked
 * Shows when dependencies are completed and tasks are ready to work on
 */

'use client';

import React from 'react';
import { CheckCircle2, X, PartyPopper, ArrowRight, Calendar } from 'lucide-react';
import { Task } from '@/types';
import { formatDate } from '@/lib/utils/date';

interface UnblockedTasksNotificationProps {
    unblockedTasks: Array<{ task: Task; completedDependency: string }>;
    onDismiss: () => void;
    onMoveToToday: (taskId: string) => void;
}

export function UnblockedTasksNotification({ 
    unblockedTasks, 
    onDismiss, 
    onMoveToToday 
}: UnblockedTasksNotificationProps) {
    if (unblockedTasks.length === 0) return null;

    const today = formatDate(new Date());

    return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200 shadow-sm">
            <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                            <PartyPopper size={18} className="text-green-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    🎉 {unblockedTasks.length} task{unblockedTasks.length === 1 ? ' is' : 's are'} now unblocked!
                                </h3>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                                Dependencies completed—these tasks are ready to work on.
                            </p>

                            {/* Unblocked Tasks List */}
                            <div className="space-y-2">
                                {unblockedTasks.map(({ task, completedDependency }) => {
                                    const isScheduled = task.date && task.date !== today;
                                    return (
                                        <div 
                                            key={task.id} 
                                            className="bg-white border border-green-200 px-3 py-2"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">
                                                        Unblocked by: <span className="font-medium">{completedDependency}</span>
                                                    </p>
                                                    {isScheduled && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                            <Calendar size={10} />
                                                            Scheduled for {new Date(task.date!).toLocaleDateString('en-US', { 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                {isScheduled && (
                                                    <button
                                                        onClick={() => onMoveToToday(task.id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors flex-shrink-0"
                                                    >
                                                        <ArrowRight size={12} />
                                                        Move to Today
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
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
