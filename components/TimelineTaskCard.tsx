'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

function TimelineTaskCardComponent({
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
  const [showTooltip, setShowTooltip] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = React.useState<React.CSSProperties>({});
  
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

  // Calculate tooltip position when showing
  React.useEffect(() => {
    if (showTooltip && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipStyle({
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top - 8}px`, // 8px above the card
        transform: 'translateY(-100%)', // Move up by its own height
      });
    }
  }, [showTooltip]);

  // Debug: Log when rendering
  console.log('[TimelineTaskCard] Rendering:', task.title, 'timeBlock:', task.timeBlock);

  return (
    <div
      ref={cardRef}
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
      onMouseEnter={() => {
        setShowActions(true);
        setShowTooltip(true);
      }}
      onMouseLeave={() => {
        setShowActions(false);
        setShowTooltip(false);
      }}
      draggable
      onDragStart={onDragStart}
    >
      {/* Tooltip - rendered via portal to escape stacking context */}
      {showTooltip && typeof window !== 'undefined' && createPortal(
        <div
          className="w-72 bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-3 pointer-events-none"
          style={{
            ...tooltipStyle,
            backgroundColor: '#ffffff',
            opacity: 1,
            zIndex: 9999,
          }}
        >
          <div className="space-y-2">
            {/* Project */}
            {project && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-xs font-medium text-gray-700 truncate">
                  {project.name}
                </span>
              </div>
            )}

            {/* Title */}
            <h4 className="text-sm font-semibold text-gray-900 break-words">
              {task.title}
            </h4>

            {/* Time Info */}
            <div className="text-xs text-gray-600 space-y-1">
              {timeDisplay && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{timeDisplay}</span>
                </div>
              )}
              <div>Duration: {duration} min</div>
              {task.status === 'in-progress' && task.startedAt && (
                <div className="text-blue-600 font-medium">
                  Started: {new Date(task.startedAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </div>
              )}
              {task.status === 'completed' && task.completedAt && (
                <div className="text-green-600 font-medium">
                  Completed: {new Date(task.completedAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                  {task.actualMinutes && ` (${task.actualMinutes} min)`}
                </div>
              )}
            </div>

            {/* Description if exists */}
            {task.description && (
              <p className="text-xs text-gray-600 border-t pt-2 line-clamp-3">
                {task.description}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-1 text-[10px]">
              {task.priority && (
                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                  {task.priority}
                </span>
              )}
              {task.energyLevel && (
                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                  {task.energyLevel} energy
                </span>
              )}
            </div>
          </div>

          {/* Tooltip arrow pointing down */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-300" />
          <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" style={{ marginTop: '-2px' }} />
        </div>,
        document.body
      )}

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

// Memoize to prevent re-renders
const TimelineTaskCard = React.memo(
  TimelineTaskCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.task === nextProps.task &&
      prevProps.project?.id === nextProps.project?.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isHovered === nextProps.isHovered &&
      prevProps.displayTime === nextProps.displayTime
    );
  }
);

export default TimelineTaskCard;
