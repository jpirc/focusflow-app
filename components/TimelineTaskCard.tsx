'use client';

import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { Clock, Edit2, X } from 'lucide-react';

interface TimelineTaskCardProps {
  task: Task;
  project?: Project;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onEdit?: (task: Task) => void;
  onUnschedule?: (taskId: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  displayTime?: string; // Pass the calculated time from parent
}

export default function TimelineTaskCard({
  task,
  project,
  isSelected = false,
  isHovered = false,
  onClick,
  onEdit,
  onUnschedule,
  onDragStart,
  displayTime,
}: TimelineTaskCardProps) {
  const isCompleted = task.status === 'completed';
  const [showActions, setShowActions] = useState(false);
  
  // Get background color based on project color with opacity
  const getBgColor = () => {
    if (!project?.color) return 'bg-gray-50/50';
    // Convert hex to RGB and add opacity
    const hex = project.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  };
  
  // Calculate display time
  const getTimeDisplay = () => {
    // Use passed displayTime if available
    if (displayTime) return displayTime;
    
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

  // Debug: Log when rendering
  console.log('[TimelineTaskCard] Rendering:', task.title, 'timeBlock:', task.timeBlock);

  return (
    <div
      className={`
        group relative rounded-lg shadow-sm border-l-4 px-2 py-1
        cursor-pointer transition-all duration-150 h-full flex flex-col overflow-hidden
        ${isCompleted ? 'border-dashed opacity-60' : 'border-solid'}
        ${isSelected ? 'ring-2 ring-purple-500' : ''}
        ${isHovered ? 'ring-2 ring-purple-300' : ''}
        hover:shadow-md
      `}
      style={{
        borderLeftColor: project?.color || '#94a3b8',
        backgroundColor: getBgColor(),
      }}
      onClick={onClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onEdit) onEdit(task);
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      draggable
      onDragStart={onDragStart}
    >
      {/* Action buttons - show on hover */}
      {showActions && (
        <div className="absolute top-1 right-1 flex gap-1 z-10">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-0.5 bg-white/90 hover:bg-blue-100 rounded shadow-sm transition-colors"
              title="Edit task"
            >
              <Edit2 size={10} className="text-blue-600" />
            </button>
          )}
          {onUnschedule && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnschedule(task.id);
              }}
              className="p-0.5 bg-white/90 hover:bg-red-100 rounded shadow-sm transition-colors"
              title="Unschedule (move to time block)"
            >
              <X size={10} className="text-red-600" />
            </button>
          )}
        </div>
      )}
      {/* Time - compact at top */}
      {timeDisplay && (
        <div className="flex items-center gap-0.5 text-xs font-semibold text-gray-700 flex-shrink-0">
          <Clock className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="whitespace-nowrap text-[10px] leading-tight">{timeDisplay}</span>
        </div>
      )}

      {/* Title - truncate if needed */}
      <div className={`
        text-xs font-medium truncate flex-1 leading-tight mt-0.5
        ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}
      `}>
        {task.title}
      </div>

      {/* Status indicator for in-progress */}
      {task.status === 'in-progress' && (
        <div className="absolute top-1 right-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}
