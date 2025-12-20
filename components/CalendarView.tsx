/**
 * CalendarView Component - Monthly calendar grid with task badges
 */

'use client';

import React, { useMemo, useState } from 'react';
import { Task, Project, TimeBlock, DragItem } from '@/types';
import { formatDate, isToday, isWeekend } from '@/lib/utils/date';
import { CheckCircle2 } from 'lucide-react';

interface CalendarViewProps {
    currentDate: Date;
    tasks: Task[];
    projects: Project[];
    selectedProjectId: string | null;
    selectedTaskId: string | null;
    onSelectTask: (id: string) => void;
    onDrop: (taskId: string, targetDate: string, targetBlock: TimeBlock) => void;
    onEdit: (task: Task) => void;
}

interface CalendarDay {
    date: Date;
    dateStr: string;
    dayOfMonth: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    tasks: Task[];
}

export function CalendarView({
    currentDate,
    tasks,
    projects,
    selectedProjectId,
    selectedTaskId,
    onSelectTask,
    onDrop,
    onEdit,
}: CalendarViewProps) {
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        
        // Start from Sunday of the first week
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // End on Saturday of the last week
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
        
        const days: CalendarDay[] = [];
        const current = new Date(startDate);
        
        while (current <= endDate) {
            const dateStr = formatDate(current);
            const dayTasks = tasks.filter(t =>
                formatDate(t.date!) === dateStr &&
                t.status !== 'completed' &&
                (!selectedProjectId || t.projectId === selectedProjectId)
            );
            
            days.push({
                date: new Date(current),
                dateStr,
                dayOfMonth: current.getDate(),
                isCurrentMonth: current.getMonth() === month,
                isToday: isToday(dateStr),
                isWeekend: isWeekend(current),
                tasks: dayTasks,
            });
            
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    }, [currentDate, tasks, selectedProjectId]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getProjectColor = (projectId?: string) => {
        if (!projectId) return '#6b7280';
        const project = projects.find(p => p.id === projectId);
        return project?.color || '#6b7280';
    };

    const handleDragOver = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverDate(dateStr);
    };

    const handleDrop = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        setDragOverDate(null);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) {
            onDrop(taskId, dateStr, 'anytime');
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Week day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {weekDays.map((day, i) => (
                    <div
                        key={day}
                        className={`px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wider ${
                            i === 0 || i === 6 ? 'text-amber-600' : 'text-gray-500'
                        }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {calendarDays.map((day) => (
                    <div
                        key={day.dateStr}
                        className={`border-b border-r border-gray-100 p-0.5 min-h-[80px] transition-colors ${
                            !day.isCurrentMonth ? 'bg-gray-50/50' : ''
                        } ${day.isWeekend ? 'bg-amber-50/30' : ''} ${
                            day.isToday ? 'bg-purple-50' : ''
                        } ${dragOverDate === day.dateStr ? 'bg-purple-100 ring-2 ring-purple-400 ring-inset' : ''}`}
                        onDragOver={(e) => handleDragOver(e, day.dateStr)}
                        onDragLeave={() => setDragOverDate(null)}
                        onDrop={(e) => handleDrop(e, day.dateStr)}
                    >
                        {/* Day number */}
                        <div className={`text-[10px] font-medium px-1 py-0.5 ${
                            day.isToday
                                ? 'text-purple-600 font-bold'
                                : !day.isCurrentMonth
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                        }`}>
                            {day.isToday ? (
                                <span className="bg-purple-600 text-white rounded-full px-1.5 py-0.5">
                                    {day.dayOfMonth}
                                </span>
                            ) : (
                                day.dayOfMonth
                            )}
                        </div>

                        {/* Task badges */}
                        <div className="space-y-0.5 mt-0.5">
                            {day.tasks.slice(0, 4).map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.effectAllowed = 'move';
                                        e.dataTransfer.setData('text/plain', task.id);
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectTask(task.id);
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(task);
                                    }}
                                    className={`px-1 py-0.5 rounded text-[9px] leading-tight truncate cursor-pointer transition-all hover:opacity-80 ${
                                        selectedTaskId === task.id ? 'ring-1 ring-purple-400' : ''
                                    }`}
                                    style={{
                                        backgroundColor: getProjectColor(task.projectId) + '20',
                                        borderLeft: `2px solid ${getProjectColor(task.projectId)}`,
                                        color: '#374151',
                                    }}
                                    title={task.title}
                                >
                                    {task.status === 'in-progress' && (
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-0.5 animate-pulse" />
                                    )}
                                    {task.title}
                                </div>
                            ))}
                            {day.tasks.length > 4 && (
                                <div className="text-[9px] text-gray-400 px-1">
                                    +{day.tasks.length - 4} more
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
