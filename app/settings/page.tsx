'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Brain, LogOut, ArrowLeft, Mail, Clock, Palette, Bell } from 'lucide-react';
import { VIEW_DAY_OPTIONS } from '@/lib/constants';
import { THEMES, ThemeId, getStoredTheme, setStoredTheme } from '@/lib/themes';
import { useNotifications } from '@/hooks/useNotifications';

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [defaultViewDays, setDefaultViewDays] = useState(2);
  const [timezone, setTimezone] = useState('America/Chicago');
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(() => getStoredTheme());

  // Notification settings
  const {
    permission,
    isSupported,
    settings: notificationSettings,
    isLoadingSettings: loadingNotifications,
    requestPermission,
    updateSettings: updateNotificationSettings,
    testNotification,
  } = useNotifications();

  // Load default view preference
  useEffect(() => {
    const saved = localStorage.getItem('defaultViewDays');
    if (saved) {
      setDefaultViewDays(parseInt(saved, 10));
    }
  }, []);

  // Load timezone preference
  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const res = await fetch('/api/user/timezone');
        if (res.ok) {
          const data = await res.json();
          setTimezone(data.timezone);
        }
      } catch (error) {
        console.error('Failed to load timezone:', error);
      }
    };
    if (status === 'authenticated') {
      fetchTimezone();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mx-auto mb-4">
            <Brain size={24} />
          </div>
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleViewDaysChange = (days: number) => {
    setDefaultViewDays(days);
    localStorage.setItem('defaultViewDays', days.toString());
  };

  const handleThemeChange = (themeId: ThemeId) => {
    setSelectedTheme(themeId);
    setStoredTheme(themeId);
    // Reload the page to apply theme changes
    window.location.reload();
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    setSavingTimezone(true);
    try {
      const res = await fetch('/api/user/timezone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: newTimezone }),
      });
      if (res.ok) {
        setTimezone(newTimezone);
      } else {
        alert('Failed to update timezone');
      }
    } catch (error) {
      console.error('Failed to save timezone:', error);
      alert('Failed to update timezone');
    } finally {
      setSavingTimezone(false);
    }
  };

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      // Settings are automatically updated in the hook
    } else if (result === 'denied') {
      alert('Notification permission denied. Please enable notifications in your browser settings.');
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notificationSettings) => {
    await updateNotificationSettings({
      [key]: !notificationSettings[key],
    });
  };

  const handleTestNotification = async () => {
    // Show helper message
    alert('💡 Tip: Browsers usually hide notifications when the tab is in focus.\n\nAfter clicking OK, switch to another tab or minimize the browser to see the notification!');

    const result = await testNotification();

    if (!result) {
      alert('Notification failed to show. Check the browser console for details.');
    }
  };

  const handleReminderMinutesChange = async (minutes: number) => {
    await updateNotificationSettings({
      reminderMinutesBefore: minutes,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center text-white text-xl font-semibold">
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm text-gray-500">Profile Picture</p>
                <p className="text-sm text-gray-600 mt-1">
                  {session?.user?.image ? 'Avatar from provider' : 'Default avatar'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                {session?.user?.name || 'Not provided'}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-600">{session?.user?.email}</span>
              </div>
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Provider
              </label>
              <div className="flex items-center gap-3 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-600">
                  {session?.user?.email?.includes('@') ? 'Email/Credentials' : 'OAuth Provider'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h2>

          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center gap-2">
                  <Palette size={16} />
                  Color Theme
                </div>
              </label>
              <div className="space-y-2">
                {Object.values(THEMES).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{theme.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{theme.description}</div>
                      </div>
                      <div className="flex gap-1 ml-3">
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{
                            backgroundImage: `linear-gradient(to right, ${theme.colors.primaryFrom}, ${theme.colors.primaryTo})`
                          }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Choose a calming color scheme that helps you focus
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Timezone
                </div>
              </label>
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                disabled={savingTimezone}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Used for task rollover and date calculations. Current time: {new Date().toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
              {savingTimezone && (
                <p className="text-xs text-blue-600 mt-1">Saving...</p>
              )}
            </div>

            {/* Default View */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Default Calendar View
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {VIEW_DAY_OPTIONS.map((days) => (
                  <button
                    key={days}
                    onClick={() => handleViewDaysChange(days)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      defaultViewDays === days
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {days} {days === 1 ? 'Day' : 'Days'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Choose how many days to show when you open Dopatika
              </p>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        {isSupported && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                Browser Notifications
              </div>
            </h2>

            <div className="space-y-6">
              {/* Permission Status */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Permission Status
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      permission === 'granted'
                        ? 'bg-green-100 text-green-700'
                        : permission === 'denied'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {permission === 'granted'
                      ? 'Enabled'
                      : permission === 'denied'
                      ? 'Denied'
                      : 'Not Requested'}
                  </span>
                </div>

                {permission === 'default' && (
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    Enable Notifications
                  </button>
                )}

                {permission === 'denied' && (
                  <p className="text-xs text-gray-600 mt-2">
                    Notifications are blocked. Please enable them in your browser settings.
                  </p>
                )}

                {permission === 'granted' && (
                  <>
                    <button
                      onClick={handleTestNotification}
                      className="w-full mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                    >
                      Send Test Notification
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      💡 Switch to another tab after clicking to see the notification
                    </p>
                  </>
                )}
              </div>

              {/* Global Toggle */}
              {permission === 'granted' && (
                <>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-gray-900">Browser Notifications</div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        Receive notifications when app is in background
                      </div>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('browserEnabled')}
                      disabled={loadingNotifications}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.browserEnabled ? 'bg-blue-500' : 'bg-gray-300'
                      } ${loadingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.browserEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Individual Notification Types */}
                  {notificationSettings.browserEnabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Pomodoro Timer</div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            Session and break completion alerts
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle('pomodoroEnabled')}
                          disabled={loadingNotifications}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notificationSettings.pomodoroEnabled ? 'bg-blue-500' : 'bg-gray-300'
                          } ${loadingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notificationSettings.pomodoroEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Daily Rollover</div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            Tasks moved from previous days
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle('rolloverEnabled')}
                          disabled={loadingNotifications}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notificationSettings.rolloverEnabled ? 'bg-blue-500' : 'bg-gray-300'
                          } ${loadingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notificationSettings.rolloverEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Task Unlocked</div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            When blocked tasks become available
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle('dependencyEnabled')}
                          disabled={loadingNotifications}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notificationSettings.dependencyEnabled ? 'bg-blue-500' : 'bg-gray-300'
                          } ${loadingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notificationSettings.dependencyEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Upcoming Tasks</div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            Reminders for tasks with a specific start time
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle('scheduledReminderEnabled')}
                          disabled={loadingNotifications}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notificationSettings.scheduledReminderEnabled ? 'bg-blue-500' : 'bg-gray-300'
                          } ${loadingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notificationSettings.scheduledReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {notificationSettings.scheduledReminderEnabled && (
                        <div className="ml-4 pl-4 border-l-2 border-gray-200">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Remind me
                          </label>
                          <select
                            value={notificationSettings.reminderMinutesBefore}
                            onChange={(e) => handleReminderMinutesChange(parseInt(e.target.value))}
                            disabled={loadingNotifications}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          >
                            <option value={0}>At start time</option>
                            <option value={5}>5 minutes before</option>
                            <option value={10}>10 minutes before</option>
                            <option value={15}>15 minutes before</option>
                            <option value={30}>30 minutes before</option>
                          </select>
                          <p className="text-[11px] text-gray-500 mt-2">
                            If the app was asleep, missed reminders from the last 15 minutes are still delivered.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Actions</h2>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            You will be signed out from all sessions
          </p>
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Dopatika v1.0.0</p>
          <p className="mt-2">
            Questions? Check the{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              help center
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
