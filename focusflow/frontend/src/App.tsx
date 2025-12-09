import { useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAppStore, useCanUndo, useCanRedo } from './store';
import { KEYBOARD_SHORTCUTS } from './types';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import InboxPanel from './components/InboxPanel';
import Timeline from './components/Timeline';
import QuickAddModal from './components/QuickAddModal';
import BreakdownModal from './components/BreakdownModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  const {
    fetchTasks,
    fetchProjects,
    showQuickAdd,
    toggleQuickAdd,
    showBreakdownModal,
    undo,
    redo,
    navigateDays,
    goToToday,
    selectedTaskId,
    completeTask,
    startTask,
    deleteTask,
    setSelectedTask,
  } = useAppStore();

  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // Fetch initial data
  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const { key } = e;
      const ctrl = e.ctrlKey || e.metaKey;

      // Quick add
      if (key === KEYBOARD_SHORTCUTS.quickAdd && !ctrl) {
        e.preventDefault();
        toggleQuickAdd();
        return;
      }

      // Undo
      if (key === KEYBOARD_SHORTCUTS.undo && ctrl && canUndo) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo
      if (key === KEYBOARD_SHORTCUTS.redo && ctrl && canRedo) {
        e.preventDefault();
        redo();
        return;
      }

      // Today
      if (key === KEYBOARD_SHORTCUTS.today && !ctrl) {
        e.preventDefault();
        goToToday();
        return;
      }

      // Navigate days
      if (key === KEYBOARD_SHORTCUTS.nextDay && !ctrl) {
        e.preventDefault();
        navigateDays(1);
        return;
      }

      if (key === KEYBOARD_SHORTCUTS.prevDay && !ctrl) {
        e.preventDefault();
        navigateDays(-1);
        return;
      }

      // Task actions (when a task is selected)
      if (selectedTaskId) {
        if (key === KEYBOARD_SHORTCUTS.completeTask) {
          e.preventDefault();
          completeTask(selectedTaskId);
          return;
        }

        if (key === KEYBOARD_SHORTCUTS.startTask) {
          e.preventDefault();
          startTask(selectedTaskId);
          return;
        }

        if (key === KEYBOARD_SHORTCUTS.deleteTask) {
          e.preventDefault();
          deleteTask(selectedTaskId);
          return;
        }

        if (key === KEYBOARD_SHORTCUTS.escape) {
          e.preventDefault();
          setSelectedTask(null);
          return;
        }
      }

      // Close modals
      if (key === KEYBOARD_SHORTCUTS.escape) {
        if (showQuickAdd) {
          toggleQuickAdd();
        }
      }
    },
    [
      canUndo,
      canRedo,
      selectedTaskId,
      showQuickAdd,
      toggleQuickAdd,
      undo,
      redo,
      goToToday,
      navigateDays,
      completeTask,
      startTask,
      deleteTask,
      setSelectedTask,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50">
      <Header />
      
      <main className="max-w-[1800px] mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Left sidebar - Projects */}
          <aside className="flex-shrink-0 w-64 space-y-4">
            <Sidebar />
          </aside>

          {/* Inbox */}
          <InboxPanel />

          {/* Timeline */}
          <Timeline />
        </div>
      </main>

      {/* Modals */}
      {showQuickAdd && <QuickAddModal />}
      {showBreakdownModal && <BreakdownModal />}

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '0.75rem',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 left-4 bg-white/80 backdrop-blur rounded-lg px-3 py-2 shadow-lg border text-xs text-gray-500">
        <span className="font-medium">Shortcuts:</span>{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">N</kbd> Add task •{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">T</kbd> Today •{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">⌘Z</kbd> Undo •{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">←→</kbd> Navigate
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
