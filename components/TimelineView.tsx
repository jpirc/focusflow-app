/**
 * TimelineView - Hour-based vertical timeline for ADHD-friendly task scheduling
 * Replaces abstract time blocks with concrete hourly grid showing:
 * - Hour markers (6am-10pm default)
 * - Current time indicator ("NOW")
 * - Visual time block regions (morning/afternoon/evening)
 * - Capacity visualization per block
 * - Tasks positioned at scheduled hours
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Project, Subtask, TaskStatus, TimeBlock, DragItem } from '@/types';
import { QuickEditTaskCard } from './QuickEditTaskCard';
import { Theme } from '@/lib/themes';
import { getTodayInTimezone, getCurrentHourInTimezone } from '@/lib/utils/timezone';

interface TimelineViewProps {
    tasks: Task[];
    allTasks: Task[];
    projects: Project[];
    date: string;
    selectedTaskId: string | null;
    onSelectTask: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onPause: (id: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onStartDrag: (item: DragItem) => void;
    onDrop: (taskId: string, targetDate: string, targetBlock: TimeBlock, insertBeforeTaskId?: string) => void;
    onDelete: (id: string) => void;
    onAIBreakdown: (task: Task) => void;
    onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
    onEdit: (task: Task) => void;
    onStartPomodoro?: (task: Task) => void;
    hourStart?: number; // Default 6 (6am)
    hourEnd?: number; // Default 22 (10pm)
    compact?: boolean;
    subtasksExpandedAll?: boolean;
    theme?: Theme;
}

// Time block configurations for visual regions
const TIME_BLOCK_REGIONS = {
    morning: {
        label: 'Morning',
        start: 6,
        end: 12,
        color: 'rgba(251, 191, 36, 0.08)', // Warm yellow tint
        borderColor: 'rgba(251, 191, 36, 0.2)',
    },
    afternoon: {
        label: 'Afternoon',
        start: 12,
        end: 18,
        color: 'rgba(59, 130, 246, 0.08)', // Blue tint
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    evening: {
        label: 'Evening',
        start: 18,
        end: 22,
        color: 'rgba(139, 92, 246, 0.08)', // Purple tint
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
};

// Helper: Get scheduled hour for a task (fallback to time block default)
const getScheduledHour = (task: Task): number => {
    if (task.scheduledHour !== undefined && task.scheduledHour !== null) {
        return task.scheduledHour;
    }
    
    // Fallback to time block defaults
    switch (task.timeBlock) {
        case 'morning': return 9;
        case 'afternoon': return 14;
        case 'evening': return 19;
        case 'anytime': return 23; // Show at bottom
        default: return 9;
    }
};

export const TimelineView: React.FC<TimelineViewProps> = ({
    tasks,
    allTasks,
    projects,
    date,
    selectedTaskId,
    onSelectTask,
    onUpdate,
    onStatusChange,
    onPause,
    onToggleSubtask,
    onStartDrag,
    onDrop,
    onDelete,
    onAIBreakdown,
    onUpdateSubtasks,
    onEdit,
    onStartPomodoro,
    hourStart = 6,
    hourEnd = 22,
    compact = false,
    subtasksExpandedAll = true,
    theme,
}) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isDragOver, setIsDragOver] = useState(false);
    const [hasScrolledToNow, setHasScrolledToNow] = useState(false);

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll to current time on mount (only for today)
    useEffect(() => {
        if (hasScrolledToNow || !timelineRef.current) return;
        
        const today = getTodayInTimezone();
        if (date !== today) return; // Only auto-scroll for today
        
        const currentHour = getCurrentHourInTimezone();
        if (currentHour < hourStart || currentHour > hourEnd) return;
        
        // Scroll to current time marker
        const hoursSinceStart = currentHour - hourStart;
        const hourHeight = 120; // Approximate height per hour
        const scrollPosition = hoursSinceStart * hourHeight - 100; // Offset to center
        
        timelineRef.current.scrollTop = Math.max(0, scrollPosition);
        setHasScrolledToNow(true);
    }, [date, hourStart, hourEnd, hasScrolledToNow]);

    // Group tasks by hour
    const tasksByHour = useMemo(() => {
        const grouped: Record<number, Task[]> = {};
        
        tasks.forEach(task => {
            const hour = getScheduledHour(task);
            if (!grouped[hour]) {
                grouped[hour] = [];
            }
            grouped[hour].push(task);
        });
        
        // Sort tasks within each hour by order
        Object.keys(grouped).forEach(hour => {
            grouped[parseInt(hour)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        });
        
        return grouped;
    }, [tasks]);

    // Calculate capacity per time block
    const blockCapacity = useMemo(() => {
        const capacity: Record<string, { scheduled: number; available: number }> = {
            morning: { scheduled: 0, available: 6 * 60 },
            afternoon: { scheduled: 0, available: 6 * 60 },
            evening: { scheduled: 0, available: 4 * 60 },
        };
        
        tasks.forEach(task => {
            if (task.timeBlock !== 'anytime') {
                capacity[task.timeBlock].scheduled += task.estimatedMinutes;
            }
        });
        
        return capacity;
    }, [tasks]);

    // Generate hours array
    const hours = useMemo(() => {
        const arr: number[] = [];
        for (let h = hourStart; h <= hourEnd; h++) {
            arr.push(h);
        }
        return arr;
    }, [hourStart, hourEnd]);

    // Format hour for display
    const formatHour = (hour: number): string => {
        if (hour === 0) return '12am';
        if (hour === 12) return '12pm';
        if (hour < 12) return `${hour}am`;
        return `${hour - 12}pm`;
    };

    // Get time block region for an hour
    const getTimeBlockRegion = (hour: number): keyof typeof TIME_BLOCK_REGIONS | null => {
        if (hour >= TIME_BLOCK_REGIONS.morning.start && hour < TIME_BLOCK_REGIONS.morning.end) {
            return 'morning';
        }
        if (hour >= TIME_BLOCK_REGIONS.afternoon.start && hour < TIME_BLOCK_REGIONS.afternoon.end) {
            return 'afternoon';
        }
        if (hour >= TIME_BLOCK_REGIONS.evening.start && hour < TIME_BLOCK_REGIONS.evening.end) {
            return 'evening';
        }
        return null;
    };

    // Check if we should show "NOW" marker at this hour
    const shouldShowNowMarker = (hour: number): boolean => {
        const today = getTodayInTimezone();
        if (date !== today) return false;
        
        const currentHour = getCurrentHourInTimezone();
        return currentHour === hour;
    };

    // Handle drag & drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent, targetHour?: number) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const taskId = e.dataTransfer.getData('text/plain');
        if (!taskId) return;
        
        // Determine time block from hour
        let targetBlock: TimeBlock = 'anytime';
        if (targetHour !== undefined) {
            if (targetHour >= 6 && targetHour < 12) targetBlock = 'morning';
            else if (targetHour >= 12 && targetHour < 18) targetBlock = 'afternoon';
            else if (targetHour >= 18 && targetHour < 22) targetBlock = 'evening';
        }
        
        // Update task with new time block and scheduled hour
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            onUpdate(taskId, { 
                timeBlock: targetBlock,
                scheduledHour: targetHour,
            });
        }
    };

    return (
        <div 
            ref={timelineRef}
            className="h-full overflow-y-auto overflow-x-hidden"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e)}
        >
            {/* Daily capacity header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Today's Schedule
                </h3>
                
                {/* Time block capacity bars */}
                <div className="space-y-2">
                    {Object.entries(blockCapacity).map(([block, cap]) => {
                        const region = TIME_BLOCK_REGIONS[block as keyof typeof TIME_BLOCK_REGIONS];
                        const percentage = (cap.scheduled / cap.available) * 100;
                        const hours = Math.round(cap.scheduled / 60 * 10) / 10;
                        const availableHours = cap.available / 60;
                        
                        let barColor = 'bg-green-500';
                        if (percentage > 90) barColor = 'bg-red-500';
                        else if (percentage > 70) barColor = 'bg-yellow-500';
                        
                        return (
                            <div key={block} className="flex items-center gap-2 text-xs">
                                <span className="w-20 text-gray-600 dark:text-gray-400 capitalize">
                                    {region.label}
                                </span>
                                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${barColor} transition-all`}
                                        style={{ width: `${Math.min(100, percentage)}%` }}
                                    />
                                </div>
                                <span className="text-gray-600 dark:text-gray-400 w-16 text-right">
                                    {hours}h / {availableHours}h
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Timeline grid */}
            <div className="relative px-4 pb-20">
                {hours.map((hour) => {
                    const region = getTimeBlockRegion(hour);
                    const isFirstInRegion = region && TIME_BLOCK_REGIONS[region].start === hour;
                    const tasksAtHour = tasksByHour[hour] || [];
                    const showNow = shouldShowNowMarker(hour);
                    
                    return (
                        <div
                            key={hour}
                            className="relative"
                            style={{
                                minHeight: '120px',
                                backgroundColor: region ? TIME_BLOCK_REGIONS[region].color : 'transparent',
                                borderTop: isFirstInRegion ? `2px solid ${TIME_BLOCK_REGIONS[region].borderColor}` : undefined,
                            }}
                            onDrop={(e) => handleDrop(e, hour)}
                        >
                            {/* Hour marker */}
                            <div className="absolute left-0 top-0 flex items-start gap-3">
                                <div className="w-16 pt-1">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {formatHour(hour)}
                                    </span>
                                </div>
                                
                                {/* Vertical line */}
                                <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
                            </div>
                            
                            {/* Time block label (first hour of each region) */}
                            {isFirstInRegion && region && (
                                <div className="absolute left-20 top-1 text-xs font-semibold uppercase tracking-wide"
                                    style={{ color: TIME_BLOCK_REGIONS[region].borderColor.replace('0.2', '0.8') }}
                                >
                                    {TIME_BLOCK_REGIONS[region].label} Block
                                </div>
                            )}
                            
                            {/* NOW indicator */}
                            {showNow && (
                                <div className="absolute left-20 top-8 right-4 flex items-center gap-2 z-20">
                                    <div className="flex-1 h-0.5 bg-red-500" />
                                    <span className="text-xs font-bold text-red-500 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">
                                        {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ← YOU ARE HERE
                                    </span>
                                    <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-red-500" />
                                </div>
                            )}
                            
                            {/* Tasks at this hour */}
                            <div className="ml-20 pt-12 space-y-2">
                                {tasksAtHour.map((task) => {
                                    const project = projects.find(p => p.id === task.projectId);
                                    if (!project && task.projectId) return null; // Skip if project required but not found
                                    
                                    return (
                                        <QuickEditTaskCard
                                            key={task.id}
                                            task={task}
                                            project={project!}
                                            onUpdate={onUpdate}
                                            onStatusChange={onStatusChange}
                                            onPause={onPause}
                                            onDelete={onDelete}
                                            onToggleSubtask={onToggleSubtask}
                                            onUpdateSubtasks={onUpdateSubtasks}
                                            onAIBreakdown={onAIBreakdown}
                                            onEdit={onEdit}
                                            onStartPomodoro={onStartPomodoro}
                                            isSelected={selectedTaskId === task.id}
                                            onSelect={onSelectTask}
                                            onStartDrag={onStartDrag}
                                            allTasks={allTasks}
                                            allProjects={projects}
                                            compact={compact}
                                            subtasksExpandedAll={subtasksExpandedAll}
                                        />
                                    );
                                })}
                                
                                {/* Empty hour indicator */}
                                {tasksAtHour.length === 0 && (
                                    <div className="text-xs text-gray-400 dark:text-gray-600 italic py-2">
                                        No tasks scheduled
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {/* Anytime tasks (below timeline) */}
                {tasksByHour[23] && tasksByHour[23].length > 0 && (
                    <div className="mt-8 border-t-2 border-dashed border-gray-300 dark:border-gray-600 pt-4">
                        <div className="mb-3">
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Anytime Tasks ({tasksByHour[23].length})
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                No specific time - do whenever you have space
                            </p>
                        </div>
                        
                        <div className="ml-20 space-y-2">
                            {tasksByHour[23].map((task) => {
                                const project = projects.find(p => p.id === task.projectId);
                                if (!project && task.projectId) return null; // Skip if project required but not found
                                
                                return (
                                    <QuickEditTaskCard
                                        key={task.id}
                                        task={task}
                                        project={project!}
                                        onUpdate={onUpdate}
                                        onStatusChange={onStatusChange}
                                        onPause={onPause}
                                        onDelete={onDelete}
                                        onToggleSubtask={onToggleSubtask}
                                        onUpdateSubtasks={onUpdateSubtasks}
                                        onAIBreakdown={onAIBreakdown}
                                        onEdit={onEdit}
                                        onStartPomodoro={onStartPomodoro}
                                        isSelected={selectedTaskId === task.id}
                                        onSelect={onSelectTask}
                                        onStartDrag={onStartDrag}
                                        allTasks={allTasks}
                                        allProjects={projects}
                                        compact={compact}
                                        subtasksExpandedAll={subtasksExpandedAll}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
