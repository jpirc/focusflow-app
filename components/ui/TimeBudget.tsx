/**
 * TimeBudget Component
 * Visual indicator showing scheduled time vs available time
 * Helps ADHD users avoid over-scheduling
 */

'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface TimeBudgetProps {
  scheduledMinutes: number;
  availableMinutes?: number; // Default: 8 hours (480 min)
  mode?: 'full' | 'compact' | 'minimal'; // Display mode
}

export function TimeBudget({
  scheduledMinutes,
  availableMinutes = 480, // 8 hour default work day
  mode = 'full',
}: TimeBudgetProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const scheduledHours = (scheduledMinutes / 60).toFixed(1);
  const availableHours = (availableMinutes / 60).toFixed(1);
  const percentage = Math.min((scheduledMinutes / availableMinutes) * 100, 100);
  const isOverbooked = scheduledMinutes > availableMinutes;

  // Color coding: green < 80%, yellow 80-100%, red > 100%
  const getColor = () => {
    if (isOverbooked) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (isOverbooked) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (isOverbooked) return 'Overbooked';
    if (percentage >= 80) return 'Almost full';
    if (percentage >= 50) return 'Good pace';
    return 'Light day';
  };

  // Minimal mode: Just a thin bar
  if (mode === 'minimal') {
    return (
      <div
        className="relative group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {isOverbooked && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 opacity-30 rounded-full animate-pulse" />
        )}

        {/* Tooltip on hover */}
        {showTooltip && (
          <div className="absolute z-50 left-0 top-full mt-1 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {scheduledHours}h / {availableHours}h ({percentage.toFixed(0)}%)
          </div>
        )}
      </div>
    );
  }

  // Compact mode: Bar + inline text
  if (mode === 'compact') {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-500 font-medium flex items-center gap-0.5">
            <Clock size={9} />
            {scheduledHours}h/{availableHours}h
          </span>
          <span className={`text-[9px] font-semibold ${getTextColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <div className="relative">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {isOverbooked && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 opacity-30 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  // Full mode: Original design
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-600">
          <Clock size={12} />
          <span className="font-medium">Time Budget</span>
        </div>
        <span className={`font-semibold ${getTextColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Overbooked indicator */}
        {isOverbooked && (
          <div className="absolute top-0 left-0 right-0 h-2 bg-red-500 opacity-30 rounded-full animate-pulse" />
        )}
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>
          Scheduled: <span className="font-medium text-gray-700">{scheduledHours}h</span>
        </span>
        <span>
          Available: <span className="font-medium text-gray-700">{availableHours}h</span>
        </span>
      </div>

      {/* Warning message for overbooked days */}
      {isOverbooked && (
        <div className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded">
          You've scheduled {(scheduledMinutes - availableMinutes) / 60} hours more than available. Consider moving some tasks.
        </div>
      )}
    </div>
  );
}
