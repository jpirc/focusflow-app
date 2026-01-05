/**
 * Header Component - Navigation controls and action buttons
 */

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Flame, Pause, CheckCircle2 } from 'lucide-react';
import { addDays, getWeekStart } from '@/lib/utils/date';
import { VIEW_DAY_OPTIONS } from '@/lib/constants';

// Label mapping for view options
const VIEW_LABELS: Record<number, string> = {
    1: '1 Day',
    2: '2 Days',
    3: '3 Days',
    7: 'Week',
    30: 'Month',
};

interface HeaderProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    viewDays: number;
    onViewDaysChange: (days: number) => void;
    onAddTask: () => void;
    /** Today's completed task streak count */
    todayStreak?: number;
    /** Currently active task (in-progress) */
    activeTask?: { id: string; title: string; projectColor: string; elapsedMinutes: number } | null;
    /** Called when user pauses the active task */
    onPauseActiveTask?: () => void;
    /** Called when user completes the active task */
    onCompleteActiveTask?: () => void;
}

export function Header({
    currentDate,
    onDateChange,
    viewDays,
    onViewDaysChange,
    onAddTask,
    todayStreak = 0,
    activeTask,
    onPauseActiveTask,
    onCompleteActiveTask,
}: HeaderProps) {
    return (
        <>
        {/* Active Task Banner - PROMINENT NUDGE */}
        {activeTask && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between border-b-2 border-blue-700 shadow-lg animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                        <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Currently Working On</div>
                        <div className="text-sm font-bold">{activeTask.title}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-sm font-bold">{activeTask.elapsedMinutes}m</span>
                        <span className="text-xs opacity-75">elapsed</span>
                    </div>
                    {onPauseActiveTask && (
                        <button
                            onClick={onPauseActiveTask}
                            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                            title="Pause task"
                        >
                            <Pause size={14} />
                            Pause
                        </button>
                    )}
                    {onCompleteActiveTask && (
                        <button
                            onClick={onCompleteActiveTask}
                            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                            title="Complete task"
                        >
                            <CheckCircle2 size={14} />
                            Complete
                        </button>
                    )}
                </div>
            </div>
        )}
        <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* Today's Streak Counter */}
                {todayStreak > 0 && (
                    <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            todayStreak >= 5
                                ? 'bg-orange-100 text-orange-600 animate-streak-glow'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                        title={`${todayStreak} task${todayStreak > 1 ? 's' : ''} completed today!`}
                    >
                        <Flame size={14} className={todayStreak >= 5 ? 'text-orange-500' : 'text-gray-400'} />
                        <span>{todayStreak}</span>
                    </div>
                )}
                {/* Date Navigation */}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                        onClick={() => onDateChange(addDays(currentDate, -1))}
                        className="p-1 hover:bg-white rounded transition-all text-gray-600"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            onDateChange(today);
                        }}
                        className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white rounded transition-all"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => onDateChange(addDays(currentDate, 1))}
                        className="p-1 hover:bg-white rounded transition-all text-gray-600"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Current Month/Year */}
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <Calendar size={16} className="text-purple-500" />
                    {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </h2>
            </div>

            <div className="flex items-center gap-2">
                {/* View Days Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    {VIEW_DAY_OPTIONS.map(days => (
                        <button
                            key={days}
                            onClick={() => {
                                onViewDaysChange(days);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                // For 1-day, 2-day, and 3-day views, snap to today
                                // For week view, snap to start of week
                                if (days === 7) {
                                    onDateChange(getWeekStart(today));
                                } else if (days === 1 || days === 2 || days === 3) {
                                    onDateChange(today);
                                }
                            }}
                            className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                                viewDays === days
                                    ? 'bg-white shadow text-purple-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {VIEW_LABELS[days] || `${days}D`}
                        </button>
                    ))}
                </div>

                {/* Add Task Button */}
                <button
                    onClick={onAddTask}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm hover:shadow"
                >
                    <Plus size={14} />
                    Add Task
                </button>
            </div>
        </header>
        </>
    );
}
