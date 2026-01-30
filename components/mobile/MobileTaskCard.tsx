/**
 * Mobile Task Card
 * Touch-optimized task card for mobile devices
 * Minimum 44x44px touch targets, clear hierarchy, swipe support
 */

'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Play, Clock, ChevronRight, MoreHorizontal } from 'lucide-react';
import type { Task } from '@/types';

interface MobileTaskCardProps {
  task: Task;
  onTap?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onToggleComplete?: () => void;
  showProject?: boolean;
  showTime?: boolean;
}

export function MobileTaskCard({
  task,
  onTap,
  onStart,
  onComplete,
  onToggleComplete,
  showProject = true,
  showTime = true,
}: MobileTaskCardProps) {
  const [pressing, setPressing] = useState(false);

  const isCompleted = task.completed || task.status === 'completed';
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasSubtasks = totalSubtasks > 0;

  // Format time
  const formatTime = (hour?: number | null, minute?: number | null) => {
    if (hour === null || hour === undefined) return null;
    const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const m = minute ? `:${minute.toString().padStart(2, '0')}` : '';
    return `${h}${m} ${ampm}`;
  };

  const timeString = formatTime(task.scheduledHour, task.scheduledMinute);

  // Simple color mapping based on priority for border
  const getBorderColor = () => {
    if (task.priority === 'urgent') return '#ef4444';
    if (task.priority === 'high') return '#f97316';
    if (task.priority === 'medium') return '#3b82f6';
    return '#9333ea'; // low or default
  };

  return (
    <div
      onClick={onTap}
      onTouchStart={() => setPressing(true)}
      onTouchEnd={() => setPressing(false)}
      onTouchCancel={() => setPressing(false)}
      className={`
        bg-white rounded-lg border-l-4 shadow-sm
        transition-all touch-manipulation
        ${pressing ? 'scale-[0.98] bg-gray-50' : 'active:scale-[0.98] active:bg-gray-50'}
        ${isCompleted ? 'opacity-60' : ''}
      `}
      style={{
        borderLeftColor: getBorderColor(),
      }}
    >
      {/* Main Content */}
      <div className="p-2.5">
        {/* Top Row: Checkbox + Title + Menu */}
        <div className="flex items-start gap-2 mb-1.5">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete?.() || onComplete?.();
            }}
            className="flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center -ml-1.5 -mt-1.5 text-gray-400 hover:text-green-600 active:scale-95 transition-all touch-manipulation"
          >
            {isCompleted ? (
              <CheckCircle2 size={24} className="text-green-600 fill-current" />
            ) : (
              <Circle size={24} />
            )}
          </button>

          {/* Title & Time */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className={`text-sm font-medium text-gray-900 line-clamp-2 leading-snug ${isCompleted ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            {showTime && timeString && (
              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                <Clock size={11} />
                {timeString}
              </p>
            )}
          </div>

          {/* Menu Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTap?.();
            }}
            className="flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center -mr-1.5 -mt-1.5 text-gray-400 active:text-gray-600 active:bg-gray-100 rounded-lg transition-all touch-manipulation"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2 pl-9">

          {/* Time Estimate */}
          {task.estimatedMinutes && task.estimatedMinutes > 0 && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] flex items-center gap-0.5">
              <Clock size={10} />
              {task.estimatedMinutes}m
            </span>
          )}

          {/* Priority */}
          {task.priority && task.priority !== 'medium' && (
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                task.priority === 'urgent'
                  ? 'bg-red-100 text-red-700'
                  : task.priority === 'high'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {task.priority}
            </span>
          )}
        </div>

        {/* Subtasks Progress */}
        {hasSubtasks && (
          <div className="pl-9 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isCompleted && (
          <div className="flex gap-1.5 pl-9">
            {onStart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStart();
                }}
                className="flex-1 min-h-[38px] bg-blue-500 text-white rounded-lg font-medium text-xs active:bg-blue-600 flex items-center justify-center gap-1.5 transition-colors touch-manipulation"
              >
                <Play size={14} fill="currentColor" />
                Start
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTap?.();
              }}
              className="px-3 min-h-[38px] bg-gray-100 text-gray-700 rounded-lg font-medium text-xs active:bg-gray-200 flex items-center justify-center gap-1 transition-colors touch-manipulation"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
