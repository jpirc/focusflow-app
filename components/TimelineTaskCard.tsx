'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Task, Project } from '@/types';
import { Clock, Edit2, X, Play, Timer } from 'lucide-react';

interface TimelineTaskCardProps {
  task: Task;
  project?: Project;
  allProjects?: Project[]; // All available projects for selection
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onEdit?: (task: Task) => void;
  onUnschedule?: (taskId: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  displayTime?: string; // Pass the calculated time from parent
  onStartNow?: (taskId: string) => void; // Quick start without timer
  onStartPomodoro?: (task: Task) => void; // Start with Pomodoro timer
  onProjectChange?: (taskId: string, projectId: string | null) => void; // Quick project assignment
  onDurationChange?: (taskId: string, newMinutes: number) => void; // Duration change from resize
  compact?: boolean; // Use compact styling for overlapping tasks
}

function TimelineTaskCardComponent({
  task,
  project,
  allProjects,
  isSelected = false,
  isHovered = false,
  onClick,
  onEdit,
  onUnschedule,
  onDragStart,
  displayTime,
  onStartNow,
  onStartPomodoro,
  onProjectChange,
  onDurationChange,
  compact = false,
}: TimelineTaskCardProps) {
  const isCompleted = task.status === 'completed';
  const [showActions, setShowActions] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
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

  // Determine layout mode based on task duration
  // Short tasks need horizontal layout to fit all info
  const isShortTask = duration <= 45; // 45 min or less = single line
  const isMediumTask = duration > 45 && duration <= 90; // 45-90 min = two lines
  const isLongTask = duration > 90; // 90+ min = full vertical layout

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

  // Handle resize drag
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startY = e.clientY;
    const startHeight = cardRef.current?.offsetHeight || 0;
    const hourHeight = 80; // Match HOUR_HEIGHT from TimelinePanel

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(24, startHeight + deltaY); // Min 24px
      const newMinutes = Math.round((newHeight / hourHeight) * 60);
      const snappedMinutes = Math.round(newMinutes / 15) * 15; // Snap to 15min

      if (cardRef.current) {
        cardRef.current.style.height = `${newHeight}px`;
      }

      // Show duration preview
      if (cardRef.current) {
        const preview = cardRef.current.querySelector('.resize-preview') as HTMLElement;
        if (preview) {
          preview.textContent = `${snappedMinutes}m`;
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      const finalHeight = cardRef.current?.offsetHeight || 0;
      const finalMinutes = Math.round((finalHeight / hourHeight) * 60);
      const snappedMinutes = Math.round(finalMinutes / 15) * 15;

      if (onDurationChange && snappedMinutes !== (task.estimatedMinutes || 30)) {
        onDurationChange(task.id, snappedMinutes);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Debug: Log when rendering
  console.log('[TimelineTaskCard] Rendering:', task.title, 'timeBlock:', task.timeBlock);

  return (
    <div
      ref={cardRef}
      className={`
        group relative rounded-lg shadow-sm cursor-pointer transition-all duration-150 h-full flex flex-col overflow-hidden
        ${compact ? 'border-l-2 px-1 py-0.5' : 'border-l-4 px-2 py-1'}
        ${isCompleted ? 'border-dashed opacity-60' : 'border-solid'}
        ${isSelected ? 'ring-2 ring-purple-500' : ''}
        ${isHovered ? 'ring-2 ring-purple-300' : ''}
        ${isResizing ? 'ring-2 ring-blue-400' : ''}
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
        setShowProjectMenu(false);
      }}
      draggable={!isResizing}
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
      {showActions && !isCompleted && (
        <div className={`absolute top-0.5 right-0.5 flex gap-0.5 z-10 ${compact ? 'scale-90' : ''}`}>
          {/* Start Now - Quick start without timer */}
          {onStartNow && task.status !== 'in-progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartNow(task.id);
              }}
              className={`${compact ? 'p-0.5' : 'p-1'} bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition-colors`}
              title="Start Now (Quick Start)"
            >
              <Play size={compact ? 10 : 12} fill="currentColor" />
            </button>
          )}
          {/* Start Pomodoro - Start with 25min timer */}
          {onStartPomodoro && task.status !== 'in-progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartPomodoro(task);
              }}
              className={`${compact ? 'p-0.5' : 'p-1'} bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition-colors`}
              title="Start Pomodoro (25 min)"
            >
              <Timer size={compact ? 10 : 12} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-0.5 bg-white/90 hover:bg-blue-100 rounded shadow-sm transition-colors"
              title="Edit task"
            >
              <Edit2 size={compact ? 8 : 10} className="text-blue-600" />
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
              <X size={compact ? 8 : 10} className="text-red-600" />
            </button>
          )}
        </div>
      )}
      {/* Adaptive Layout Based on Task Duration */}

      {/* SHORT TASK (≤45 min): Single horizontal line, title first */}
      {isShortTask && (
        <div className="flex items-center gap-1 min-w-0">
          {/* Title - LEAD with this, larger font */}
          <span className={`font-semibold truncate text-[10px] ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </span>

          {/* Subtask indicator */}
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="flex-shrink-0 text-[7px] px-0.5 py-0 rounded bg-purple-100 text-purple-700 font-semibold" title={`${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} steps`}>
              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
            </span>
          )}

          {/* Metadata - smaller, secondary */}
          <div className="flex items-center gap-0.5 flex-shrink-0 text-[8px] text-gray-500">
            {/* Project dot */}
            {project && (
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: project.color }}
                title={project.name}
              />
            )}

            {/* Time */}
            {timeDisplay && (
              <>
                <span className="text-gray-400">•</span>
                <Clock className="w-2 h-2" />
                <span className="whitespace-nowrap">{timeDisplay}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* MEDIUM TASK (45-90 min): Two lines - title first, then metadata */}
      {isMediumTask && (
        <div className="space-y-0.5">
          {/* Line 1: Title - LEAD with this, larger and bold */}
          <div className="flex items-center gap-1">
            <div className={`text-[11px] font-semibold truncate leading-tight ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </div>
            {/* Subtask indicator */}
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="flex-shrink-0 text-[7px] px-0.5 py-0 rounded bg-purple-100 text-purple-700 font-semibold" title={`${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} steps`}>
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
              </span>
            )}
          </div>

          {/* Line 2: Time + Project - smaller, secondary */}
          <div className="flex items-center gap-1 text-[8px] text-gray-500">
            {timeDisplay && (
              <>
                <Clock className="w-2 h-2 flex-shrink-0" />
                <span className="whitespace-nowrap">{timeDisplay}</span>
              </>
            )}
            {project && (
              <>
                <span className="text-gray-400">•</span>
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate max-w-[70px]">{project.name}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* LONG TASK (>90 min): Full vertical layout, title first */}
      {isLongTask && (
        <>
          {/* Title - LEAD with this, largest and bold */}
          <div className="flex items-center gap-1">
            <div className={`text-xs font-semibold leading-tight ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </div>
            {/* Subtask indicator */}
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="flex-shrink-0 text-[8px] px-1 py-0 rounded bg-purple-100 text-purple-700 font-semibold" title={`${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} steps`}>
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
              </span>
            )}
          </div>

          {/* Time - secondary info */}
          {timeDisplay && (
            <div className="flex items-center gap-0.5 text-gray-500 flex-shrink-0 text-[9px] mt-0.5">
              <Clock className="w-2 h-2" />
              <span className="whitespace-nowrap">{timeDisplay}</span>
            </div>
          )}

          {/* Project indicator - clickable to change */}
          {(project || (showActions && onProjectChange)) && (
            <div className="relative mt-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProjectMenu(!showProjectMenu);
                }}
                className="flex items-center gap-0.5 text-[9px] text-gray-500 hover:bg-white/50 rounded px-0.5 transition-colors"
                title="Change project"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project?.color || '#94a3b8' }}
                />
                <span className="truncate max-w-[70px]">{project?.name || 'No project'}</span>
              </button>

              {/* Project dropdown menu */}
              {showProjectMenu && allProjects && typeof window !== 'undefined' && createPortal(
                <div
                  className="fixed bg-white border border-gray-300 rounded shadow-lg py-1 max-h-48 overflow-y-auto z-[10000]"
                  style={{
                    left: cardRef.current?.getBoundingClientRect().left,
                    top: (cardRef.current?.getBoundingClientRect().top || 0) + 20,
                    minWidth: '150px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      if (onProjectChange) onProjectChange(task.id, null);
                      setShowProjectMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    No project
                  </button>
                  {allProjects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (onProjectChange) onProjectChange(task.id, p.id);
                        setShowProjectMenu(false);
                      }}
                      className="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 flex items-center gap-2"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>
          )}
        </>
      )}

      {/* Resize handle at bottom */}
      {!isCompleted && onDurationChange && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          onMouseDown={handleResizeStart}
        >
          <div className="w-8 h-0.5 bg-gray-400 rounded" />
          {isResizing && (
            <div className="resize-preview absolute -top-5 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg font-semibold">
              {duration}m
            </div>
          )}
        </div>
      )}

      {/* Status indicator for in-progress */}
      {task.status === 'in-progress' && !showActions && (
        <div className={`absolute ${compact ? 'top-0.5 right-0.5' : 'top-1 right-1'}`}>
          <div className={`${compact ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-blue-500 rounded-full animate-pulse`} />
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
      prevProps.displayTime === nextProps.displayTime &&
      prevProps.compact === nextProps.compact &&
      prevProps.onStartNow === nextProps.onStartNow &&
      prevProps.onStartPomodoro === nextProps.onStartPomodoro
    );
  }
);

export default TimelineTaskCard;
