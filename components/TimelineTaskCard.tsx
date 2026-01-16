'use client';

import React from 'react';
import { Task, Project } from '@/types';
import { Clock } from 'lucide-react';

interface TimelineTaskCardProps {
  task: Task;
  project?: Project;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function TimelineTaskCard({
  task,
  project,
  isSelected = false,
  isHovered = false,
  onClick,
  onDragStart,
}: TimelineTaskCardProps) {
  const isCompleted = task.status === 'completed';
  
  // Calculate display time
  const getTimeDisplay = () => {
    if (task.startTime) {
      const time = new Date(task.startTime);
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${ampm}`;
    }
    if (task.scheduledHour !== null && task.scheduledHour !== undefined) {
      const hours = task.scheduledHour;
      const minutes = task.scheduledMinute || 0;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${ampm}`;
    }
    return null;
  };

  const timeDisplay = getTimeDisplay();
  const duration = task.estimatedDuration || task.estimatedMinutes || 30;

  return (
    <div
      className={`
        group relative bg-white rounded-lg shadow-sm border-l-4 px-3 py-2
        cursor-pointer transition-all duration-150
        ${isCompleted ? 'border-dashed opacity-60' : 'border-solid'}
        ${isSelected ? 'ring-2 ring-purple-500' : ''}
        ${isHovered ? 'ring-2 ring-purple-300' : ''}
        hover:shadow-md
      `}
      style={{
        borderLeftColor: project?.color || '#94a3b8',
        minHeight: '52px',
      }}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      {/* Title */}
      <div className={`
        text-sm font-medium line-clamp-2 mb-1
        ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}
      `}>
        {task.title}
      </div>

      {/* Time and duration */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {timeDisplay && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{timeDisplay}</span>
          </div>
        )}
        {duration && (
          <span className="text-gray-400">
            {duration} min
          </span>
        )}
      </div>

      {/* Status indicator for in-progress */}
      {task.status === 'in-progress' && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}
