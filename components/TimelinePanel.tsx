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

const HOUR_HEIGHT = 60; // 60px per hour
const START_HOUR = 6; // 6am
const END_HOUR = 18; // 6pm
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

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

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate position for current time indicator
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (hour < START_HOUR || hour >= END_HOUR) {
      return null; // Outside visible range
    }
    
    const position = (hour - START_HOUR) * HOUR_HEIGHT + minute;
    return position;
  };

  // Calculate position for a task based on startTime or scheduledHour
  const getTaskPosition = (task: Task) => {
    if (task.startTime) {
      const time = new Date(task.startTime);
      const hour = time.getHours();
      const minute = time.getMinutes();
      
      if (hour < START_HOUR || hour >= END_HOUR) {
        return null; // Outside visible range
      }
      
      return (hour - START_HOUR) * HOUR_HEIGHT + minute;
    }
    
    if (task.scheduledHour !== null && task.scheduledHour !== undefined) {
      const hour = task.scheduledHour;
      const minute = task.scheduledMinute || 0;
      
      if (hour < START_HOUR || hour >= END_HOUR) {
        return null;
      }
      
      return (hour - START_HOUR) * HOUR_HEIGHT + minute;
    }
    
    return null;
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
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-gray-900">Timeline</h2>
        <p className="text-xs text-gray-500 mt-1">
          {START_HOUR === 6 ? '6' : START_HOUR}AM - {END_HOUR === 18 ? '6' : END_HOUR}PM
        </p>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
          {/* Hour grid */}
          {HOURS.map((hour, index) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-200"
              style={{ top: `${index * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              {/* Hour label */}
              <div className="sticky left-0 px-4 py-1">
                <span className="text-xs font-medium text-gray-500">
                  {formatHour(hour)}
                </span>
              </div>

              {/* 15-minute interval guides (subtle) */}
              {[15, 30, 45].map((minute) => (
                <div
                  key={minute}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: `${minute}px` }}
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
                className="absolute left-12 right-4 transition-all duration-150"
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
            <div className="absolute inset-0 flex items-center justify-center">
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
