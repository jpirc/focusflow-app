import { useState } from 'react';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore, useInboxTasks } from '../store';
import TaskCard from './TaskCard';

export default function InboxPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const inboxTasks = useInboxTasks();
  const { draggedItem, moveTask } = useAppStore();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      // Move to inbox (null date)
      moveTask(taskId, null, 'anytime');
    }
  };

  return (
    <div
      className={`flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-72'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={handleDrop}
    >
      <div
        className="flex items-center justify-between p-3 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-800">Inbox</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {inboxTasks.length}
              </span>
            </div>
          </>
        )}
        <button className="p-1 hover:bg-gray-100 rounded">
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
          {inboxTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No unscheduled tasks</p>
              <p className="text-xs">Drag tasks here to unschedule</p>
            </div>
          ) : (
            inboxTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                compact
                isDragging={draggedItem?.taskId === task.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
