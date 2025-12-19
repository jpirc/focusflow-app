/**
 * UpcomingDayColumn - Compact vertical day column for week overview
 * Shows as smaller drop targets next to the main day view
 */

'use client';

import React, { useState } from 'react';
import { Task, TimeBlock } from '@/types';

interface UpcomingDayColumnProps {
    dateStr: string;
    dayName: string;
    fullDate: Date;
    taskCount: number;
    isWeekend?: boolean;
    isToday?: boolean;
    onDrop: (taskId: string, date: string, timeBlock: TimeBlock) => void;
    onClick: (date: Date) => void;
}

export function UpcomingDayColumn({ 
    dateStr, 
    dayName, 
    fullDate, 
    taskCount,
    isWeekend = false,
    isToday = false,
    onDrop,
    onClick,
}: UpcomingDayColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) {
            // Drop to 'anytime' block by default
            onDrop(taskId, dateStr, 'anytime');
        }
    };

    return (
        <div
            onClick={() => onClick(fullDate)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                flex flex-col items-center justify-center p-2 rounded-lg border
                transition-all duration-200 cursor-pointer min-h-[60px]
                ${isDragOver 
                    ? 'border-purple-400 bg-purple-50 scale-105 border-2' 
                    : isToday
                        ? 'border-purple-400 bg-white hover:bg-purple-50/30'
                        : isWeekend
                            ? 'border-gray-200 bg-white hover:bg-gray-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                }
            `}
        >
            {/* Day name */}
            <span className={`text-xs font-semibold ${
                isDragOver ? 'text-purple-600' : isToday ? 'text-purple-600' : 'text-gray-600'
            }`}>
                {isToday ? 'Today' : dayName}
            </span>
            
            {/* Date */}
            <span className={`text-[9px] ${isToday ? 'text-purple-400' : 'text-gray-400'}`}>
                {fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            
            {/* Task count badge */}
            {taskCount > 0 && (
                <div className={`mt-1 px-1.5 py-0.5 rounded-full ${isToday ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    <span className={`text-[9px] font-medium ${isToday ? 'text-purple-600' : 'text-gray-500'}`}>
                        {taskCount}
                    </span>
                </div>
            )}
            
            {/* Drop hint */}
            {isDragOver && (
                <span className="mt-0.5 text-[9px] text-purple-500 font-medium">
                    Drop
                </span>
            )}
        </div>
    );
}
