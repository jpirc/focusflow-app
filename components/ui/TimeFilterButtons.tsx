/**
 * TimeFilterButtons Component
 * Quick filter buttons for "I Have X Minutes" feature
 * Helps with ADHD time blindness by showing only tasks that fit available time
 */

'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface TimeFilterButtonsProps {
  activeFilter: number | null;
  onFilterChange: (minutes: number | null) => void;
  taskCounts?: {
    '15': number;
    '30': number;
    '60': number;
    '120': number;
    all: number;
  };
}

const FILTER_OPTIONS = [
  { label: '15m', minutes: 15, emoji: '⚡' },
  { label: '30m', minutes: 30, emoji: '🎯' },
  { label: '1h', minutes: 60, emoji: '⏰' },
  { label: '2h', minutes: 120, emoji: '📚' },
] as const;

export function TimeFilterButtons({
  activeFilter,
  onFilterChange,
  taskCounts,
}: TimeFilterButtonsProps) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2">
        <Clock size={12} className="text-gray-500" />
        <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
          I Have...
        </h3>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-1 px-2">
        {FILTER_OPTIONS.map(({ label, minutes, emoji }) => {
          const isActive = activeFilter === minutes;
          const count = taskCounts ? taskCounts[String(minutes) as keyof typeof taskCounts] : undefined;

          return (
            <button
              key={minutes}
              onClick={() => onFilterChange(isActive ? null : minutes)}
              className={`
                flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-all
                ${isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              title={`Show tasks ≤ ${label}`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              {count !== undefined && (
                <span className={`
                  text-[9px] px-1 rounded
                  ${isActive ? 'bg-blue-400' : 'bg-gray-200 text-gray-600'}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* All/Clear Button */}
        <button
          onClick={() => onFilterChange(null)}
          className={`
            px-2 py-1 text-[10px] font-medium rounded transition-all
            ${activeFilter === null
              ? 'bg-gray-700 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
          title="Show all tasks"
        >
          All
          {taskCounts && (
            <span className={`
              ml-1 text-[9px] px-1 rounded
              ${activeFilter === null ? 'bg-gray-600' : 'bg-gray-200'}
            `}>
              {taskCounts.all}
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Indicator */}
      {activeFilter !== null && (
        <div className="px-2">
          <p className="text-[9px] text-blue-600 font-medium">
            Showing tasks ≤ {activeFilter} min
          </p>
        </div>
      )}
    </div>
  );
}
