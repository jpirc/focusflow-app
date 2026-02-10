/**
 * useScheduledTaskReminders Hook
 * Monitors scheduled tasks and sends notifications when they're due to start
 * with catch-up handling for background-tab throttling/sleep.
 */

'use client';

import { useEffect, useRef } from 'react';
import { Task } from '@/types';
import { useNotifications } from './useNotifications';
import { formatDate, parseLocalDate } from '@/lib/utils/date';

interface UseScheduledTaskRemindersOptions {
  tasks: Task[];
  isAuthenticated: boolean;
  enabled?: boolean;
}

const CHECK_INTERVAL_MS = 30_000;
const INITIAL_LOOKBACK_MS = 90_000;
const REMINDER_GRACE_MS = 15 * 60_000;
const MAX_INDIVIDUAL_NOTIFICATIONS_PER_CHECK = 2;

function getScheduledDateTime(task: Task): Date | null {
  if (!task.date) return null;
  if (task.scheduledHour === null || task.scheduledHour === undefined) return null;

  const scheduledAt = parseLocalDate(task.date);
  scheduledAt.setHours(task.scheduledHour, task.scheduledMinute || 0, 0, 0);
  return scheduledAt;
}

function getNotificationDateTime(task: Task, reminderMinutes: number): Date | null {
  const scheduledAt = getScheduledDateTime(task);
  if (!scheduledAt) return null;

  const notifyAt = new Date(scheduledAt.getTime() - reminderMinutes * 60_000);

  // Never notify on the previous day. For very early tasks, clamp to midnight.
  if (task.date) {
    const dayStart = parseLocalDate(task.date);
    if (notifyAt < dayStart) {
      return dayStart;
    }
  }

  return notifyAt;
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function useScheduledTaskReminders({
  tasks,
  isAuthenticated,
  enabled = true,
}: UseScheduledTaskRemindersOptions) {
  const { showNotification, settings, isLoadingSettings } = useNotifications();
  const notifiedReminderKeysRef = useRef<Set<string>>(new Set());
  const lastCheckedAtRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !enabled ||
      !isAuthenticated ||
      isLoadingSettings ||
      !settings.scheduledReminderEnabled
    ) {
      return;
    }

    const checkScheduledTasks = () => {
      const now = new Date();
      const todayStr = formatDate(now);
      const reminderMinutes = Math.max(0, settings.reminderMinutesBefore || 0);
      const currentWindowStart = lastCheckedAtRef.current
        ? new Date(lastCheckedAtRef.current)
        : new Date(now.getTime() - INITIAL_LOOKBACK_MS);

      // Catch-up window prevents flooding with stale reminders after long sleep/offline periods.
      const graceWindowStart = new Date(now.getTime() - REMINDER_GRACE_MS);
      const effectiveWindowStart = new Date(
        Math.max(currentWindowStart.getTime(), graceWindowStart.getTime())
      );

      const dueReminders = tasks
        .filter(task => {
          if (!task.date) return false;
          if (task.status === 'completed' || task.status === 'skipped') return false;
          if (task.status === 'in-progress') return false;

          const scheduledAt = getScheduledDateTime(task);
          if (!scheduledAt) return false;

          // Upcoming reminders are scoped to today's scheduled tasks.
          if (formatDate(scheduledAt) !== todayStr) return false;

          const notifyAt = getNotificationDateTime(task, reminderMinutes);
          if (!notifyAt) return false;

          if (notifyAt > now) return false;
          if (notifyAt < effectiveWindowStart) return false;

          const reminderKey = `${task.id}:${task.date}:${task.scheduledHour}:${task.scheduledMinute || 0}:${reminderMinutes}`;
          if (notifiedReminderKeysRef.current.has(reminderKey)) return false;

          return true;
        })
        .map(task => {
          const scheduledAt = getScheduledDateTime(task)!;
          const notifyAt = getNotificationDateTime(task, reminderMinutes)!;
          const reminderKey = `${task.id}:${task.date}:${task.scheduledHour}:${task.scheduledMinute || 0}:${reminderMinutes}`;
          return { task, scheduledAt, notifyAt, reminderKey };
        })
        .sort((a, b) => a.notifyAt.getTime() - b.notifyAt.getTime());

      if (dueReminders.length === 0) {
        lastCheckedAtRef.current = now.toISOString();
        return;
      }

      const sendTaskReminder = (task: Task, scheduledAt: Date) => {
        const minutesUntil = Math.round((scheduledAt.getTime() - now.getTime()) / 60_000);
        const timeLabel = formatTimeLabel(scheduledAt);

        let title = 'Upcoming Task';
        let body = `"${task.title}" starts at ${timeLabel}`;

        if (minutesUntil > 1) {
          title = `Upcoming Task in ${minutesUntil}m`;
        } else if (minutesUntil >= -1) {
          title = 'Task Starting Now';
          body = `"${task.title}" is scheduled now`;
        } else {
          title = 'Upcoming Task Reminder';
          body = `"${task.title}" was scheduled for ${timeLabel}. Start when ready.`;
        }

        void showNotification({
          title,
          body,
          type: 'scheduledReminder',
          tag: `scheduled-${task.id}`,
          onClick: () => {
            window.focus();
          },
        });
      };

      if (dueReminders.length > MAX_INDIVIDUAL_NOTIFICATIONS_PER_CHECK) {
        const first = dueReminders[0];
        void showNotification({
          title: `${dueReminders.length} upcoming tasks`,
          body: `Next: "${first.task.title}" at ${formatTimeLabel(first.scheduledAt)}`,
          type: 'scheduledReminder',
          tag: `scheduled-bundle-${todayStr}-${now.getHours()}-${now.getMinutes()}`,
          onClick: () => {
            window.focus();
          },
        });
      } else {
        dueReminders.forEach(({ task, scheduledAt }) => {
          sendTaskReminder(task, scheduledAt);
        });
      }

      dueReminders.forEach(({ reminderKey }) => {
        notifiedReminderKeysRef.current.add(reminderKey);
      });

      lastCheckedAtRef.current = now.toISOString();
    };

    // Check immediately, on interval, and when tab regains attention.
    checkScheduledTasks();
    const interval = setInterval(checkScheduledTasks, CHECK_INTERVAL_MS);
    const handleFocus = () => checkScheduledTasks();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkScheduledTasks();
      }
    };
    const handleOnline = () => checkScheduledTasks();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [tasks, isAuthenticated, enabled, isLoadingSettings, settings, showNotification]);

  // Clear notified reminders at midnight (new day)
  useEffect(() => {
    const clearAtMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        notifiedReminderKeysRef.current.clear();
        lastCheckedAtRef.current = null;
        clearAtMidnight(); // Schedule next midnight clear
      }, msUntilMidnight);

      return () => clearTimeout(timeout);
    };

    const cleanup = clearAtMidnight();
    return cleanup;
  }, []);
}
