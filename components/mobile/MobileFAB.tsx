/**
 * Mobile Floating Action Button (FAB)
 * Primary action button for quick task creation
 */

'use client';

import { Plus } from 'lucide-react';

interface MobileFABProps {
  onClick: () => void;
  label?: string;
}

export function MobileFAB({ onClick, label = 'Add Task' }: MobileFABProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-20 right-4
        w-14 h-14
        bg-blue-600 hover:bg-blue-700
        text-white
        rounded-full
        shadow-lg hover:shadow-xl
        flex items-center justify-center
        active:scale-95
        transition-all
        z-40
        md:hidden
        touch-manipulation
      "
      aria-label={label}
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}
