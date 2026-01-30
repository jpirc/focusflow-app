/**
 * Mobile Header
 * Top bar for mobile layout
 */

'use client';

import { Menu, Settings, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface MobileHeaderProps {
  title: string;
  date?: Date;
  onMenuClick?: () => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  notificationCount?: number;
}

export function MobileHeader({
  title,
  date,
  onMenuClick,
  onSettingsClick,
  onNotificationsClick,
  notificationCount = 0,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 md:hidden">
      <div className="flex items-center justify-between h-12 px-3">
        {/* Left: Menu */}
        <button
          onClick={onMenuClick}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-700 active:bg-gray-100 rounded-lg transition-colors touch-manipulation -ml-1"
        >
          <Menu size={20} />
        </button>

        {/* Center: Title & Date */}
        <div className="flex-1 text-center min-w-0 px-2">
          <h1 className="text-sm font-semibold text-gray-900 truncate">
            {title}
          </h1>
          {date && (
            <p className="text-[10px] text-gray-600 leading-tight">
              {format(date, 'EEE, MMM d')}
            </p>
          )}
        </div>

        {/* Right: Notifications & Settings */}
        <div className="flex items-center -mr-1">
          {onNotificationsClick && (
            <button
              onClick={onNotificationsClick}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-700 active:bg-gray-100 rounded-lg transition-colors touch-manipulation relative"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-3 h-3 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-700 active:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
