'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Task, Project } from '@/types';
import TimelineTaskCard from './TimelineTaskCard';
import { X } from 'lucide-react';
import { calculateTimelineLayout, canScheduleAt, findNextAvailableSlot as findNextSlot } from '@/lib/utils/timeline-overlap';

interface TimelinePanelProps {
  tasks: Task[];
  allTasks?: Task[]; // All tasks including inbox, for drop handler
  date?: string; // Date this timeline is showing (for setting date on dropped tasks)
  projects: Project[];
  selectedTaskId: string | null;
  hoveredTaskId: string | null;
  onTaskClick: (taskId: string) => void;
  onTaskHover: (taskId: string | null) => void;
  onTaskDragStart: (task: Task, e: React.DragEvent) => void;
  onTaskDrop: (taskId: string, hour: number, minute: number, date?: string) => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onEdit?: (task: Task) => void;
  onUnschedule?: (taskId: string) => void;
  onStartNow?: (taskId: string) => void;
  onStartPomodoro?: (task: Task) => void;
}

const HOUR_HEIGHT = 80; // 80px per hour for comfortable spacing
const START_HOUR = 6; // 6am
const END_HOUR = 23; // 11pm (to include 10pm hour)
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const SNAP_INTERVAL = 15; // Snap to 15-minute intervals
const MAX_OVERLAPS = 3; // Maximum overlapping tasks before showing overflow
const ALLOW_OVERLAPS = true; // Set to false to auto-adjust conflicts

// Time block boundaries matching TIME_BLOCKS from constants
const TIME_BLOCK_RANGES = {
  morning: { start: 6, end: 12 },    // 6am - 12pm
  afternoon: { start: 12, end: 17 }, // 12pm - 5pm
  evening: { start: 17, end: 22 },   // 5pm - 10pm
};

