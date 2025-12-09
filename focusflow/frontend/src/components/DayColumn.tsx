import { useMemo, useState } from 'react';
import { format, isToday as checkIsToday } from 'date-fns';
import { Sunrise, Sun, Sunset, Clock } from 'lucide-react';
import { useAppStore } from '../store';
import TaskCard from './TaskCard';
import type { Task, TimeBlock } from '../types';
import { TIME_BLOCKS } from '../types';

interface DayColumnProps {
  date: string;
  tasks: Task[];
  isToday: boolean;
}

interface TimeBlockColumnProps {
  block: (typeof TIME_BLOCKS)[number];
  tasks: Task[];
  date: string;
}

const blockIcons: Record<TimeBlock, React.ReactNode> = {
  anytime: <Clock className="w-4 h-4" />,
  morning: <Sunrise className="w-4 h-4 text-amber-500" />,
  afternoon: <Sun className="w-4 h-4 text-yellow-500" />,
  evening: <Sunset className="w-4 h-4 text-orange-500" />,
};

function TimeBlockColumn({ block, tasks, date }: TimeBlockColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { moveTask, draggedItem } = useAppStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTask(taskId, date, block.id);
    }
  };

  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div
      className={`flex-1 min-h-[100px] rounded-lg border-2 border-dashed transition-all duration-200 ${
        isDragOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-transparent bg-gray-50/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Block header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-600">
          {blockIcons[block.id]}
          <span className="text-xs font-medium">{block.label}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          {tasks.length > 0 && (
            <>
              <span>
                {completedCount}/{tasks.length}
              </span>
              <span>•</span>
              <span>{totalMinutes}min</span>
            </>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="p-1.5 space-y-1.5">
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400">
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              compact
              isDragging={draggedItem?.taskId === task.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function DayColumn({ date, tasks, isToday }: DayColumnProps) {
  const tasksByBlock = useMemo(() => {
    const grouped: Record<TimeBlock, Task[]> = {
      anytime: [],
      morning: [],
      afternoon: [],
      evening: [],
    };
    tasks.forEach((task) => {
      grouped[task.timeBlock].push(task);
    });
    return grouped;
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const formatDisplayDate = (dateStr: string): string => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    }
    if (format(dateObj, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return 'Tomorrow';
    }
    return format(dateObj, 'EEE, MMM d');
  };

  return (
    <div
      className={`flex-1 min-w-[280px] max-w-[380px] ${
        isToday ? 'order-first' : ''
      }`}
    >
      {/* Day header */}
      <div
        className={`rounded-t-xl p-3 ${
          isToday
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className={`font-semibold ${
                isToday ? 'text-white' : 'text-gray-800'
              }`}
            >
              {formatDisplayDate(date)}
            </h3>
            <p
              className={`text-xs ${
                isToday ? 'text-white/80' : 'text-gray-500'
              }`}
            >
              {completedTasks} of {totalTasks} tasks
            </p>
          </div>
          {isToday && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
              Now
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div
          className={`mt-2 h-1.5 rounded-full ${
            isToday ? 'bg-white/30' : 'bg-gray-100'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isToday ? 'bg-white' : 'bg-green-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Time blocks */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-xl p-2 space-y-2">
        {TIME_BLOCKS.filter((b) => b.id !== 'anytime').map((block) => (
          <TimeBlockColumn
            key={block.id}
            block={block}
            tasks={tasksByBlock[block.id]}
            date={date}
          />
        ))}

        {/* Anytime section */}
        {tasksByBlock.anytime.length > 0 && (
          <div className="border-t pt-2">
            <TimeBlockColumn
              block={TIME_BLOCKS[0]}
              tasks={tasksByBlock.anytime}
              date={date}
            />
          </div>
        )}
      </div>
    </div>
  );
}
