/**
 * QuickWinSuggestions Component
 * Surface short tasks (< 15 min) for quick dopamine hits
 * Shows after completing tasks or when user needs momentum
 */

'use client';

import React from 'react';
import { Zap, Clock, Flame, ChevronRight, X, Play } from 'lucide-react';
import { Task, Project } from '@/types';
import { Theme } from '@/lib/themes';

interface QuickWinSuggestionsProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    projects: Project[];
    onSelectTask: (task: Task) => void;
    onStartTask: (taskId: string) => void;
    trigger?: 'completion' | 'manual' | 'low-energy';
    theme?: Theme;
}

export function QuickWinSuggestions({
    isOpen,
    onClose,
    tasks,
    projects,
    onSelectTask,
    onStartTask,
    trigger = 'manual',
    theme,
}: QuickWinSuggestionsProps) {
    if (!isOpen) return null;

    // Filter for quick win tasks: < 15 min, not completed, scheduled for today or unscheduled
    const today = new Date().toISOString().split('T')[0];
    const quickWinTasks = tasks
        .filter(t => 
            t.status !== 'completed' &&
            t.estimatedMinutes <= 15 &&
            (!t.date || t.date === today || new Date(t.date) < new Date())
        )
        .sort((a, b) => {
            // Sort by: blocking others first, then shortest time, then oldest
            const aBlocking = tasks.filter(t => 
                t.dependencies?.some(d => d.dependsOnId === a.id)
            ).length;
            const bBlocking = tasks.filter(t => 
                t.dependencies?.some(d => d.dependsOnId === b.id)
            ).length;
            
            if (aBlocking !== bBlocking) return bBlocking - aBlocking;
            if (a.estimatedMinutes !== b.estimatedMinutes) {
                return a.estimatedMinutes - b.estimatedMinutes;
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        })
        .slice(0, 5); // Show top 5

    const getProject = (projectId?: string) => 
        projects.find(p => p.id === projectId);

    const getMessage = () => {
        switch (trigger) {
            case 'completion':
                return {
                    title: "Nice! Here's another quick one... 🎯",
                    subtitle: "Keep the momentum going with a task under 15 minutes"
                };
            case 'low-energy':
                return {
                    title: "Need a quick win? ⚡",
                    subtitle: "These short tasks are perfect when energy is low"
                };
            default:
                return {
                    title: "Quick Wins Available 💨",
                    subtitle: "Knock out these short tasks (under 15 minutes)"
                };
        }
    };

    const message = getMessage();

    if (quickWinTasks.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={onClose}>
                <div
                    className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 text-gray-900 p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-center">
                        <div className="mb-4">🎉</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">All Quick Wins Done!</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            You&apos;ve completed all your short tasks. Great work!
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                        >
                            Awesome!
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 text-gray-900"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{message.title}</h2>
                        <p className="text-sm text-gray-600 mt-0.5">{message.subtitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Quick Win Tasks */}
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                    {quickWinTasks.map((task, index) => {
                        const project = getProject(task.projectId);
                        const isBlocking = tasks.filter(t => 
                            t.dependencies?.some(d => d.dependsOnId === task.id)
                        ).length;

                        return (
                            <div
                                key={task.id}
                                className="group border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Rank Badge */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {index + 1}
                                    </div>

                                    {/* Task Info */}
                                    <div className="flex-1 min-w-0">
                                        <div 
                                            className="cursor-pointer"
                                            onClick={() => {
                                                onSelectTask(task);
                                                onClose();
                                            }}
                                        >
                                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                                                {task.title}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-gray-600">
                                            {/* Time Estimate */}
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} className="text-blue-500" />
                                                <span className="font-medium text-blue-600">
                                                    {task.estimatedMinutes} min
                                                </span>
                                            </div>

                                            {/* Project */}
                                            {project && (
                                                <div className="flex items-center gap-1">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: project.color }}
                                                    />
                                                    <span>{project.name}</span>
                                                </div>
                                            )}

                                            {/* Energy Level */}
                                            <div className="flex items-center gap-1">
                                                {task.energyLevel === 'high' && (
                                                    <>
                                                        <Flame size={12} className="text-orange-500" />
                                                        <span>High energy</span>
                                                    </>
                                                )}
                                                {task.energyLevel === 'medium' && (
                                                    <>
                                                        <Zap size={12} className="text-yellow-500" />
                                                        <span>Medium energy</span>
                                                    </>
                                                )}
                                                {task.energyLevel === 'low' && (
                                                    <>
                                                        <Zap size={12} className="text-green-500" />
                                                        <span>Low energy</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Blocking Badge */}
                                            {isBlocking > 0 && (
                                                <div className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                                                    Unblocks {isBlocking}
                                                </div>
                                            )}
                                        </div>

                                        {/* Start Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStartTask(task.id);
                                                onClose();
                                            }}
                                            className="mt-2 w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                        >
                                            <Play size={16} />
                                            Start Now
                                        </button>
                                    </div>

                                    <ChevronRight 
                                        size={16} 
                                        className="text-gray-400 hover:text-blue-500 transition-colors mt-1 flex-shrink-0 cursor-pointer" 
                                        onClick={() => {
                                            onSelectTask(task);
                                            onClose();
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <p className="text-xs text-gray-600">
                        💡 Tip: Quick wins build momentum and boost dopamine!
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}
