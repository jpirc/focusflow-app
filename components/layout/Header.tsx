/**
 * Header Component - Navigation controls and action buttons
 */

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Brain, Plus } from 'lucide-react';
import { addDays } from '@/lib/utils/date';
import { VIEW_DAY_OPTIONS } from '@/lib/constants';

interface HeaderProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    viewDays: number;
    onViewDaysChange: (days: number) => void;
    onSmartCapture: () => void;
    onNewTask: () => void;
}

export function Header({
    currentDate,
    onDateChange,
    viewDays,
    onViewDaysChange,
    onSmartCapture,
    onNewTask,
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
                        onClick={() => onDateChange(new Date())}
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
                            onClick={() => onViewDaysChange(days)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                viewDays === days
                                    ? 'bg-white shadow text-purple-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {days} Day{days !== 1 ? 's' : ''}
                        </button>
                    ))}
                </div>

                {/* Smart Capture Button */}
                <button
                    onClick={onSmartCapture}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow"
                >
                    <Brain size={18} />
                    Smart Capture
                </button>

                {/* New Task Button */}
                <button
                    onClick={onNewTask}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
                >
                    <Plus size={18} />
                    New Task
                </button>
            </div>
        </header>
    );
}
