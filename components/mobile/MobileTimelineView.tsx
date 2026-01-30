/**
 * Mobile Timeline View
 * Google Calendar style agenda format
 * Groups tasks by hour with timeline visual
 */

'use client';

import { useMemo } from 'react';
import type { Task } from '@/types';
import { MobileTaskCard } from './MobileTaskCard';
import { Clock } from 'lucide-react';

interface MobileTimelineViewProps {
  tasks: Task[];
  onTaskTap?: (task: Task) => void;
  onTaskStart?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
}

export function MobileTimelineView({
  tasks,
  onTaskTap,
  onTaskStart,
  onTaskComplete,
}: MobileTimelineViewProps) {
  // Group tasks by hour
  const tasksByHour = useMemo(() => {
    const grouped: Record<number, typeof tasks> = {};
    const unscheduled: typeof tasks = [];

    tasks.forEach(task => {
      if (task.scheduledHour !== null && task.scheduledHour !== undefined) {
        const hour = task.scheduledHour;
        if (!grouped[hour]) {
          grouped[hour] = [];
        }
        grouped[hour].push(task);
      } else {
        unscheduled.push(task);
      }
    });

    // Sort tasks within each hour by minute
    Object.keys(grouped).forEach(hourStr => {
      const hour = parseInt(hourStr);
      grouped[hour].sort((a, b) => {
        const aMin = a.scheduledMinute || 0;
        const bMin = b.scheduledMinute || 0;
        return aMin - bMin;
      });
    });

    return { grouped, unscheduled };
  }, [tasks]);

  // Generate hours for the day (6 AM to 10 PM)
  const hours = useMemo(() => {
    const result = [];
    for (let hour = 6; hour <= 22; hour++) {
      result.push(hour);
    }
    return result;
  }, []);

  // Format hour for display
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Get current hour for highlighting
  const currentHour = new Date().getHours();

  // Filter hours that have tasks or are close to current time
  const relevantHours = useMemo(() => {
    return hours.filter(hour => {
      // Show if has tasks
      if (tasksByHour.grouped[hour] && tasksByHour.grouped[hour].length > 0) {
        return true;
      }
      // Show hours within 2 hours of current time
      return Math.abs(hour - currentHour) <= 2;
    });
  }, [hours, tasksByHour.grouped, currentHour]);

  return (
    <div className="bg-white">
      {/* Current Time Indicator */}
      <div className="sticky top-0 z-10 bg-blue-50 border-b border-blue-200 px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-blue-700">
          <Clock size={14} />
          <span className="text-xs font-medium">
            {formatHour(currentHour)} - Now
          </span>
        </div>
      </div>

      {/* Unscheduled Tasks Section */}
      {tasksByHour.unscheduled.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="px-3 py-2 bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-700">Unscheduled</h4>
          </div>
          <div className="px-3 py-2 space-y-2">
            {tasksByHour.unscheduled.map(task => (
              <MobileTaskCard
                key={task.id}
                task={task}
                onTap={() => onTaskTap?.(task)}
                onStart={() => onTaskStart?.(task)}
                onToggleComplete={() => onTaskComplete?.(task.id)}
                showTime={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Timeline by Hour */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {relevantHours.map((hour, index) => {
          const hourTasks = tasksByHour.grouped[hour] || [];
          const isCurrentHour = hour === currentHour;
          const isPastHour = hour < currentHour;

          return (
            <div
              key={hour}
              className={`relative ${index !== relevantHours.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              {/* Hour Header */}
              <div className={`flex items-start gap-3 px-3 py-2 ${isCurrentHour ? 'bg-blue-50/30' : ''}`}>
                {/* Time Label */}
                <div className="flex-shrink-0 w-12 pt-0.5">
                  <div
                    className={`text-xs font-semibold ${
                      isCurrentHour ? 'text-blue-600' : isPastHour ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {formatHour(hour)}
                  </div>
                </div>

                {/* Tasks or Empty State */}
                <div className="flex-1 space-y-2 pb-1">
                  {hourTasks.length === 0 ? (
                    <div className={`text-[11px] ${isPastHour ? 'text-gray-300' : 'text-gray-400'} italic py-1`}>
                      No tasks scheduled
                    </div>
                  ) : (
                    hourTasks.map(task => (
                      <MobileTaskCard
                        key={task.id}
                        task={task}
                        onTap={() => onTaskTap?.(task)}
                        onStart={() => onTaskStart?.(task)}
                        onToggleComplete={() => onTaskComplete?.(task.id)}
                        showTime={true}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Current Time Marker */}
              {isCurrentHour && (
                <div className="absolute left-3 top-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {relevantHours.length === 0 && tasksByHour.unscheduled.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-gray-300 text-4xl mb-2">📅</div>
          <p className="text-gray-500 font-medium text-sm">No tasks scheduled today</p>
          <p className="text-gray-400 text-xs mt-0.5">Tap + to add your first task</p>
        </div>
      )}
    </div>
  );
}
