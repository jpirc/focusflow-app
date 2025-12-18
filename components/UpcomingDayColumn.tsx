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
    onDrop: (taskId: string, date: string, timeBlock: TimeBlock) => void;
    onClick: (date: Date) => void;
}

export function UpcomingDayColumn({ 
    dateStr, 
    dayName, 
    fullDate, 
    taskCount,
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
                flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed
                transition-all duration-200 cursor-pointer min-h-[80px]
                ${isDragOver 
                    ? 'border-purple-400 bg-purple-50 scale-105' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }
            `}
        >
            {/* Day name */}
            <span className={`text-sm font-semibold ${isDragOver ? 'text-purple-600' : 'text-gray-700'}`}>
                {dayName}
            </span>
            
            {/* Date */}
            <span className="text-[10px] text-gray-400">
                {fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            
            {/* Task count badge */}
            {taskCount > 0 && (
                <div className="mt-2 px-2 py-0.5 bg-gray-200 rounded-full">
                    <span className="text-[10px] font-medium text-gray-600">
                        {taskCount} task{taskCount !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
            
            {/* Drop hint */}
            {isDragOver && (
                <span className="mt-1 text-[10px] text-purple-500 font-medium">
                    Drop here
                </span>
            )}
        </div>
    );
}
