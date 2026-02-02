/**
 * Mobile Time Blocks View
 * Accordion-style time blocks for mobile
 * Auto-expands current time block
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import type { Task } from '@/types';
import { MobileTaskCard } from './MobileTaskCard';

const TIME_BLOCKS = [
  { id: 'morning', label: 'Morning', timeRange: '6AM - 12PM', icon: '🌅', color: 'from-orange-400 to-yellow-400' },
  { id: 'afternoon', label: 'Afternoon', timeRange: '12PM - 5PM', icon: '☀️', color: 'from-yellow-400 to-orange-500' },
  { id: 'evening', label: 'Evening', timeRange: '5PM - 10PM', icon: '🌆', color: 'from-orange-500 to-purple-500' },
  { id: 'anytime', label: 'Anytime', timeRange: 'No specific time', icon: '🎯', color: 'from-purple-400 to-pink-400' },
];

interface MobileTimeBlocksViewProps {
  tasks: Task[];
  onTaskTap?: (task: Task) => void;
  onTaskStart?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
}

export function MobileTimeBlocksView({
  tasks,
  onTaskTap,
  onTaskStart,
  onTaskComplete,
}: MobileTimeBlocksViewProps) {
  // Determine which time block to expand by default based on current time
  const getCurrentTimeBlock = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'morning'; // Default to morning if outside work hours
  };

  const [expandedBlock, setExpandedBlock] = useState<string>(getCurrentTimeBlock());

  // Group tasks by time block
  const tasksByBlock = useMemo(() => {
    const grouped: Record<string, typeof tasks> = {
      morning: [],
      afternoon: [],
      evening: [],
      anytime: [],
    };

    tasks.forEach(task => {
      const block = task.timeBlock || 'anytime';
      if (grouped[block]) {
        grouped[block].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  // Calculate capacity per time block
  const blockCapacity: Record<string, number> = {
    morning: 360,    // 6 AM - 12 PM = 6 hours
    afternoon: 300,  // 12 PM - 5 PM = 5 hours
    evening: 300,    // 5 PM - 10 PM = 5 hours
    anytime: 0,      // No time limit
  };

  const getBlockUtilization = (blockId: string) => {
    const blockTasks = tasksByBlock[blockId] || [];
    const totalMinutes = blockTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
    const availableMinutes = blockCapacity[blockId] || 0;
    const utilizationPercent = availableMinutes > 0 ? Math.min(100, (totalMinutes / availableMinutes) * 100) : 0;
    const isOverbooked = totalMinutes > availableMinutes && availableMinutes > 0;

    return { totalMinutes, availableMinutes, utilizationPercent, isOverbooked };
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlock(expandedBlock === blockId ? '' : blockId);
  };

  return (
    <div className="divide-y divide-gray-200 bg-gray-50">
      {TIME_BLOCKS.map(block => {
        const isExpanded = expandedBlock === block.id;
        const blockTasks = tasksByBlock[block.id] || [];
        const completedCount = blockTasks.filter(t => t.completed || t.status === 'completed').length;
        const totalCount = blockTasks.length;
        const isCurrentBlock = getCurrentTimeBlock() === block.id;
        const { totalMinutes, availableMinutes, utilizationPercent, isOverbooked } = getBlockUtilization(block.id);

        return (
          <div key={block.id} className="bg-white">
            {/* Block Header - Always Visible */}
            <button
              onClick={() => toggleBlock(block.id)}
              className={`
                w-full p-3 flex items-center justify-between
                active:bg-gray-50 transition-colors
                touch-manipulation
                ${isCurrentBlock ? 'bg-blue-50/50' : ''}
              `}
            >
              <div className="flex items-center gap-2.5">
                {/* Icon */}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-xl
                  bg-gradient-to-br ${block.color}
                  shadow-sm
                `}>
                  {block.icon}
                </div>

                {/* Label & Time */}
                <div className="text-left">
                  <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                    {block.label}
                    {isCurrentBlock && (
                      <span className="text-[10px] font-medium px-1 py-0.5 bg-blue-500 text-white rounded">
                        Now
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-600">{block.timeRange}</p>
                </div>
              </div>

              {/* Task Count & Chevron */}
              <div className="flex items-center gap-1.5">
                {totalCount > 0 && (
                  <div className="text-right mr-1">
                    <div className="text-xs font-semibold text-gray-900">
                      {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
                    </div>
                    {completedCount > 0 && (
                      <div className="text-[10px] text-green-600 font-medium">
                        {completedCount} done
                      </div>
                    )}
                  </div>
                )}
                <ChevronDown
                  size={18}
                  className={`text-gray-400 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Capacity indicator - show for timed blocks */}
            {availableMinutes > 0 && totalCount > 0 && (
              <div className="px-3 pb-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOverbooked
                          ? 'bg-red-500'
                          : utilizationPercent > 75
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold whitespace-nowrap ${
                    isOverbooked ? 'text-red-600' : utilizationPercent > 75 ? 'text-amber-600' : 'text-gray-600'
                  }`}>
                    {totalMinutes}/{availableMinutes}m
                  </span>
                </div>
              </div>
            )}

            {/* Block Content - Collapsible */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 bg-gray-50">
                {totalCount === 0 ? (
                  <div className="py-8 text-center">
                    <div className="text-gray-400 text-3xl mb-1.5">📭</div>
                    <p className="text-gray-500 text-xs">
                      No tasks scheduled
                    </p>
                    <p className="text-gray-400 text-[10px] mt-0.5">
                      Tap + to add a task
                    </p>
                  </div>
                ) : (
                  blockTasks.map(task => (
                    <MobileTaskCard
                      key={task.id}
                      task={task}
                      onTap={() => onTaskTap?.(task)}
                      onStart={() => onTaskStart?.(task)}
                      onToggleComplete={() => onTaskComplete?.(task.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
