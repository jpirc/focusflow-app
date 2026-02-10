/**
 * Urgency Detection Utilities
 *
 * Helps ADHD users quickly identify what needs attention NOW
 * through color-coding and visual urgency indicators.
 */

import { Task } from '@/types';

export type UrgencyLevel = 'critical' | 'urgent' | 'today' | 'soon' | 'flexible' | 'none';

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: string;
  color: string; // Tailwind text color class
  glowColor: string; // rgba for box-shadow
  borderColor: string; // Tailwind border color class
  borderColorValue: string; // Actual hex/rgb value for inline styles
  bgColor: string; // Tailwind bg color class
  shouldPulse: boolean;
}

/**
 * Calculate urgency level for a task
 * Based on due date/time and current time
 */
export function getTaskUrgency(task: Task): UrgencyInfo {
  // No date = flexible
  if (!task.date) {
    return {
      level: 'none',
      label: 'No deadline',
      color: 'text-gray-500',
      glowColor: 'transparent',
      borderColor: 'border-gray-300',
      borderColorValue: '#d1d5db',
      bgColor: 'bg-gray-50',
      shouldPulse: false,
    };
  }

  const now = new Date();

  // Parse task date properly (it's in YYYY-MM-DD format)
  const [year, month, day] = task.date.split('-').map(Number);
  const taskDate = new Date(year, month - 1, day); // month is 0-indexed

  // If task has scheduled time, use it for precise urgency
  if (task.scheduledHour !== null && task.scheduledHour !== undefined) {
    const taskDateTime = new Date(taskDate);
    taskDateTime.setHours(task.scheduledHour);
    taskDateTime.setMinutes(task.scheduledMinute || 0);
    taskDateTime.setSeconds(0);
    taskDateTime.setMilliseconds(0);

    const minutesUntil = (taskDateTime.getTime() - now.getTime()) / (1000 * 60);
    const hoursUntil = minutesUntil / 60;

    // Overdue (past scheduled time)
    if (minutesUntil < 0) {
      return {
        level: 'critical',
        label: 'Overdue',
        color: 'text-red-700',
        glowColor: 'rgba(239, 68, 68, 0.3)',
        borderColor: 'border-red-500',
        borderColorValue: '#ef4444',
        bgColor: 'bg-red-50',
        shouldPulse: true,
      };
    }

    // Due in less than 1 hour (critical urgency)
    if (minutesUntil < 60) {
      return {
        level: 'critical',
        label: `Due in ${Math.round(minutesUntil)}m`,
        color: 'text-red-600',
        glowColor: 'rgba(239, 68, 68, 0.25)',
        borderColor: 'border-red-400',
        borderColorValue: '#f87171',
        bgColor: 'bg-red-50',
        shouldPulse: true,
      };
    }

    // Due in less than 2 hours
    if (hoursUntil < 2) {
      return {
        level: 'urgent',
        label: `Due in ${Math.round(hoursUntil)}h`,
        color: 'text-orange-600',
        glowColor: 'rgba(249, 115, 22, 0.2)',
        borderColor: 'border-orange-400',
        borderColorValue: '#fb923c',
        bgColor: 'bg-orange-50',
        shouldPulse: false,
      };
    }

    // Due today (later)
    if (isSameDay(taskDateTime, now)) {
      return {
        level: 'today',
        label: 'Today',
        color: 'text-amber-600',
        glowColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'border-amber-300',
        borderColorValue: '#fcd34d',
        bgColor: 'bg-amber-50',
        shouldPulse: false,
      };
    }
  }

  // Check date-based urgency (no specific time)
  const daysUntil = getDaysUntil(taskDate, now);

  // Overdue (past date)
  if (daysUntil < 0) {
    return {
      level: 'critical',
      label: `${Math.abs(daysUntil)}d overdue`,
      color: 'text-red-700',
      glowColor: 'rgba(239, 68, 68, 0.3)',
      borderColor: 'border-red-500',
      borderColorValue: '#ef4444',
      bgColor: 'bg-red-50',
      shouldPulse: true,
    };
  }

  // Due today
  if (daysUntil === 0) {
    return {
      level: 'today',
      label: 'Due today',
      color: 'text-amber-600',
      glowColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'border-amber-300',
      borderColorValue: '#fcd34d',
      bgColor: 'bg-amber-50',
      shouldPulse: false,
    };
  }

  // Due tomorrow
  if (daysUntil === 1) {
    return {
      level: 'soon',
      label: 'Due tomorrow',
      color: 'text-yellow-600',
      glowColor: 'rgba(234, 179, 8, 0.1)',
      borderColor: 'border-yellow-300',
      borderColorValue: '#fde047',
      bgColor: 'bg-yellow-50',
      shouldPulse: false,
    };
  }

  // Due in 2-7 days
  if (daysUntil <= 7) {
    return {
      level: 'soon',
      label: `Due in ${daysUntil}d`,
      color: 'text-green-600',
      glowColor: 'rgba(34, 197, 94, 0.08)',
      borderColor: 'border-green-300',
      borderColorValue: '#86efac',
      bgColor: 'bg-green-50',
      shouldPulse: false,
    };
  }

  // More than a week away
  return {
    level: 'flexible',
    label: `Due in ${daysUntil}d`,
    color: 'text-gray-600',
    glowColor: 'transparent',
    borderColor: 'border-gray-300',
    borderColorValue: '#d1d5db',
    bgColor: 'bg-gray-50',
    shouldPulse: false,
  };
}

/**
 * Check if two dates are the same day (ignoring time)
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get number of days until a date (can be negative if past)
 */
function getDaysUntil(targetDate: Date, fromDate: Date): number {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - from.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get CSS classes for urgency styling
 */
export function getUrgencyClasses(task: Task): string {
  const urgency = getTaskUrgency(task);

  let classes = '';

  // Border with glow effect for critical/urgent
  if (urgency.shouldPulse) {
    classes += ` ${urgency.borderColor} border-l-4`;
  } else if (urgency.level === 'urgent' || urgency.level === 'today') {
    classes += ` ${urgency.borderColor} border-l-2`;
  } else {
    classes += ` border-l-2 ${urgency.borderColor}`;
  }

  return classes;
}

/**
 * Get inline styles for urgency (box-shadow glow)
 */
export function getUrgencyStyles(task: Task): React.CSSProperties {
  const urgency = getTaskUrgency(task);

  if (urgency.level === 'critical' || urgency.level === 'urgent') {
    return {
      boxShadow: `0 0 0 2px ${urgency.glowColor}, 0 1px 2px 0 rgb(0 0 0 / 0.05)`,
    };
  }

  return {};
}
