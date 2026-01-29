/**
 * RestartMyDayModal Component
 * Mid-day reset when things go sideways - reschedule incomplete tasks
 */

'use client';

import React, { useState, useMemo } from 'react';
import { RotateCcw, X, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Task, Project } from '@/types';
import { Theme } from '@/lib/themes';

interface RestartMyDayModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    projects: Project[];
    onRestart: (note?: string) => Promise<void>;
    theme?: Theme;
}

export function RestartMyDayModal({
    isOpen,
    onClose,
    tasks,
    projects,
    onRestart,
    theme,
}: RestartMyDayModalProps) {
    const [note, setNote] = useState('');
    const [includeNote, setIncludeNote] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);

    // Get today's incomplete tasks
    const incompleteTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        return tasks.filter(t =>
            t.date === todayStr &&
            t.status !== 'completed' &&
            t.timeBlock !== 'inbox'
        );
    }, [tasks]);

    // Get Top 3 priorities
    const topPriorities = useMemo(() => {
        return incompleteTasks.filter(t => t.isTopPriority);
    }, [incompleteTasks]);

    const handleRestart = async () => {
        setIsRestarting(true);
        try {
            await onRestart(includeNote ? note : undefined);
            onClose();
            setNote('');
            setIncludeNote(false);
        } catch (error) {
            console.error('Failed to restart day:', error);
        } finally {
            setIsRestarting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="px-6 py-4 text-white"
                    style={{
                        backgroundImage: `linear-gradient(to right, ${theme?.colors.primaryFrom || '#2563eb'}, ${theme?.colors.primaryTo || '#0891b2'})`
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <RotateCcw size={24} />
                            <h2 className="text-xl font-bold">Restart My Day</h2>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded p-1">
                            <X size={24} />
                        </button>
                    </div>
                    <p className="text-sm opacity-90 mt-1">
                        Things went sideways? Let's reset and refocus.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* What this will do */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 mb-2">What "Restart" does:</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                                        <span>Keeps your Top 3 priorities where they are</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Clock size={16} className="flex-shrink-0 mt-0.5" />
                                        <span>Reschedules {incompleteTasks.length - topPriorities.length} other task{incompleteTasks.length - topPriorities.length !== 1 ? 's' : ''} to available time slots</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <RotateCcw size={16} className="flex-shrink-0 mt-0.5" />
                                        <span>Fills from current time → evening (smart scheduling)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Task summary */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900">Tasks to reschedule:</h3>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                            {incompleteTasks.map(task => {
                                const project = projects.find(p => p.id === task.projectId);
                                const isTopPriority = task.isTopPriority;

                                return (
                                    <div
                                        key={task.id}
                                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                                            isTopPriority
                                                ? 'bg-purple-50 border border-purple-200'
                                                : 'bg-gray-50 border border-gray-200'
                                        }`}
                                    >
                                        {isTopPriority && <span className="text-purple-600">⭐</span>}
                                        {project && (
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: project.color }}
                                            />
                                        )}
                                        <span className="flex-1 truncate">{task.title}</span>
                                        <span className="text-xs text-gray-500">
                                            {task.estimatedMinutes || 30}m
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Optional note */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeNote}
                                onChange={(e) => setIncludeNote(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Add a note: "What threw me off?"
                            </span>
                        </label>
                        {includeNote && (
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g., 'Unexpected meeting', 'Got distracted by emails', 'Energy crash after lunch'..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                                autoFocus
                            />
                        )}
                        <p className="text-xs text-gray-500">
                            Optional: Track patterns in what derails your day
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRestart}
                            disabled={isRestarting}
                            className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundImage: isRestarting
                                    ? 'linear-gradient(to right, #9ca3af, #6b7280)'
                                    : `linear-gradient(to right, ${theme?.colors.primaryFrom || '#2563eb'}, ${theme?.colors.primaryTo || '#0891b2'})`
                            }}
                        >
                            {isRestarting ? 'Restarting...' : 'Restart My Day'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
