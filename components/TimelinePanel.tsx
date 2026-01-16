'use client';

import React, { useEffect, useState } from 'react';
import { Task, Project } from '@/types';
import TimelineTaskCard from './TimelineTaskCard';

interface TimelinePanelProps {
  tasks: Task[];
  projects: Project[];
  selectedTaskId: string | null;
  hoveredTaskId: string | null;
  onTaskClick: (taskId: string) => void;
  onTaskHover: (taskId: string | null) => void;
  onTaskDragStart: (task: Task, e: React.DragEvent) => void;
}

const HOUR_HEIGHT = 80; // 80px per hour for comfortable spacing
const START_HOUR = 6; // 6am
const END_HOUR = 23; // 11pm (to include 10pm hour)
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

// Time block boundaries matching TIME_BLOCKS from constants
const TIME_BLOCK_RANGES = {
  morning: { start: 6, end: 12 },    // 6am - 12pm
  afternoon: { start: 12, end: 17 }, // 12pm - 5pm
  evening: { start: 17, end: 22 },   // 5pm - 10pm
};

export default function TimelinePanel({
  tasks,
  projects,
  selectedTaskId,
  hoveredTaskId,
  onTaskClick,
  onTaskHover,
  onTaskDragStart,
}: TimelinePanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    const scrollToCurrentTime = () => {
      const currentPos = getCurrentTimePosition();
      if (currentPos !== null && timelineRef.current) {
        // Scroll so current time is roughly in the middle of the viewport
        const scrollPosition = currentPos - (timelineRef.current.clientHeight / 2);
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
  const getTaskPosition = (task: Task) => {
    let hour: number;
    let minute: number;

    if (task.startTime) {
      const time = new Date(task.startTime);
      hour = time.getHours();
      minute = time.getMinutes();
    } else if (task.scheduledHour !== null && task.scheduledHour !== undefined) {
      hour = task.scheduledHour;
      minute = task.scheduledMinute || 0;
    } else {
      return null;
    }
    
    if (hour < START_HOUR || hour >= END_HOUR) {
      return null; // Outside visible range
    }
    
    const position = (hour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
    return position;
  };

  // Filter tasks that have a time scheduled
  const scheduledTasks = tasks.filter(task => {
    const position = getTaskPosition(task);
    return position !== null;
  });

  // Format hour for display
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  const currentTimePos = getCurrentTimePosition();

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <h2 className="font-semibold text-gray-900">Timeline</h2>
        <p className="text-xs text-gray-500 mt-1">
          6AM - 10PM
        </p>
      </div>

      {/* Timeline content - scrollable */}
      <div ref={timelineRef} className="flex-1 overflow-y-auto scroll-smooth">
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

          {/* Scheduled tasks */}
          {scheduledTasks.map((task) => {
            const position = getTaskPosition(task);
            if (position === null) return null;

            const project = task.projectId
              ? projects.find((p) => p.id === task.projectId)
              : undefined;

            return (
              <div
                key={task.id}
                className="absolute left-12 right-4 transition-all duration-150 z-20"
                style={{ top: `${position}px` }}
                onMouseEnter={() => onTaskHover(task.id)}
                onMouseLeave={() => onTaskHover(null)}
              >
                <TimelineTaskCard
                  task={task}
                  project={project}
                  isSelected={selectedTaskId === task.id}
                  isHovered={hoveredTaskId === task.id}
                  onClick={() => onTaskClick(task.id)}
                  onDragStart={(e) => onTaskDragStart(task, e)}
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