export default function TimelinePanel({
  tasks,
  allTasks,
  date,
  projects,
  selectedTaskId,
  hoveredTaskId,
  onTaskClick,
  onTaskHover,
  onTaskDragStart,
  onTaskDrop,
  onUpdate,
  onEdit,
  onUnschedule,
  onStartNow,
  onStartPomodoro,
}: TimelinePanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropPreviewPosition, setDropPreviewPosition] = useState<number | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // Calculate styled tasks with overlap detection (memoized for performance)
  const styledTasks = useMemo(() => {
    return calculateTimelineLayout(tasks, HOUR_HEIGHT, START_HOUR);
  }, [tasks]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Handle drag over timeline
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + timelineRef.current.scrollTop;
    
    // Calculate time from Y position
    const totalMinutes = (y / HOUR_HEIGHT) * 60;
    const snappedMinutes = Math.round(totalMinutes / SNAP_INTERVAL) * SNAP_INTERVAL;
    const position = (snappedMinutes / 60) * HOUR_HEIGHT;
    
    setDropPreviewPosition(position);
    setIsDragOver(true);
  };

  // Handle drop on timeline
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setDropPreviewPosition(null);
    setOverlapWarning(null);
    
    if (!timelineRef.current) return;
    
    // Get task ID from drag data
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Find the task being dropped (check allTasks for inbox tasks, fall back to tasks)
    const task = (allTasks || tasks).find(t => t.id === taskId);
    if (!task) return;
    
    // Calculate time from drop position
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + timelineRef.current.scrollTop;
    const totalMinutes = (y / HOUR_HEIGHT) * 60;
    const snappedMinutes = Math.round(totalMinutes / SNAP_INTERVAL) * SNAP_INTERVAL;
    
    let hour = START_HOUR + Math.floor(snappedMinutes / 60);
    let minute = snappedMinutes % 60;
    
    // Validate hour is within range
    if (hour >= START_HOUR && hour < END_HOUR) {
      const duration = task.estimatedMinutes || 30;

      // Check if overlaps are allowed or if we need to auto-adjust
      if (ALLOW_OVERLAPS) {
        // Check if we're exceeding max overlaps
        const canSchedule = canScheduleAt(taskId, hour, minute, duration, tasks, MAX_OVERLAPS);

        if (!canSchedule) {
          // Too many overlaps, find next slot
          const nextSlot = findNextSlot(hour, minute, duration, tasks, END_HOUR - 1, SNAP_INTERVAL);

          if (nextSlot) {
            setOverlapWarning(`Moved to ${nextSlot.hour % 12 || 12}:${nextSlot.minute.toString().padStart(2, '0')}${nextSlot.hour >= 12 ? 'PM' : 'AM'} (max ${MAX_OVERLAPS} overlaps)`);
            setTimeout(() => setOverlapWarning(null), 3000);
            onTaskDrop(taskId, nextSlot.hour, nextSlot.minute, date);
          } else {
            setOverlapWarning('No available slot found - scheduling anyway');
            setTimeout(() => setOverlapWarning(null), 3000);
            onTaskDrop(taskId, hour, minute, date);
          }
        } else {
          // Allow overlap
          onTaskDrop(taskId, hour, minute, date);
        }
      } else {
        // Auto-adjust mode: no overlaps allowed
        const nextSlot = findNextSlot(hour, minute, duration, tasks, END_HOUR - 1, SNAP_INTERVAL);

        if (nextSlot && (nextSlot.hour !== hour || nextSlot.minute !== minute)) {
          setOverlapWarning(`Moved to ${nextSlot.hour % 12 || 12}:${nextSlot.minute.toString().padStart(2, '0')}${nextSlot.hour >= 12 ? 'PM' : 'AM'} (next available slot)`);
          setTimeout(() => setOverlapWarning(null), 3000);
          onTaskDrop(taskId, nextSlot.hour, nextSlot.minute, date);
        } else {
          onTaskDrop(taskId, hour, minute, date);
        }
      }
    }
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the timeline entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropPreviewPosition(null);
    }
  };

  // Scroll to current time on mount
  useEffect(() => {
    const scrollToCurrentTime = () => {
      const currentPos = getCurrentTimePosition();
      if (currentPos !== null && timelineRef.current) {
        // Scroll so current hour is near the top (with ~120px padding for context)
        const scrollPosition = currentPos - 120;
        timelineRef.current.scrollTop = Math.max(0, scrollPosition);
      }
    };

    // Delay slightly to ensure DOM is ready
    setTimeout(scrollToCurrentTime, 100);
  }, []); // Only run on mount

  // Calculate position in pixels for current time indicator
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (hour < START_HOUR || hour >= END_HOUR) {
      return null; // Outside visible range
    }
    
    const position = (hour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
    return position;
  };

  // Calculate position in pixels for a task based on startTime or scheduledHour
  const getTaskPosition = (task: Task, indexInBlock?: number) => {
    let hour: number;
    let minute: number;

    if (task.startTime) {
      const time = new Date(task.startTime);
      hour = time.getHours();
      minute = time.getMinutes();
    } else if (task.scheduledHour !== null && task.scheduledHour !== undefined) {
      hour = task.scheduledHour;
      minute = task.scheduledMinute || 0;
    } else if (task.timeBlock && task.timeBlock !== 'anytime') {
      // TEMPORARY: Spread time block tasks across their block based on index
      // This will be replaced when drag & drop is implemented
      const blockRanges = TIME_BLOCK_RANGES as Record<string, { start: number; end: number }>;
      const range = blockRanges[task.timeBlock];
      if (range) {
        // Group tasks by time block to get count
        const tasksInBlock = tasks.filter(t => t.timeBlock === task.timeBlock);
        const taskIndex = indexInBlock ?? tasksInBlock.findIndex(t => t.id === task.id);
        const blockDurationHours = range.end - range.start;
        
        // Spread tasks evenly across the block
        if (tasksInBlock.length > 0) {
          const spacing = blockDurationHours / Math.max(tasksInBlock.length, 1);
          hour = range.start + Math.floor(taskIndex * spacing);
          minute = Math.floor((taskIndex * spacing % 1) * 60);
        } else {
          hour = range.start;
          minute = 0;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
    
    if (hour < START_HOUR || hour >= END_HOUR) {
      return null; // Outside visible range
    }
    
    const position = (hour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
    return position;
  };

  // Use styled tasks (which include overlap calculations)
  const scheduledTasks = styledTasks;

  // Debug: Log what we're rendering
  useEffect(() => {
    console.log('[TimelinePanel] Total tasks:', tasks.length);
    console.log('[TimelinePanel] Tasks with time blocks:', tasks.filter(t => t.timeBlock && t.timeBlock !== 'anytime').length);
    console.log('[TimelinePanel] Scheduled tasks:', scheduledTasks.length);
    if (scheduledTasks.length > 0) {
      console.log('[TimelinePanel] Sample scheduled task:', scheduledTasks[0]);
    }
  }, [tasks, scheduledTasks]);

  // Format hour for display
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  const currentTimePos = getCurrentTimePosition();

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200 overflow-hidden">
      {/* Overlap Warning */}
      {overlapWarning && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <div className="flex-1 text-xs text-amber-800 font-medium">
            ⚠️ {overlapWarning}
          </div>
          <button
            onClick={() => setOverlapWarning(null)}
            className="text-amber-600 hover:text-amber-800"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating Tasks Band (All-Day) */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0 overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Today (Anytime)</h3>
          <span className="text-[9px] text-gray-500">Drag to schedule</span>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {/* Filter floating tasks (no scheduledHour but has today's date) */}
          {tasks
            .filter(t => t.date === date && (t.scheduledHour === null || t.scheduledHour === undefined) && t.timeBlock !== 'inbox')
            .map(task => {
              const project = task.projectId ? projects.find(p => p.id === task.projectId) : undefined;
              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', task.id);
                    e.dataTransfer.setData('taskId', task.id);
                    onTaskDragStart(task, e);
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border-l-2 rounded shadow-sm hover:shadow-md transition-shadow cursor-move"
                  style={{ borderLeftColor: project?.color || '#94a3b8' }}
                  title={`${task.title} - Drag to schedule at specific time`}
                >
                  <span className="text-xs font-medium text-gray-900 truncate max-w-[120px]">{task.title}</span>
                  {task.estimatedMinutes && (
                    <span className="text-[10px] text-gray-500">{task.estimatedMinutes}m</span>
                  )}
                </div>
              );
            })}
          {tasks.filter(t => t.date === date && (t.scheduledHour === null || t.scheduledHour === undefined) && t.timeBlock !== 'inbox').length === 0 && (
            <span className="text-[10px] text-gray-400 italic">No floating tasks - these show here when scheduled today but not at a specific time</span>
          )}
        </div>
      </div>

      {/* Timeline content - scrollable */}
      <div
        ref={timelineRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
          {/* Time block background shading */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Morning - light blue tint */}
            <div
              className="absolute left-0 right-0 bg-blue-50/40"
              style={{
                top: `${(TIME_BLOCK_RANGES.morning.start - START_HOUR) * HOUR_HEIGHT}px`,
                height: `${(TIME_BLOCK_RANGES.morning.end - TIME_BLOCK_RANGES.morning.start) * HOUR_HEIGHT}px`,
              }}
            />
            {/* Afternoon - light yellow tint */}
            <div
              className="absolute left-0 right-0 bg-amber-50/40"
              style={{
                top: `${(TIME_BLOCK_RANGES.afternoon.start - START_HOUR) * HOUR_HEIGHT}px`,
                height: `${(TIME_BLOCK_RANGES.afternoon.end - TIME_BLOCK_RANGES.afternoon.start) * HOUR_HEIGHT}px`,
              }}
            />
            {/* Evening - light purple tint */}
            <div
              className="absolute left-0 right-0 bg-purple-50/40"
              style={{
                top: `${(TIME_BLOCK_RANGES.evening.start - START_HOUR) * HOUR_HEIGHT}px`,
                height: `${(TIME_BLOCK_RANGES.evening.end - TIME_BLOCK_RANGES.evening.start) * HOUR_HEIGHT}px`,
              }}
            />
          </div>

          {/* Hour grid */}
          {HOURS.map((hour, index) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-200"
              style={{ top: `${index * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              {/* Hour label */}
              <div className="px-4 py-1">
                <span className="text-xs font-medium text-gray-500">
                  {formatHour(hour)}
                </span>
              </div>

              {/* 15-minute interval guides (subtle) */}
              {[0.25, 0.5, 0.75].map((fraction, idx) => (
                <div
                  key={idx}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: `${fraction * HOUR_HEIGHT}px` }}
                />
              ))}
            </div>
          ))}

          {/* Current time indicator */}
          {currentTimePos !== null && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${currentTimePos}px` }}
            >
              <div className="h-0.5 bg-red-500 shadow-sm relative">
                {/* Circle indicator on the left */}
                <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              </div>
            </div>
          )}

          {/* Drop preview indicator */}
          {isDragOver && dropPreviewPosition !== null && (
            <div
              className="absolute left-0 right-0 z-30 pointer-events-none"
              style={{ top: `${dropPreviewPosition}px` }}
            >
              <div className="h-1 bg-purple-500 shadow-lg relative rounded-full">
                {/* Circle indicator on the left */}
                <div className="absolute -left-1.5 -top-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-lg" />
                {/* Time label */}
                <div className="absolute left-4 -top-3 bg-purple-500 text-white text-xs px-2 py-0.5 rounded shadow-lg font-semibold">
                  Drop here
                </div>
              </div>
            </div>
          )}

          {/* Scheduled tasks with overlap support */}
          {scheduledTasks.map((styledTask) => {
            const project = styledTask.projectId
              ? projects.find((p) => p.id === styledTask.projectId)
              : undefined;

            // Use pre-calculated position and height from overlap algorithm
            const position = styledTask.top;
            const heightPx = styledTask.height;

            // Calculate display time
            const startHour = styledTask.scheduledHour!;
            const startMinute = styledTask.scheduledMinute || 0;
            const durationMinutes = styledTask.estimatedMinutes || 30;

            const endTimeMinutes = startHour * 60 + startMinute + durationMinutes;
            const endHour = Math.floor(endTimeMinutes / 60);
            const endMinute = endTimeMinutes % 60;

            // Format times
            const formatTime = (h: number, m: number) => {
              const ampm = h >= 12 ? 'PM' : 'AM';
              const displayHour = h % 12 || 12;
              const displayMinute = m.toString().padStart(2, '0');
              return `${displayHour}:${displayMinute}${ampm}`;
            };

            const displayTime = `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`;

            // Determine if task is in a multi-column layout
            const isOverlapping = styledTask.columns > 1;
            const columnWidth = styledTask.width;
            const columnLeft = styledTask.left;

            return (
              <div
                key={styledTask.id}
                className="absolute transition-all duration-150 z-20"
                style={{
                  top: `${position}px`,
                  height: `${Math.max(heightPx, 24)}px`, // Minimum 24px for usability
                  left: isOverlapping ? `calc(3rem + ${columnLeft}%)` : '3rem', // 3rem = 48px left margin
                  width: isOverlapping
                    ? `${columnWidth}%` // Use full calculated column width (no gap)
                    : 'calc(100% - 4rem)', // Full width when not overlapping
                  maxWidth: 'none', // Remove max width constraint
                }}
                onMouseEnter={() => onTaskHover(styledTask.id)}
                onMouseLeave={() => onTaskHover(null)}
              >
                <TimelineTaskCard
                  task={styledTask}
                  project={project}
                  allProjects={projects}
                  isSelected={selectedTaskId === styledTask.id}
                  isHovered={hoveredTaskId === styledTask.id}
                  onClick={() => onTaskClick(styledTask.id)}
                  onEdit={onEdit}
                  onUnschedule={onUnschedule}
                  onStartNow={onStartNow}
                  onStartPomodoro={onStartPomodoro}
                  onProjectChange={async (taskId, projectId) => {
                    // Update task project inline
                    if (onUpdate) {
                      onUpdate(taskId, { projectId: projectId || undefined });
                    }
                  }}
                  onDurationChange={async (taskId, newMinutes) => {
                    // Update task duration inline
                    if (onUpdate) {
                      onUpdate(taskId, { estimatedMinutes: newMinutes });
                    }
                  }}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', styledTask.id);
                    e.dataTransfer.setData('taskId', styledTask.id);
                    onTaskDragStart(styledTask, e);
                  }}
                  displayTime={displayTime}
                  compact={isOverlapping} // Pass compact flag for narrower cards
                />
              </div>
            );
          })}

          {/* Empty state */}
          {scheduledTasks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center px-4">
                <p className="text-sm text-gray-500">No scheduled tasks</p>
                <p className="text-xs text-gray-400 mt-1">
                  Drag tasks here to schedule them
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
