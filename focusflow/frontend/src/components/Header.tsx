import { ChevronLeft, ChevronRight, Plus, Undo2, Redo2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore, useCanUndo, useCanRedo } from '../store';

export default function Header() {
  const {
    startDate,
    visibleDays,
    navigateDays,
    goToToday,
    setVisibleDays,
    toggleQuickAdd,
    undo,
    redo,
  } = useAppStore();

  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const isToday = format(startDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-[1800px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FocusFlow
              </h1>
              <p className="text-xs text-gray-500">Visual Planning for Your Brain</p>
            </div>

            {/* Day navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDays(-1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Previous day"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={goToToday}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  isToday
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Today
              </button>

              <button
                onClick={() => navigateDays(1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Next day"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <span className="text-sm text-gray-600 ml-2">
                {format(startDate, 'MMMM d, yyyy')}
              </span>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-l pl-4">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`p-1.5 rounded-lg transition-colors ${
                  canUndo
                    ? 'hover:bg-gray-100 text-gray-600'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Undo (⌘Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`p-1.5 rounded-lg transition-colors ${
                  canRedo
                    ? 'hover:bg-gray-100 text-gray-600'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Redo (⌘Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View controls */}
          <div className="flex items-center gap-3">
            {/* Days toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {[2, 3, 5, 7].map((days) => (
                <button
                  key={days}
                  onClick={() => setVisibleDays(days)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    visibleDays === days
                      ? 'bg-white shadow text-gray-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            {/* Add task button */}
            <button
              onClick={toggleQuickAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add Task</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
