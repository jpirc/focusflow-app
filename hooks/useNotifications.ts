import { useState, useEffect, useCallback } from 'react';

export type NotificationType =
  | 'pomodoro'
  | 'rollover'
  | 'dependency'
  | 'taskAge'
  | 'dailySummary'
  | 'scheduledReminder';

export interface NotificationSettings {
  browserEnabled: boolean;
  pomodoroEnabled: boolean;
  rolloverEnabled: boolean;
  dependencyEnabled: boolean;
  taskAgeWarningsEnabled: boolean;
  dailySummaryEnabled: boolean;
  scheduledReminderEnabled: boolean;
  reminderMinutesBefore: number;
  dailySummaryTime: string | null;
}

export interface ShowNotificationParams {
  title: string;
  body: string;
  type: NotificationType;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    browserEnabled: false,
    pomodoroEnabled: true,
    rolloverEnabled: true,
    dependencyEnabled: true,
    taskAgeWarningsEnabled: false,
    dailySummaryEnabled: false,
    scheduledReminderEnabled: true,
    reminderMinutesBefore: 0,
    dailySummaryTime: null,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Check browser support and permission on mount
  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/notifications/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  // Update notification settings (defined first to avoid circular dependency)
  const updateSettings = useCallback(async (updates: Partial<NotificationSettings>) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return false;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      // If granted, enable browser notifications in settings
      if (result === 'granted') {
        await updateSettings({ browserEnabled: true });
      }

      return result;
    } catch (error) {
      console.error('[Notifications] Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported, updateSettings]);

  // Show a notification
  const showNotification = useCallback(async ({
    title,
    body,
    type,
    icon,
    tag,
    onClick,
  }: ShowNotificationParams) => {
    // Check browser support
    if (!isSupported) {
      return null;
    }

    // Check permission
    if (permission !== 'granted') {
      return null;
    }

    // Check if notifications are enabled globally
    if (!settings.browserEnabled) {
      return null;
    }

    // Check if this specific notification type is enabled
    const typeEnabledMap: Record<NotificationType, boolean> = {
      pomodoro: settings.pomodoroEnabled,
      rollover: settings.rolloverEnabled,
      dependency: settings.dependencyEnabled,
      taskAge: settings.taskAgeWarningsEnabled,
      dailySummary: settings.dailySummaryEnabled,
      scheduledReminder: settings.scheduledReminderEnabled,
    };

    if (!typeEnabledMap[type]) {
      return null;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || undefined, // Don't set icon if not provided
        tag,
        requireInteraction: false,
      });

      notification.onerror = (error) => {
        console.error('[Notifications] ❌ Notification error:', error);
      };

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }

      return notification;
    } catch (error) {
      console.error('[Notifications] Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission, settings]);

  // Test notification (for settings page)
  const testNotification = useCallback(async () => {
    const result = await showNotification({
      title: 'Dopatika Notifications',
      body: 'Your notifications are working! 🎉',
      type: 'pomodoro', // Use pomodoro type for test
      tag: 'test',
    });
    return result;
  }, [showNotification]);

  return {
    permission,
    isSupported,
    settings,
    isLoadingSettings,
    requestPermission,
    updateSettings,
    showNotification,
    testNotification,
    needsPermission: permission === 'default',
    hasPermission: permission === 'granted',
    permissionDenied: permission === 'denied',
  };
}
