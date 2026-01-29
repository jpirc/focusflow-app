/**
 * Mobile Time Blocks View
 * Accordion-style time blocks for mobile
 * Auto-expands current time block
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import type { Task, Project } from '@prisma/client';
import { MobileTaskCard } from './MobileTaskCard';

const TIME_BLOCKS = [
  { id: 'morning', label: 'Morning', timeRange: '6AM - 12PM', icon: '🌅', color: 'from-orange-400 to-yellow-400' },
  { id: 'afternoon', label: 'Afternoon', timeRange: '12PM - 5PM', icon: '☀️', color: 'from-yellow-400 to-orange-500' },
  { id: 'evening', label: 'Evening', timeRange: '5PM - 10PM', icon: '🌆', color: 'from-orange-500 to-purple-500' },
  { id: 'anytime', label: 'Anytime', timeRange: 'No specific time', icon: '🎯', color: 'from-purple-400 to-pink-400' },
];

interface MobileTimeBlocksViewProps {
  tasks: (Task & {
    project?: Project | null;
    subtasks?: Task[];
  })[];
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

        return (
          <div key={block.id} className="bg-white">
            {/* Block Header - Always Visible */}
            <button
              onClick={() => toggleBlock(block.id)}
              className={`
                w-full p-4 flex items-center justify-between
                active:bg-gray-50 transition-colors
                touch-manipulation
                ${isCurrentBlock ? 'bg-blue-50/50' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                  bg-gradient-to-br ${block.color}
                  shadow-sm
                `}>
                  {block.icon}
                </div>

                {/* Label & Time */}
                <div className="text-left">
                  <h3 className="font-semibold text-base text-gray-900 flex items-center gap-2">
                    {block.label}
                    {isCurrentBlock && (
                      <span className="text-xs font-medium px-1.5 py-0.5 bg-blue-500 text-white rounded">
                        Now
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{block.timeRange}</p>
                </div>
              </div>

              {/* Task Count & Chevron */}
              <div className="flex items-center gap-2">
                {totalCount > 0 && (
                  <div className="text-right mr-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
                    </div>
                    {completedCount > 0 && (
                      <div className="text-xs text-green-600 font-medium">
                        {completedCount} done
                      </div>
                    )}
                  </div>
                )}
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Block Content - Collapsible */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 bg-gray-50">
                {totalCount === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-gray-400 text-4xl mb-2">📭</div>
                    <p className="text-gray-500 text-sm">
                      No tasks scheduled
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
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
