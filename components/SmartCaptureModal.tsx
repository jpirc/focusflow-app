"use client";

import React, { useState, useCallback } from 'react';
import { Sparkles, X, Loader2, ArrowLeft } from 'lucide-react';
import { Task, TimeBlock, Priority, EnergyLevel } from '@/types';
import { TaskPreviewCard, ParsedTask } from './TaskPreviewCard';

interface SmartCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: () => void;
  onCreateAndStart?: (task: Task) => void;
  onStartPomodoro?: (task: Task) => void;
}

export const SmartCaptureModal: React.FC<SmartCaptureModalProps> = ({
  isOpen,
  onClose,
  onTasksCreated,
  onCreateAndStart,
  onStartPomodoro,
}) => {
  // Phase: 'input' for text entry, 'preview' for showing parsed results
  const [phase, setPhase] = useState<'input' | 'preview'>('input');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setPhase('input');
    setText('');
    setError(null);
    setParsedTasks([]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // Parse text and move to preview phase
  const handleParse = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const parseResponse = await fetch('/api/tasks/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || 'Failed to parse tasks');
      }

      const { tasks } = await parseResponse.json();

      // Transform parsed tasks into our preview format with temp IDs
      const previewTasks: ParsedTask[] = tasks.map((task: any, index: number) => ({
        tempId: `temp-${Date.now()}-${index}`,
        title: task.title,
        description: task.description || '',
        date: task.date || null,
        timeBlock: (task.timeBlock as TimeBlock) || 'anytime',
        scheduledHour: task.scheduledHour ?? null,
        scheduledMinute: task.scheduledMinute ?? 0,
        estimatedMinutes: task.estimatedMinutes || 30,
        priority: (task.priority as Priority) || 'medium',
        energyLevel: (task.energyLevel as EnergyLevel) || 'medium',
        icon: task.icon || '📋',
      }));

      setParsedTasks(previewTasks);
      setPhase('preview');
    } catch (err: any) {
      console.error('Error parsing tasks:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Update a specific parsed task
  const updateParsedTask = (tempId: string, updates: Partial<ParsedTask>) => {
    setParsedTasks((prev) =>
      prev.map((task) =>
        task.tempId === tempId ? { ...task, ...updates } : task
      )
    );
  };

  // Create a task from parsed data
  const createTaskFromParsed = async (parsedTask: ParsedTask): Promise<Task | null> => {
    // Calculate scheduled hour based on time block if not already set
    let scheduledHour = parsedTask.scheduledHour;
    const scheduledMinute = parsedTask.scheduledMinute ?? 0;

    if (scheduledHour === null && parsedTask.date && parsedTask.timeBlock !== 'anytime') {
      switch (parsedTask.timeBlock) {
        case 'morning':
          scheduledHour = 9;
          break;
        case 'afternoon':
          scheduledHour = 13;
          break;
        case 'evening':
          scheduledHour = 18;
          break;
      }
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: parsedTask.title,
          description: parsedTask.description,
          date: parsedTask.date,
          timeBlock: parsedTask.timeBlock,
          scheduledHour,
          scheduledMinute,
          estimatedMinutes: parsedTask.estimatedMinutes,
          priority: parsedTask.priority,
          energyLevel: parsedTask.energyLevel,
          icon: parsedTask.icon,
          status: 'pending',
          completed: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create task: ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error creating task:', err);
      return null;
    }
  };

  // Create task and start it immediately
  const handleStartNow = async (parsedTask: ParsedTask) => {
    setIsCreating(true);
    try {
      const createdTask = await createTaskFromParsed(parsedTask);
      if (createdTask) {
        onTasksCreated();
        if (onCreateAndStart) {
          onCreateAndStart(createdTask);
        }
        handleClose();
      } else {
        setError('Failed to create task');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Create task and start pomodoro
  const handleStartPomodoro = async (parsedTask: ParsedTask) => {
    setIsCreating(true);
    try {
      const createdTask = await createTaskFromParsed(parsedTask);
      if (createdTask) {
        onTasksCreated();
        if (onStartPomodoro) {
          onStartPomodoro(createdTask);
        }
        handleClose();
      } else {
        setError('Failed to create task');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Create all tasks without starting
  const handleCreateAll = async () => {
    setIsCreating(true);
    setError(null);

    try {
      for (const parsedTask of parsedTasks) {
        const created = await createTaskFromParsed(parsedTask);
        if (!created) {
          throw new Error(`Failed to create task: ${parsedTask.title}`);
        }
      }
      onTasksCreated();
      handleClose();
    } catch (err: any) {
      console.error('Error creating tasks:', err);
      setError(err.message || 'Failed to create some tasks');
    } finally {
      setIsCreating(false);
    }
  };

  // Go back to input phase
  const handleBack = () => {
    setPhase('input');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && e.metaKey && phase === 'input') {
      handleParse();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {phase === 'preview' && (
                <button
                  onClick={handleBack}
                  className="p-1 hover:bg-gray-100 rounded transition-colors mr-1"
                >
                  <ArrowLeft size={18} className="text-gray-500" />
                </button>
              )}
              <Sparkles className="text-purple-500" size={18} />
              <h2 className="text-base font-semibold text-gray-900">
                {phase === 'input' ? 'Smart Task Capture' : 'Preview & Schedule'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {phase === 'input' ? (
            // INPUT PHASE
            <>
              <p className="text-xs text-gray-500 mb-2">
                Type naturally, paste emails/text messages, or list multiple tasks. AI extracts action items automatically.
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Simple: 'Call mom tomorrow morning' or 'Buy groceries - 30 min'

Bulk paste: Copy entire emails, text messages, or meeting notes. AI will find your tasks.

Example: 'Hey! Can you send me the report by Friday? Also don't forget the team meeting at 2pm.'"
                className="w-full h-40 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y font-mono"
                autoFocus
                disabled={isLoading}
              />

              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2 text-xs text-purple-700">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-medium">What AI can detect:</p>
                    <ul className="space-y-0.5 ml-2 text-purple-600">
                      <li>• <span className="font-semibold">Simple tasks:</span> <span className="font-mono bg-white px-1 rounded text-[10px]">call mom tomorrow morning</span></li>
                      <li>• <span className="font-semibold">Dates/times:</span> <span className="font-mono bg-white px-1 rounded text-[10px]">Friday at 2pm</span> or <span className="font-mono bg-white px-1 rounded text-[10px]">this evening</span></li>
                      <li>• <span className="font-semibold">Priority/effort:</span> <span className="font-mono bg-white px-1 rounded text-[10px]">urgent</span>, <span className="font-mono bg-white px-1 rounded text-[10px]">quick task</span>, <span className="font-mono bg-white px-1 rounded text-[10px]">2 hours</span></li>
                      <li>• <span className="font-semibold">Emails/texts:</span> Extracts tasks from &quot;Can you...&quot;, &quot;Don&apos;t forget...&quot;, etc.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // PREVIEW PHASE
            <>
              <p className="text-xs text-gray-500 mb-3">
                Review and adjust before creating. Click &quot;Start Now&quot; or &quot;Pomodoro&quot; to create and begin immediately.
              </p>

              <div className="space-y-3">
                {parsedTasks.map((task) => (
                  <TaskPreviewCard
                    key={task.tempId}
                    task={task}
                    onUpdate={(updates) => updateParsedTask(task.tempId, updates)}
                    onStartNow={() => handleStartNow(task)}
                    onStartPomodoro={() => handleStartPomodoro(task)}
                    isCreating={isCreating}
                  />
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          {phase === 'input' ? (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                ⌘+Enter to extract • ESC to cancel
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleParse}
                  disabled={!text.trim() || isLoading}
                  className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Extract Tasks
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isCreating}
              >
                ← Back to Edit
              </button>
              <button
                onClick={handleCreateAll}
                disabled={isCreating || parsedTasks.length === 0}
                className="px-4 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create {parsedTasks.length === 1 ? 'Task' : `${parsedTasks.length} Tasks`}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
