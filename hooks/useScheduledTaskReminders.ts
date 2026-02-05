/**
 * useScheduledTaskReminders Hook
 * Monitors scheduled tasks and sends notifications when they're due to start
 */

'use client';

import { useEffect, useRef } from 'react';
import { Task } from '@/types';
import { useNotifications } from './useNotifications';

interface UseScheduledTaskRemindersOptions {
  tasks: Task[];
  isAuthenticated: boolean;
  enabled?: boolean;
}

export function useScheduledTaskReminders({
  tasks,
  isAuthenticated,
  enabled = true,
}: UseScheduledTaskRemindersOptions) {
  const { showNotification, settings } = useNotifications();
  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const lastCheckRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !settings.scheduledReminderEnabled) {
      return;
    }

    // Check every minute for scheduled tasks
    const checkScheduledTasks = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeKey = `${currentHour}:${currentMinute}`;

      // Avoid checking multiple times in the same minute
      if (lastCheckRef.current === currentTimeKey) {
        return;
      }
      lastCheckRef.current = currentTimeKey;

      console.log('[ScheduledReminders] Checking for due tasks at', currentTimeKey);

      // Get today's date string
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Filter for scheduled tasks that are due
      const dueTasks = tasks.filter((task) => {
        // Must have a scheduled time
        if (task.scheduledHour === null || task.scheduledHour === undefined) {
          return false;
        }

        // Must be scheduled for today
        if (task.date !== todayStr) {
          return false;
        }

        // Must not be completed or skipped
        if (task.status === 'completed' || task.status === 'skipped') {
          return false;
        }

        // Must not have been started yet
        if (task.status === 'in-progress') {
          return false;
        }

        // Already notified for this task?
        if (notifiedTasksRef.current.has(task.id)) {
          return false;
        }

        // Calculate the notification time (accounting for reminderMinutesBefore)
        const taskMinute = task.scheduledMinute || 0;
        const reminderMinutes = settings.reminderMinutesBefore || 0;

        let notifyHour = task.scheduledHour;
        let notifyMinute = taskMinute - reminderMinutes;

        // Handle minute underflow
        if (notifyMinute < 0) {
          notifyMinute += 60;
          notifyHour -= 1;
        }

        // Handle hour underflow
        if (notifyHour < 0) {
          notifyHour += 24;
        }

        // Check if current time matches notification time
        return currentHour === notifyHour && currentMinute === notifyMinute;
      });

      // Send notifications for due tasks
      dueTasks.forEach((task) => {
        const taskHour = task.scheduledHour!;
        const taskMinute = task.scheduledMinute || 0;
        const timeStr = `${taskHour.toString().padStart(2, '0')}:${taskMinute.toString().padStart(2, '0')}`;

        const reminderMinutes = settings.reminderMinutesBefore || 0;
        const isAdvanceReminder = reminderMinutes > 0;

        const title = isAdvanceReminder
          ? `Task Starting in ${reminderMinutes} Minute${reminderMinutes > 1 ? 's' : ''}`
          : 'Task Starting Now';

        const body = isAdvanceReminder
          ? `"${task.title}" is scheduled for ${timeStr}`
          : `"${task.title}" - Time to start!`;

        console.log('[ScheduledReminders] Sending notification for task:', task.id, task.title);

        showNotification({
          title,
          body,
          type: 'scheduledReminder',
          tag: `scheduled-${task.id}`,
          onClick: () => {
            // Focus the app when notification is clicked
            window.focus();
          },
        });

        // Mark as notified
        notifiedTasksRef.current.add(task.id);
      });
    };

    // Check immediately
    checkScheduledTasks();

    // Then check every minute
    const interval = setInterval(checkScheduledTasks, 60000); // 60 seconds

    return () => {
      clearInterval(interval);
    };
  }, [tasks, isAuthenticated, enabled, settings, showNotification]);

  // Clear notified tasks at midnight (new day)
  useEffect(() => {
    const clearAtMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        console.log('[ScheduledReminders] Clearing notified tasks (new day)');
        notifiedTasksRef.current.clear();
        clearAtMidnight(); // Schedule next midnight clear
      }, msUntilMidnight);

      return () => clearTimeout(timeout);
    };

    const cleanup = clearAtMidnight();
    return cleanup;
  }, []);
}
