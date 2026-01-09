/**
 * UpcomingDayColumn - Compact vertical day column for week overview
 * Shows as smaller drop targets next to the main day view
 */

'use client';

import React, { useState } from 'react';
import { Task, TimeBlock } from '@/types';
import { Theme } from '@/lib/themes';

interface UpcomingDayColumnProps {
    dateStr: string;
    dayName: string;
    fullDate: Date;
    taskCount: number;
    isWeekend?: boolean;
    isToday?: boolean;
    onDrop: (taskId: string, date: string, timeBlock: TimeBlock) => void;
    onClick: (date: Date) => void;
    theme?: Theme;
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
    theme,
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
                flex flex-col items-center justify-center p-2 border
                transition-all duration-200 cursor-pointer min-h-[60px]
                ${isDragOver 
                    ? 'scale-105 border-2' 
                    : isToday
                        ? 'bg-white hover:bg-gray-50/30'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                }
            `}
            style={{
                borderColor: isDragOver || isToday ? (theme?.colors.dragBorder || '#60a5fa') : undefined,
                backgroundColor: isDragOver ? (theme?.colors.dragBg || '#eff6ff') : undefined
            }}
        >
            {/* Day name */}
            <span 
                className="text-xs font-semibold"
                style={{
                    color: isDragOver || isToday ? (theme?.colors.primaryFrom || '#2563eb') : '#4b5563'
                }}
            >
                {isToday ? 'Today' : dayName}
            </span>
            
            {/* Date */}
            <span 
                className="text-[9px]"
                style={{ color: isToday ? (theme?.colors.primaryFrom || '#2563eb') : '#9ca3af' }}
            >
                {fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            
            {/* Task count badge */}
            {taskCount > 0 && (
                <div 
                    className="mt-1 px-1.5 py-0.5 rounded-full"
                    style={{
                        backgroundColor: isToday ? (theme?.colors.accentFrom || '#eff6ff') : '#f3f4f6'
                    }}
                >
                    <span 
                        className="text-[9px] font-medium"
                        style={{
                            color: isToday ? (theme?.colors.primaryFrom || '#2563eb') : '#6b7280'
                        }}
                    >
                        {taskCount}
                    </span>
                </div>
            )}
            
            {/* Drop hint */}
            {isDragOver && (
                <span 
                    className="mt-0.5 text-[9px] font-medium"
                    style={{ color: theme?.colors.primaryFrom || '#2563eb' }}
                >
                    Drop
                </span>
            )}
        </div>
    );
}
