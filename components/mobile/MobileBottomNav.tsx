/**
 * Mobile Bottom Navigation
 * Primary navigation for mobile devices
 */

'use client';

import { Calendar, Clock, Inbox, FolderKanban, MoreHorizontal } from 'lucide-react';

type NavTab = 'today' | 'timeline' | 'inbox' | 'projects' | 'more';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  inboxCount?: number;
}

export function MobileBottomNav({ activeTab, onTabChange, inboxCount = 0 }: MobileBottomNavProps) {
  const tabs = [
    { id: 'today' as NavTab, icon: Calendar, label: 'Today' },
    { id: 'timeline' as NavTab, icon: Clock, label: 'Timeline' },
    { id: 'inbox' as NavTab, icon: Inbox, label: 'Inbox', badge: inboxCount },
    { id: 'projects' as NavTab, icon: FolderKanban, label: 'Projects' },
    { id: 'more' as NavTab, icon: MoreHorizontal, label: 'More' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50 md:hidden">
      <div className="flex justify-around items-center h-14">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center
                min-w-[60px] min-h-[44px]
                gap-0.5
                relative
                ${isActive ? 'text-blue-600' : 'text-gray-600'}
                active:scale-95
                transition-all
                touch-manipulation
              `}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
