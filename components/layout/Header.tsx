/**
 * Header Component - Navigation controls and action buttons
 */

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { addDays, getWeekStart } from '@/lib/utils/date';
import { VIEW_DAY_OPTIONS } from '@/lib/constants';

// Label mapping for view options
const VIEW_LABELS: Record<number, string> = {
    1: '1 Day',
    3: '3 Days',
    7: 'Week',
};

interface HeaderProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    viewDays: number;
    onViewDaysChange: (days: number) => void;
    onAddTask: () => void;
}

export function Header({
    currentDate,
    onDateChange,
    viewDays,
    onViewDaysChange,
    onAddTask,
}: HeaderProps) {
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {/* Date Navigation */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => onDateChange(addDays(currentDate, -1))}
                        className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:shadow text-gray-600"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            onDateChange(today);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white rounded-md transition-all"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => onDateChange(addDays(currentDate, 1))}
                        className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:shadow text-gray-600"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Current Month/Year */}
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar size={20} className="text-purple-500" />
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
            </div>

            <div className="flex items-center gap-3">
                {/* View Days Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    {VIEW_DAY_OPTIONS.map(days => (
                        <button
                            key={days}
                            onClick={() => {
                                onViewDaysChange(days);
                                // For week view, snap to start of week
                                if (days === 7) {
                                    onDateChange(getWeekStart(currentDate));
                                }
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                viewDays === days
                                    ? 'bg-white shadow text-purple-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {VIEW_LABELS[days] || `${days} Days`}
                        </button>
                    ))}
                </div>

                {/* Add Task Button */}
                <button
                    onClick={onAddTask}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow"
                >
                    <Plus size={18} />
                    Add Task
                </button>
            </div>
        </header>
    );
}
