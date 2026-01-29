'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Brain, LogOut, ArrowLeft, Mail, Clock, Palette } from 'lucide-react';
import { VIEW_DAY_OPTIONS } from '@/lib/constants';
import { THEMES, ThemeId, getStoredTheme, setStoredTheme } from '@/lib/themes';

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
