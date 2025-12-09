import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Circle,
  CheckCircle2,
  Play,
  Pause,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Link2,
  Trash2,
  Edit3,
  Copy,
  Sparkles,
  Flag,
  ArrowRight,
  Zap,
  Clock,
  Repeat,
} from 'lucide-react';
import { useAppStore, useProjectById } from '../store';
import type { Task, Priority, EnergyLevel } from '../types';
import { getTaskIcon } from '../utils/icons';

interface TaskCardProps {
  task: Task;
  compact?: boolean;
  isDragging?: boolean;
}

export default function TaskCard({ task, compact = false, isDragging = false }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const {
    selectedTaskId,
    setSelectedTask,
    updateTask,
    deleteTask,
    startTask,
    completeTask,
    toggleSubtask,
    openBreakdownModal,
    tasks,
  } = useAppStore();

  const project = useProjectById(task.projectId);
  const isSelected = selectedTaskId === task.id;

  // Calculate dependency status
  const dependencyTasks = task.dependsOn
    .map((id) => tasks.find((t) => t.id === id))
    .filter(Boolean);
  const hasBlockingDeps = dependencyTasks.some(
    (t) => t && t.status !== 'completed'
  );
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'completed') {
      updateTask(task.id, { status: 'pending' });
    } else {
      completeTask(task.id);
    }
  };

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTask(task.id);
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(task.id, { status: 'pending' });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id);
    setShowMenu(false);
  };

  const handleBreakdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    openBreakdownModal(task.id);
    setShowMenu(false);
  };

  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'low':
        return 'bg-slate-100 text-slate-600';
      case 'medium':
        return 'bg-blue-100 text-blue-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'urgent':
        return 'bg-red-100 text-red-700';
    }
  };

  const getEnergyIcon = (level: EnergyLevel) => {
    const colors = {
      low: 'text-slate-400',
      medium: 'text-amber-500',
      high: 'text-green-500',
    };
    return <Zap className={`w-3 h-3 ${colors[level]}`} />;
  };

  const statusStyles = {
    pending: '',
    'in-progress': 'ring-2 ring-blue-400 ring-offset-1',
    completed: 'opacity-60',
    skipped: 'opacity-40',
    'carried-over': 'ring-1 ring-amber-300 bg-amber-50',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      draggable
      onDragStart={(e) => {
        const dragEvent = e as unknown as React.DragEvent;
        dragEvent.dataTransfer?.setData('text/plain', task.id);
        useAppStore.getState().setDraggedItem({
          taskId: task.id,
          sourceDate: task.date,
          sourceTimeBlock: task.timeBlock,
        });
      }}
      onDragEnd={() => {
        useAppStore.getState().setDraggedItem(null);
      }}
      onClick={() => setSelectedTask(task.id)}
      className={`
        group relative rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing bg-white
        ${statusStyles[task.status]}
        ${isSelected ? 'ring-2 ring-purple-400 ring-offset-1' : ''}
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
        ${hasBlockingDeps ? 'border-dashed border-amber-400' : 'border-gray-200'}
      `}
      style={{
        borderLeftColor: project?.color || '#3b82f6',
        borderLeftWidth: '3px',
      }}
    >
      {/* Carried over indicator */}
      {task.carriedOverFrom && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10">
          <ArrowRight className="w-2.5 h-2.5" /> Carried
        </div>
      )}

      {/* Recurring indicator */}
      {task.recurrenceType !== 'none' && (
        <div className="absolute -top-2 -left-1 bg-purple-500 text-white p-0.5 rounded-full z-10">
          <Repeat className="w-2.5 h-2.5" />
        </div>
      )}

      {/* Main content */}
      <div className={compact ? 'p-2' : 'p-3'}>
        <div className="flex items-start gap-2">
          {/* Status checkbox */}
          <button onClick={handleStatusToggle} className="mt-0.5 flex-shrink-0">
            {task.status === 'completed' ? (
              <CheckCircle2 className="w-[18px] h-[18px] text-green-500" />
            ) : task.status === 'in-progress' ? (
              <div className="w-[18px] h-[18px] rounded-full border-2 border-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
            ) : (
              <Circle className="w-[18px] h-[18px] text-gray-300 hover:text-gray-400 transition-colors" />
            )}
          </button>

          {/* Task info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="p-1 rounded"
                style={{
                  backgroundColor: project?.bgColor || '#dbeafe',
                  color: project?.color || '#2563eb',
                }}
              >
                {getTaskIcon(task.icon, 14)}
              </span>
              <h4
                className={`font-medium text-sm truncate ${
                  task.status === 'completed'
                    ? 'line-through text-gray-400'
                    : 'text-gray-800'
                }`}
              >
                {task.title}
              </h4>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {task.estimatedMinutes}min
              </span>

              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getPriorityStyles(
                  task.priority
                )}`}
              >
                {task.priority === 'urgent' && (
                  <Flag className="w-2.5 h-2.5 inline mr-0.5" />
                )}
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>

              {getEnergyIcon(task.energyLevel)}

              {task.subtasks.length > 0 && (
                <span className="text-[11px] text-gray-500">
                  {completedSubtasks}/{task.subtasks.length} steps
                </span>
              )}

              {task.dependsOn.length > 0 && (
                <span
                  className={`text-[11px] flex items-center gap-0.5 ${
                    hasBlockingDeps ? 'text-amber-600' : 'text-green-600'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  {hasBlockingDeps ? 'Blocked' : 'Ready'}
                </span>
              )}

              {task.dependents.length > 0 && (
                <span className="text-[11px] flex items-center gap-0.5 text-blue-600">
                  <Link2 className="w-3 h-3" />
                  Blocks {task.dependents.length}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.status === 'pending' && (
              <button
                onClick={handleStart}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
                title="Start task"
              >
                <Play className="w-3.5 h-3.5 text-blue-600" />
              </button>
            )}

            {task.status === 'in-progress' && (
              <button
                onClick={handlePause}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Pause task"
              >
                <Pause className="w-3.5 h-3.5 text-gray-600" />
              </button>
            )}

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 z-50 min-w-[160px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                  <button
                    onClick={handleBreakdown}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-purple-50 text-purple-600 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Break Down with AI
                  </button>
                  <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Link2 className="w-4 h-4" /> Link Task
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>

            {task.subtasks.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <GripVertical className="w-3.5 h-3.5 text-gray-300 cursor-grab" />
          </div>
        </div>

        {/* Subtasks (expanded) */}
        {expanded && task.subtasks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 ml-6 space-y-1 border-l-2 border-gray-100 pl-2"
          >
            {task.subtasks.map((subtask) => (
              <div key={subtask.id} className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubtask(task.id, subtask.id);
                  }}
                >
                  {subtask.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-gray-300" />
                  )}
                </button>
                <span
                  className={`text-xs ${
                    subtask.completed
                      ? 'line-through text-gray-400'
                      : 'text-gray-600'
                  }`}
                >
                  {subtask.title}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Dependencies info (expanded) */}
        {expanded && task.dependsOn.length > 0 && (
          <div className="mt-2 ml-6 text-xs text-gray-500">
            <span className="font-medium">Depends on: </span>
            {dependencyTasks.map((t, i) => (
              <span key={t?.id}>
                {t?.status === 'completed' ? '✓' : '○'} {t?.title}
                {i < dependencyTasks.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
