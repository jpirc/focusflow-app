/**
 * TimeBudget Component
 * Visual indicator showing scheduled time vs available time
 * Helps ADHD users avoid over-scheduling
 *
 * Enhanced to show:
 * - Progress throughout the day (includes completed tasks)
 * - Configurable time range (e.g., 9-5, 8-6)
 * - Total time spent vs remaining time
 */

'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

interface TimeBudgetProps {
  scheduledMinutes: number;
  completedMinutes?: number; // Minutes of completed tasks (NEW)
  availableMinutes?: number; // Default: 8 hours (480 min)
  mode?: 'full' | 'compact' | 'minimal'; // Display mode
  startHour?: number; // Start of work day (e.g., 9 for 9am)
  endHour?: number; // End of work day (e.g., 17 for 5pm)
}

export function TimeBudget({
  scheduledMinutes,
  completedMinutes = 0,
  availableMinutes = 480, // 8 hour default work day
  mode = 'full',
  startHour = 8,
  endHour = 18,
}: TimeBudgetProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate hours from time range if not explicitly set
  const calculatedAvailableHours = endHour - startHour;
  const actualAvailableMinutes = availableMinutes || (calculatedAvailableHours * 60);

  const scheduledHours = (scheduledMinutes / 60).toFixed(1);
  const completedHours = (completedMinutes / 60).toFixed(1);
  const availableHours = (actualAvailableMinutes / 60).toFixed(1);

  // Calculate percentages
  const scheduledPercentage = Math.min((scheduledMinutes / actualAvailableMinutes) * 100, 100);
  const completedPercentage = Math.min((completedMinutes / actualAvailableMinutes) * 100, 100);
  const totalPercentage = Math.min(((scheduledMinutes + completedMinutes) / actualAvailableMinutes) * 100, 100);

  const isOverbooked = (scheduledMinutes + completedMinutes) > actualAvailableMinutes;

  // Color coding: green < 80%, yellow 80-100%, red > 100%
  const getColor = () => {
    if (isOverbooked) return 'bg-red-500';
    if (totalPercentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (isOverbooked) return 'text-red-600';
    if (totalPercentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (isOverbooked) return 'Overbooked';
    if (totalPercentage >= 80) return 'Almost full';
    if (totalPercentage >= 50) return 'Good pace';
    return 'Light day';
  };

  // Minimal mode: Just a thin bar with completed + scheduled
  if (mode === 'minimal') {
    return (
      <div
        className="relative group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden relative">
          {/* Completed portion (darker green) */}
          <div
            className="absolute h-full bg-green-600 transition-all duration-300"
            style={{ width: `${completedPercentage}%` }}
          />
          {/* Scheduled portion (lighter) */}
          <div
            className={`absolute h-full transition-all duration-300 ${getColor()}`}
            style={{
              left: `${completedPercentage}%`,
              width: `${scheduledPercentage}%`
            }}
          />
        </div>
        {isOverbooked && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 opacity-30 rounded-full animate-pulse" />
        )}

        {/* Tooltip on hover */}
        {showTooltip && (
          <div className="absolute z-50 left-0 top-full mt-1 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
            <div>✓ {completedHours}h completed</div>
            <div>⏳ {scheduledHours}h scheduled</div>
            <div className="border-t border-gray-700 mt-0.5 pt-0.5">
              {availableHours}h available ({startHour}am-{endHour > 12 ? endHour - 12 : endHour}{endHour >= 12 ? 'pm' : 'am'})
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact mode: Bar + inline text with completed/scheduled breakdown
  if (mode === 'compact') {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-500 font-medium flex items-center gap-1">
            <CheckCircle2 size={9} className="text-green-600" />
            <span className="text-green-600">{completedHours}h</span>
            <span>+</span>
            <Clock size={9} />
            <span>{scheduledHours}h</span>
            <span className="text-gray-400">/</span>
            <span>{availableHours}h</span>
          </span>
          <span className={`text-[9px] font-semibold ${getTextColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <div className="relative">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden relative">
            {/* Completed portion (darker green) */}
            <div
              className="absolute h-full bg-green-600 transition-all duration-300"
              style={{ width: `${completedPercentage}%` }}
            />
            {/* Scheduled portion (lighter) */}
            <div
              className={`absolute h-full transition-all duration-300 ${getColor()}`}
              style={{
                left: `${completedPercentage}%`,
                width: `${scheduledPercentage}%`
              }}
            />
          </div>
          {isOverbooked && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 opacity-30 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  // Full mode: Original design with completed/scheduled breakdown
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-600">
          <Clock size={12} />
          <span className="font-medium">Time Budget</span>
          <span className="text-[9px] text-gray-400">
            ({startHour}am-{endHour > 12 ? endHour - 12 : endHour}{endHour >= 12 ? 'pm' : 'am'})
          </span>
        </div>
        <span className={`font-semibold ${getTextColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Progress Bar with completed + scheduled */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative">
          {/* Completed portion (darker green) */}
          <div
            className="absolute h-full bg-green-600 transition-all duration-300"
            style={{ width: `${completedPercentage}%` }}
          />
          {/* Scheduled portion (lighter) */}
          <div
            className={`absolute h-full transition-all duration-300 ${getColor()}`}
            style={{
              left: `${completedPercentage}%`,
              width: `${scheduledPercentage}%`
            }}
          />
        </div>
        {/* Overbooked indicator */}
        {isOverbooked && (
          <div className="absolute top-0 left-0 right-0 h-2 bg-red-500 opacity-30 rounded-full animate-pulse" />
        )}
      </div>

      {/* Details with completed + scheduled */}
      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <CheckCircle2 size={10} className="text-green-600" />
          <span className="text-green-600 font-medium">{completedHours}h</span>
          <span className="text-gray-400">+</span>
          <Clock size={10} className="text-gray-500" />
          <span className="font-medium text-gray-700">{scheduledHours}h</span>
        </div>
        <span>
          Available: <span className="font-medium text-gray-700">{availableHours}h</span>
        </span>
      </div>

      {/* Warning message for overbooked days */}
      {isOverbooked && (
        <div className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded">
          You&apos;ve scheduled {((scheduledMinutes + completedMinutes - actualAvailableMinutes) / 60).toFixed(1)} hours more than available. Consider moving some tasks.
        </div>
      )}
    </div>
  );
}
