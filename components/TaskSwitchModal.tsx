/**
 * TaskSwitchModal Component
 * ADHD-friendly confirmation modal for switching between active tasks.
 * Replaces jarring window.confirm with a contextual, non-blocking modal.
 */

'use client';

import React from 'react';
import { Pause, Play, X, Timer } from 'lucide-react';
import { Task } from '@/types';

export interface TaskSwitchRequest {
    activeTask: Task;
    targetTask: Task;
    mode: 'start' | 'pomodoro';
}

interface TaskSwitchModalProps {
    isOpen: boolean;
    request: TaskSwitchRequest | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export function TaskSwitchModal({
    isOpen,
    request,
    onConfirm,
    onCancel,
}: TaskSwitchModalProps) {
    if (!isOpen || !request) return null;

    const { activeTask, targetTask, mode } = request;
    const actionText = mode === 'pomodoro' ? 'Start Pomodoro on' : 'Start';

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Pause className="w-5 h-5" />
                            <h2 className="font-semibold">Switch Tasks?</h2>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Currently working on */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Currently working on
                        </p>
                        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            <span className="font-medium text-gray-900 truncate">
                                {activeTask.title}
                            </span>
                        </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </div>

                    {/* Switch to */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {actionText}
                        </p>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            {mode === 'pomodoro' ? (
                                <Timer className="w-4 h-4 text-blue-600" />
                            ) : (
                                <Play className="w-4 h-4 text-blue-600" />
                            )}
                            <span className="font-medium text-gray-900 truncate">
                                {targetTask.title}
                            </span>
                        </div>
                    </div>

                    {/* Info text */}
                    <p className="text-sm text-gray-500 text-center">
                        Your current task will be paused, not lost.
                    </p>
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Keep Current
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {mode === 'pomodoro' ? (
                            <>
                                <Timer className="w-4 h-4" />
                                Switch & Start
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Switch Task
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
