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
    console.log('[Notifications] Requesting permission...');
    if (!isSupported) {
      console.warn('[Notifications] Not supported');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      console.log('[Notifications] Permission result:', result);
      setPermission(result);

      // If granted, enable browser notifications in settings
      if (result === 'granted') {
        console.log('[Notifications] Enabling browser notifications in settings...');
        await updateSettings({ browserEnabled: true });
        console.log('[Notifications] Settings updated');
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
    console.log('[Notifications] Attempting to show notification:', { title, type, permission, isSupported, settings });

    // Check browser support
    if (!isSupported) {
      console.warn('[Notifications] Browser notifications are not supported');
      return null;
    }

    // Check permission
    if (permission !== 'granted') {
      console.warn('[Notifications] Permission not granted. Current permission:', permission);
      return null;
    }

    // Check if notifications are enabled globally
    if (!settings.browserEnabled) {
      console.warn('[Notifications] Browser notifications are disabled globally');
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
      console.warn('[Notifications] Notification type disabled:', type, 'Settings:', typeEnabledMap);
      return null;
    }

    try {
      console.log('[Notifications] Creating notification...');
      const notification = new Notification(title, {
        body,
        icon: icon || undefined, // Don't set icon if not provided
        tag,
        requireInteraction: false,
      });

      // Add event handlers for debugging
      notification.onshow = () => {
        console.log('[Notifications] ✅ Notification displayed');
      };

      notification.onerror = (error) => {
        console.error('[Notifications] ❌ Notification error:', error);
      };

      notification.onclose = () => {
        console.log('[Notifications] Notification closed');
      };

      console.log('[Notifications] Notification created successfully');

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
    console.log('[Notifications] Test notification triggered');
    console.log('[Notifications] Current state:', { permission, isSupported, settings });
    const result = await showNotification({
      title: 'Dopatika Notifications',
      body: 'Your notifications are working! 🎉',
      type: 'pomodoro', // Use pomodoro type for test
      tag: 'test',
    });
    console.log('[Notifications] Test notification result:', result);
    return result;
  }, [showNotification, permission, isSupported, settings]);

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
