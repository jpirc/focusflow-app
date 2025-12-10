'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Brain, LogOut, ArrowLeft, Mail } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white mx-auto mb-4">
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
          <p>FocusFlow v1.0.0</p>
          <p className="mt-2">
            Questions? Check the{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
              help center
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
