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
import { Clock, CheckCircle2 } from 'lucide-react';

// Default project for tasks without a project assigned
const DEFAULT_PROJECT: Project = {
    id: 'none',
    name: 'No Project',
    color: '#9ca3af',
    bgColor: '#f3f4f6',
    icon: 'circle',
};

// Constants for precise time calculations
// Using 180px per hour = 3px per minute, so:
// - 15 min task = 45px (readable with clear gaps)
// - 30 min task = 90px (comfortable)  
// - 60 min task = 180px (spacious)
// - 15 min gap = 45px (clearly visible)
const HOUR_HEIGHT = 180; // pixels per hour
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60; // 3px per minute
const MIN_DISPLAY_HEIGHT = 28; // Minimum height for readability (single line of text)
const INTERVAL_MINUTES = 15; // Snap to 15-minute intervals (0, 15, 30, 45)
const PIXELS_PER_INTERVAL = HOUR_HEIGHT / (60 / INTERVAL_MINUTES); // 45px per 15-min interval

interface TimelineViewProps {
    tasks: Task[];
    allTasks: Task[];
    projects: Project[];
    date: string;
    inboxTasks?: Task[]; // Unscheduled tasks (date=null) to show in draggable section
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
    onStartNow?: (taskId: string) => Promise<void>;
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

// Helper: Get scheduled minute for a task (defaults to 0 for top of hour)
const getScheduledMinute = (task: Task): number => {
    if (task.scheduledMinute !== undefined && task.scheduledMinute !== null) {
        return task.scheduledMinute;
    }
    return 0; // Default to top of hour
};

// Helper: Snap minute to nearest 15-minute interval
const snapToInterval = (minute: number): number => {
    return Math.round(minute / INTERVAL_MINUTES) * INTERVAL_MINUTES;
};

const TimelineViewComponent: React.FC<TimelineViewProps> = ({
    tasks,
    allTasks,
    projects,
    date,
    inboxTasks = [],
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
    onStartNow,
    hourStart = 6,
    hourEnd = 22,
    compact = false,
    subtasksExpandedAll = true,
    theme,
}) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragOverHour, setDragOverHour] = useState<number | null>(null);
    const [dragOverMinute, setDragOverMinute] = useState<number>(0);
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null); // Task being hovered for reordering
    const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after'>('before'); // Insert before or after
    const [draggedTaskDuration, setDraggedTaskDuration] = useState<number>(30); // Duration of task being dragged
    const [hasScrolledToNow, setHasScrolledToNow] = useState(false);
    const hourRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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
        
        // Scroll to current time marker with smooth behavior
        const hoursSinceStart = currentHour - hourStart;
        const scrollPosition = hoursSinceStart * HOUR_HEIGHT - 200; // Offset to show context above
        
        // Slight delay to ensure DOM is ready
        setTimeout(() => {
            if (timelineRef.current) {
                timelineRef.current.scrollTop = Math.max(0, scrollPosition);
                setHasScrolledToNow(true);
            }
        }, 100);
    }, [date, hourStart, hourEnd, hasScrolledToNow]);

    // Group tasks by hour and minute interval
    const tasksByHour = useMemo(() => {
        const grouped: Record<number, Task[]> = {};
        
        tasks.forEach(task => {
            const hour = getScheduledHour(task);
            if (!grouped[hour]) {
                grouped[hour] = [];
            }
            grouped[hour].push(task);
        });
        
        // Sort tasks within each hour by minute, then order
        Object.keys(grouped).forEach(hour => {
            grouped[parseInt(hour)].sort((a, b) => {
                const aMinute = getScheduledMinute(a);
                const bMinute = getScheduledMinute(b);
                if (aMinute !== bMinute) return aMinute - bMinute;
                return (a.order ?? 0) - (b.order ?? 0);
            });
        });
        
        return grouped;
    }, [tasks]);

    // Detect overlapping tasks and assign columns for horizontal positioning
    // Uses DISPLAY heights (with minimum) to detect VISUAL overlaps
    const taskPositions = useMemo(() => {
        const positions: Record<string, { column: number; totalColumns: number }> = {};
        
        // Convert tasks to intervals with start/end positions in PIXELS
        const intervals = tasks.map(task => {
            const startMinutes = getScheduledHour(task) * 60 + getScheduledMinute(task);
            const startPx = startMinutes * PIXELS_PER_MINUTE;
            const durationMinutes = task.estimatedMinutes || 30;
            const displayHeight = Math.max(MIN_DISPLAY_HEIGHT, durationMinutes * PIXELS_PER_MINUTE);
            
            return {
                id: task.id,
                start: startPx,
                end: startPx + displayHeight,
            };
        });
        
        // Sort by start time, then by end time
        intervals.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            return a.end - b.end;
        });
        
        // Build overlap groups - tasks that actually overlap in time
        const overlapGroups: string[][] = [];
        
        intervals.forEach(interval => {
            // Find all tasks that overlap with this one (including exact time matches)
            const overlapping = intervals.filter(other => 
                other.id !== interval.id && 
                !(interval.end <= other.start || interval.start >= other.end)
            );
            
            if (overlapping.length === 0) {
                // No overlap - this task is alone
                positions[interval.id] = { column: 0, totalColumns: 1 };
            } else {
                // Find or create overlap group
                const overlappingIds = [interval.id, ...overlapping.map(t => t.id)];
                let group = overlapGroups.find(g => 
                    overlappingIds.some(id => g.includes(id))
                );
                
                if (!group) {
                    group = [];
                    overlapGroups.push(group);
                }
                
                // Add all overlapping tasks to the group
                overlappingIds.forEach(id => {
                    if (!group!.includes(id)) {
                        group!.push(id);
                    }
                });
            }
        });
        
        // Assign columns within each overlap group
        overlapGroups.forEach(group => {
            const groupIntervals = intervals.filter(i => group.includes(i.id));
            
            // Sort by start time within group
            groupIntervals.sort((a, b) => {
                if (a.start !== b.start) return a.start - b.start;
                return a.end - b.end;
            });
            
            // Track which columns are occupied at each time point
            groupIntervals.forEach(interval => {
                // Find overlapping tasks in this group that are already positioned
                const overlappingInGroup = groupIntervals.filter(other =>
                    other.id !== interval.id &&
                    positions[other.id] !== undefined &&
                    !(interval.end <= other.start || interval.start >= other.end)
                );
                
                const occupiedColumns = overlappingInGroup.map(t => positions[t.id].column);
                
                // Find first available column
                let column = 0;
                while (occupiedColumns.includes(column)) {
                    column++;
                }
                
                // Initially set with placeholder totalColumns (will be updated below)
                positions[interval.id] = { column, totalColumns: 1 };
            });
            
            // Calculate actual max columns needed for this group
            const maxColumn = Math.max(...group.map(id => positions[id]?.column ?? 0));
            const totalColumns = maxColumn + 1;
            
            // Update all tasks in group with correct totalColumns
            group.forEach(id => {
                if (positions[id]) {
                    positions[id].totalColumns = totalColumns;
                }
            });
        });
        
        return positions;
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

    // Calculate precise drop position from mouse coordinates
    const calculateDropPosition = (e: React.DragEvent, hourElement: HTMLDivElement, hour: number): { hour: number; minute: number } => {
        const rect = hourElement.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const pixelsPerMinute = HOUR_HEIGHT / 60;
        const minute = Math.floor(Math.max(0, Math.min(59, offsetY / pixelsPerMinute)));
        
        return { hour, minute };
    };

    // Handle drag & drop with precise time calculation
    const handleDragOver = (e: React.DragEvent, hour?: number, hourElement?: HTMLDivElement) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
        
        // Get dragged task duration for proper highlight sizing
        const taskId = e.dataTransfer.getData('text/plain');
        const draggedTask = tasks.find(t => t.id === taskId);
        if (draggedTask) {
            const duration = draggedTask.estimatedMinutes || 30;
            setDraggedTaskDuration(duration);
        }
        
        if (hour !== undefined && hourElement) {
            const { minute } = calculateDropPosition(e, hourElement, hour);
            const snappedMinute = snapToInterval(minute);
            setDragOverHour(hour);
            setDragOverMinute(snappedMinute);
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
        setDragOverHour(null);
        setDragOverMinute(0);
        setDragOverTaskId(null);
    };

    // Handle drag over a specific task (for reordering within same hour)
    const handleTaskDragOver = (e: React.DragEvent, task: Task, position: 'before' | 'after') => {
        e.preventDefault();
        e.stopPropagation(); // Prevent hour-level handling
        e.dataTransfer.dropEffect = 'move';
        setDragOverTaskId(task.id);
        setDragOverPosition(position);
        setDragOverHour(null); // Clear hour-level indicators
    };

    const handleTaskDragLeave = (e: React.DragEvent, taskId: string) => {
        // Only clear if leaving this specific task
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!e.currentTarget.contains(relatedTarget)) {
            if (dragOverTaskId === taskId) {
                setDragOverTaskId(null);
            }
        }
    };

    // Handle drop on a specific task (insert before/after)
    const handleTaskDrop = (e: React.DragEvent, targetTask: Task, position: 'before' | 'after') => {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedTaskId = e.dataTransfer.getData('text/plain');
        if (!draggedTaskId || draggedTaskId === targetTask.id) {
            setDragOverTaskId(null);
            return;
        }

        const draggedTask = tasks.find(t => t.id === draggedTaskId);
        if (!draggedTask) {
            setDragOverTaskId(null);
            return;
        }

        // Get target hour and tasks at that hour
        const targetHour = getScheduledHour(targetTask);
        const tasksAtTargetHour = tasksByHour[targetHour] || [];
        
        // Calculate new order based on insertion position
        const targetIndex = tasksAtTargetHour.findIndex(t => t.id === targetTask.id);
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        
        // Reorder tasks
        const newOrder = [...tasksAtTargetHour];
        const currentIndex = newOrder.findIndex(t => t.id === draggedTaskId);
        
        if (currentIndex !== -1) {
            // Reordering within same hour
            newOrder.splice(currentIndex, 1);
            const adjustedInsertIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
            newOrder.splice(adjustedInsertIndex, 0, draggedTask);
        } else {
            // Moving from different hour
            newOrder.splice(insertIndex, 0, draggedTask);
        }

        // Update orders for all affected tasks
        newOrder.forEach((task, index) => {
            if (task.id === draggedTaskId) {
                // Update dragged task with new time and order
                let targetBlock: TimeBlock = 'anytime';
                if (targetHour >= 6 && targetHour < 12) targetBlock = 'morning';
                else if (targetHour >= 12 && targetHour < 18) targetBlock = 'afternoon';
                else if (targetHour >= 18 && targetHour < 22) targetBlock = 'evening';
                
                onUpdate(task.id, {
                    timeBlock: targetBlock,
                    scheduledHour: targetHour,
                    scheduledMinute: getScheduledMinute(targetTask),
                    order: index
                });
            } else if (task.order !== index) {
                // Update order for other tasks if needed
                onUpdate(task.id, { order: index });
            }
        });

        setDragOverTaskId(null);
    };

    const handleDrop = (e: React.DragEvent, targetHour?: number, hourElement?: HTMLDivElement) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to parent container
        setIsDragOver(false);
        setDragOverHour(null);
        setDragOverMinute(0);
        setDragOverTaskId(null);
        
        const taskId = e.dataTransfer.getData('text/plain');
        if (!taskId) return;
        
        let finalHour = targetHour;
        let finalMinute = 0;
        
        // Calculate exact time from drop position
        if (targetHour !== undefined && hourElement) {
            const position = calculateDropPosition(e, hourElement, targetHour);
            finalHour = position.hour;
            finalMinute = snapToInterval(position.minute); // Snap to 15-min intervals
        }
        
        // Determine time block from hour
        let targetBlock: TimeBlock = 'anytime';
        if (finalHour !== undefined) {
            if (finalHour >= 6 && finalHour < 12) targetBlock = 'morning';
            else if (finalHour >= 12 && finalHour < 18) targetBlock = 'afternoon';
            else if (finalHour >= 18 && finalHour < 22) targetBlock = 'evening';
        }
        
        // Update task with new time block, scheduled hour, and minute
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            console.log(`Dropping task at ${finalHour}:${finalMinute.toString().padStart(2, '0')}`);
            onUpdate(taskId, { 
                timeBlock: targetBlock,
                scheduledHour: finalHour,
                scheduledMinute: finalMinute,
            });
        }
    };

    return (
        <div 
            ref={timelineRef}
            className="h-full overflow-y-auto overflow-x-hidden"
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
                    const isDraggingOverThisHour = isDragOver && dragOverHour === hour;
                    
                    return (
                        <div
                            key={hour}
                            ref={(el) => {
                                if (el) hourRefs.current.set(hour, el);
                                else hourRefs.current.delete(hour);
                            }}
                            className={`relative transition-all ${
                                isDraggingOverThisHour ? 'bg-purple-50 dark:bg-purple-900/10 ring-2 ring-purple-400' : ''
                            }`}
                            style={{
                                height: `${HOUR_HEIGHT}px`,
                                minHeight: `${HOUR_HEIGHT}px`,
                                backgroundColor: !isDraggingOverThisHour && region ? TIME_BLOCK_REGIONS[region].color : undefined,
                                borderTop: isFirstInRegion ? `2px solid ${TIME_BLOCK_REGIONS[region].borderColor}` : undefined,
                            }}
                            onDragOver={(e) => {
                                const hourEl = hourRefs.current.get(hour);
                                if (hourEl) handleDragOver(e, hour, hourEl);
                            }}
                            onDrop={(e) => {
                                const hourEl = hourRefs.current.get(hour);
                                if (hourEl) handleDrop(e, hour, hourEl);
                            }}
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
                            
                            {/* 15-minute interval markers */}
                            {[15, 30, 45].map(minute => (
                                <div
                                    key={minute}
                                    className="absolute left-20 right-4"
                                    style={{ top: `${minute}px` }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400 dark:text-gray-600 w-6">
                                            :{minute}
                                        </span>
                                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 opacity-30" />
                                    </div>
                                </div>
                            ))}
                            
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
                                <div 
                                    className="absolute left-20 right-4 flex items-center gap-2 z-20"
                                    style={{ top: `${currentTime.getMinutes() * PIXELS_PER_MINUTE}px` }}
                                >
                                    <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                                    <div className="flex-1 h-0.5 bg-red-500" />
                                </div>
                            )}
                            
                            {/* Drop position indicator - shows task duration zone */}
                            {isDraggingOverThisHour && (
                                <div 
                                    className="absolute left-20 right-4 z-30 pointer-events-none bg-purple-200 dark:bg-purple-600/30 rounded border-2 border-purple-500 border-dashed"
                                    style={{ 
                                        top: `${dragOverMinute * PIXELS_PER_MINUTE}px`,
                                        height: `${Math.max(MIN_DISPLAY_HEIGHT, draggedTaskDuration * PIXELS_PER_MINUTE)}px`
                                    }}
                                >
                                    {/* Time label at top */}
                                    <div className="absolute -top-6 left-0 text-xs font-semibold text-purple-600 dark:text-purple-400 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 rounded flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatHour(hour)}:{dragOverMinute.toString().padStart(2, '0')}
                                    </div>
                                    {/* Duration label in center */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-purple-600 dark:text-purple-300 bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded-full shadow-lg">
                                            {draggedTaskDuration} min
                                        </span>
                                    </div>
                                    {/* End time label at bottom */}
                                    <div className="absolute -bottom-6 right-0 text-xs text-purple-500 dark:text-purple-400 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 rounded">
                                        Ends: {formatHour(hour)}:{((dragOverMinute + draggedTaskDuration) % 60).toString().padStart(2, '0')}
                                    </div>
                                </div>
                            )}
                            
                            {/* Tasks at this hour */}
                            <div className="ml-20 pt-0 relative" style={{ minHeight: `${HOUR_HEIGHT}px` }}>
                                {tasksAtHour.map((task, taskIndex) => {
                                    const project = task.projectId 
                                        ? projects.find(p => p.id === task.projectId) || DEFAULT_PROJECT
                                        : DEFAULT_PROJECT;
                                    
                                    // Calculate task height: duration * pixels per minute, with minimum
                                    const durationMinutes = task.estimatedMinutes || 30;
                                    const taskHeight = Math.max(MIN_DISPLAY_HEIGHT, durationMinutes * PIXELS_PER_MINUTE);
                                    
                                    // Position task at its scheduled minute (converted to pixels)
                                    const scheduledMinute = getScheduledMinute(task);
                                    const topPosition = scheduledMinute * PIXELS_PER_MINUTE;
                                    
                                    // Get horizontal position for overlapping tasks
                                    const position = taskPositions[task.id] || { column: 0, totalColumns: 1 };
                                    const columnWidth = 100 / position.totalColumns; // percentage
                                    const leftOffset = position.column * columnWidth; // percentage
                                    
                                    const isBeforeTarget = dragOverTaskId === task.id && dragOverPosition === 'before';
                                    const isAfterTarget = dragOverTaskId === task.id && dragOverPosition === 'after';
                                    
                                    // Show ghost for completed tasks
                                    const isCompleted = task.status === 'completed';
                                    
                                    if (isCompleted) {
                                        // Ghost marker for completed task
                                        return (
                                            <div
                                                key={task.id}
                                                className="absolute border-2 border-dashed border-green-300 bg-green-50/50 dark:bg-green-900/10 rounded"
                                                style={{
                                                    top: `${topPosition}px`,
                                                    left: `${leftOffset}%`,
                                                    width: `${columnWidth}%`,
                                                    height: `${taskHeight}px`,
                                                    zIndex: 5,
                                                    paddingRight: position.totalColumns > 1 ? '2px' : '0'
                                                }}
                                            >
                                                <div className="flex items-center justify-between px-2 h-full">
                                                    <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-500">
                                                        <CheckCircle2 size={14} className="fill-current" />
                                                        <span className="font-medium truncate">{task.title}</span>
                                                    </div>
                                                    <span className="text-[10px] text-green-600 dark:text-green-400">
                                                        ✓ Done
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <div 
                                            key={task.id}
                                            className="absolute overflow-hidden"
                                            style={{ 
                                                top: `${topPosition}px`,
                                                left: `${leftOffset}%`,
                                                width: `${columnWidth}%`,
                                                height: `${taskHeight}px`,
                                                zIndex: isBeforeTarget || isAfterTarget ? 50 : 10,
                                                paddingRight: position.totalColumns > 1 ? '2px' : '0'
                                            }}
                                        >
                                            {/* Insertion indicator - BEFORE */}
                                            {isBeforeTarget && (
                                                <div className="absolute -top-1 left-0 right-0 h-1 bg-purple-500 rounded-full shadow-lg z-50 flex items-center">
                                                    <div className="w-3 h-3 bg-purple-500 rounded-full -ml-1 shadow-md" />
                                                    <div className="flex-1 h-1 bg-purple-500" />
                                                    <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full -mt-5 shadow-md">
                                                        Drop here
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Insertion indicator - AFTER */}
                                            {isAfterTarget && (
                                                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-purple-500 rounded-full shadow-lg z-50 flex items-center">
                                                    <div className="w-3 h-3 bg-purple-500 rounded-full -ml-1 shadow-md" />
                                                    <div className="flex-1 h-1 bg-purple-500" />
                                                    <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full -mb-5 shadow-md">
                                                        Drop here
                                                    </span>
                                                </div>
                                            )}

                                            {/* Drag over zones - top half = before, bottom half = after */}
                                            <div
                                                className="absolute inset-0 top-0 h-1/2 z-40"
                                                onDragOver={(e) => handleTaskDragOver(e, task, 'before')}
                                                onDragLeave={(e) => handleTaskDragLeave(e, task.id)}
                                                onDrop={(e) => handleTaskDrop(e, task, 'before')}
                                            />
                                            <div
                                                className="absolute inset-0 bottom-0 h-1/2 z-40"
                                                onDragOver={(e) => handleTaskDragOver(e, task, 'after')}
                                                onDragLeave={(e) => handleTaskDragLeave(e, task.id)}
                                                onDrop={(e) => handleTaskDrop(e, task, 'after')}
                                            />
                                            
                                            <QuickEditTaskCard
                                                key={task.id}
                                                task={task}
                                                project={project}
                                                allTasks={allTasks}
                                                allProjects={projects}
                                                onUpdate={onUpdate}
                                                onStatusChange={onStatusChange}
                                                onPause={onPause}
                                                onDelete={onDelete}
                                                onToggleSubtask={onToggleSubtask}
                                                onUpdateSubtasks={onUpdateSubtasks}
                                                onAIBreakdown={onAIBreakdown}
                                                onEdit={onEdit}
                                                onStartPomodoro={onStartPomodoro}
                                                onStartNow={onStartNow}
                                                isSelected={selectedTaskId === task.id}
                                                onSelect={onSelectTask}
                                                onStartDrag={onStartDrag}
                                                subtasksExpandedAll={subtasksExpandedAll}
                                                timelineHeight={taskHeight}
                                                compact={position.totalColumns > 1 || taskHeight < 50}
                                            />
                                        </div>
                                    );
                                })}
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
                                const project = task.projectId 
                                    ? projects.find(p => p.id === task.projectId) || DEFAULT_PROJECT
                                    : DEFAULT_PROJECT;
                                
                                return (
                                    <QuickEditTaskCard
                                        key={task.id}
                                        task={task}
                                        project={project}
                                        onUpdate={onUpdate}
                                        onStatusChange={onStatusChange}
                                        onPause={onPause}
                                        onDelete={onDelete}
                                        onToggleSubtask={onToggleSubtask}
                                        onUpdateSubtasks={onUpdateSubtasks}
                                        onAIBreakdown={onAIBreakdown}
                                        onEdit={onEdit}
                                        onStartPomodoro={onStartPomodoro}
                                        onStartNow={onStartNow}
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

// Memoize to prevent re-renders
export const TimelineView = React.memo(
    TimelineViewComponent,
    (prevProps, nextProps) => {
        return (
            prevProps.date === nextProps.date &&
            prevProps.tasks === nextProps.tasks &&
            prevProps.selectedTaskId === nextProps.selectedTaskId &&
            prevProps.compact === nextProps.compact &&
            prevProps.subtasksExpandedAll === nextProps.subtasksExpandedAll &&
            prevProps.hourStart === nextProps.hourStart &&
            prevProps.hourEnd === nextProps.hourEnd
        );
    }
);
