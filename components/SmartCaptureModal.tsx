"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, X, Loader2, ArrowLeft, Zap, AlertCircle } from 'lucide-react';
import { Task, TimeBlock, Priority, EnergyLevel, Project } from '@/types';
import { TaskPreviewCard, ParsedTask } from './TaskPreviewCard';
import { VoiceCaptureButton } from './VoiceCaptureButton';
import { VoiceCaptureResult } from '@/hooks/useVoiceCapture';

/**
 * Smart Capture Modal - Multi-input task capture with AI parsing
 *
 * Input Methods:
 *   ┌─────────────┬─────────────┬─────────────┐
 *   │  Keyboard   │    Voice    │    Share    │
 *   │  (typing)   │  (mic btn)  │  (external) │
 *   └──────┬──────┴──────┬──────┴──────┬──────┘
 *          │             │             │
 *          └─────────────┴─────────────┘
 *                        │
 *                        ▼
 *          ┌─────────────────────────────┐
 *          │  Quick Mode?                │
 *          │  ├─ Yes → Parse → Inbox     │
 *          │  └─ No  → Parse → Preview   │
 *          └─────────────────────────────┘
 */

interface SmartCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: () => void;
  onCreateAndStart?: (task: Task) => void;
  onStartPomodoro?: (task: Task) => void;
  projects?: Project[];
  // New: Initial text from share intent
  initialText?: string;
  // New: Quick mode - skip preview, create to inbox
  quickModeEnabled?: boolean;
  onQuickModeChange?: (enabled: boolean) => void;
}

export const SmartCaptureModal: React.FC<SmartCaptureModalProps> = ({
  isOpen,
  onClose,
  onTasksCreated,
  onCreateAndStart,
  onStartPomodoro,
  projects = [],
  initialText = '',
  quickModeEnabled = false,
  onQuickModeChange,
}) => {
  // Phase: 'input' for text entry, 'preview' for showing parsed results
  const [phase, setPhase] = useState<'input' | 'preview'>('input');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [quickMode, setQuickMode] = useState(quickModeEnabled);

  // Handle initial text from share intent (append to existing)
  useEffect(() => {
    if (isOpen && initialText) {
      setText((prev) => {
        if (prev.trim()) {
          // Append to existing text with separator
          return prev + '\n\n' + initialText;
        }
        return initialText;
      });
    }
  }, [isOpen, initialText]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setPhase('input');
    setText('');
    setError(null);
    setVoiceError(null);
    setParsedTasks([]);
    onClose();
  }, [onClose]);

  // Handle voice capture result
  const handleVoiceTranscript = useCallback((result: VoiceCaptureResult) => {
    setVoiceError(null);
    setText((prev) => {
      if (prev.trim()) {
        // Append to existing text
        return prev + ' ' + result.transcript;
      }
      return result.transcript;
    });

    // Show warning if low confidence
    if (result.isLowConfidence) {
      setVoiceError('Voice captured with low confidence. Please review the text.');
    }
  }, []);

  // Handle voice capture error
  const handleVoiceError = useCallback((message: string) => {
    setVoiceError(message);
  }, []);

  // Toggle quick mode
  const handleQuickModeToggle = useCallback(() => {
    const newValue = !quickMode;
    setQuickMode(newValue);
    onQuickModeChange?.(newValue);
  }, [quickMode, onQuickModeChange]);

  if (!isOpen) return null;

  // Parse text and move to preview phase (or quick create if quick mode enabled)
  const handleParse = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setVoiceError(null);

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

      if (!tasks || tasks.length === 0) {
        throw new Error("Couldn't extract any tasks. Try rephrasing.");
      }

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

      // Quick mode: create directly to inbox without preview
      if (quickMode) {
        await handleQuickCreate(previewTasks);
      } else {
        setParsedTasks(previewTasks);
        setPhase('preview');
      }
    } catch (err: any) {
      console.error('Error parsing tasks:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick create: parse and create tasks directly to inbox
  const handleQuickCreate = async (tasks: ParsedTask[]) => {
    setIsCreating(true);
    let createdCount = 0;

    try {
      for (const task of tasks) {
        // In quick mode, all tasks go to inbox (no date, anytime timeblock)
        const inboxTask: ParsedTask = {
          ...task,
          date: null,
          timeBlock: 'anytime',
          scheduledHour: null,
          scheduledMinute: 0,
        };

        const created = await createTaskFromParsed(inboxTask);
        if (created) {
          createdCount++;
        }
      }

      if (createdCount > 0) {
        onTasksCreated();
        handleClose();
        // Note: Toast notification should be handled by parent component
      } else {
        throw new Error('Failed to create tasks');
      }
    } catch (err: any) {
      console.error('Error in quick create:', err);
      setError(err.message || 'Failed to create tasks');
    } finally {
      setIsCreating(false);
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
      const taskPayload = {
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
        projectId: parsedTask.projectId || null,
        status: 'pending',
        completed: false,
      };

      console.log('[SmartCapture] Creating task with payload:', taskPayload);

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[SmartCapture] API error:', response.status, errorData);
        // Log validation details if present
        if (errorData.details) {
          console.error('[SmartCapture] Validation details:', JSON.stringify(errorData.details, null, 2));
        }
        throw new Error(`Failed to create task: ${errorData.error || 'Unknown error'}`);
      }

      const created = await response.json();
      console.log('[SmartCapture] Task created successfully:', created.id);
      return created;
    } catch (err) {
      console.error('[SmartCapture] Error creating task:', err);
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
                Type, speak, or paste. AI extracts tasks automatically.
              </p>

              {/* Text input with voice button */}
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type or tap the mic to speak...

Example: 'Call mom tomorrow morning' or paste an email"
                  className="w-full h-32 p-3 pr-14 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y font-mono"
                  autoFocus
                  disabled={isLoading || isCreating}
                />

                {/* Voice capture button - positioned inside textarea */}
                <div className="absolute top-2 right-2">
                  <VoiceCaptureButton
                    onTranscript={handleVoiceTranscript}
                    onError={handleVoiceError}
                    disabled={isLoading || isCreating}
                  />
                </div>
              </div>

              {/* Voice error message */}
              {voiceError && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{voiceError}</p>
                </div>
              )}

              {/* Quick mode toggle */}
              <div className="mt-3 flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${quickMode ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">Quick Capture</p>
                    <p className="text-[10px] text-gray-500">Skip preview, add to inbox</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={quickMode}
                  onClick={handleQuickModeToggle}
                  className={`
                    relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                    ${quickMode ? 'bg-purple-500' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow
                      ${quickMode ? 'translate-x-4' : 'translate-x-0.5'}
                    `}
                  />
                </button>
              </div>

              {/* AI hints - more compact */}
              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2 text-xs text-purple-700">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">AI detects dates, times, priority & effort</p>
                    <p className="text-[10px] text-purple-600 mt-0.5">
                      Try: &quot;urgent meeting Friday 2pm&quot; or paste emails/texts
                    </p>
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
                    projects={projects}
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
                ⌘+Enter to {quickMode ? 'capture' : 'extract'} • ESC to cancel
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isLoading || isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleParse}
                  disabled={!text.trim() || isLoading || isCreating}
                  className={`
                    px-3 py-1.5 text-sm text-white rounded-lg transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5
                    ${quickMode
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-purple-500 hover:bg-purple-600'
                    }
                  `}
                >
                  {isLoading || isCreating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {isCreating ? 'Creating...' : 'Extracting...'}
                    </>
                  ) : quickMode ? (
                    <>
                      <Zap size={14} />
                      Quick Capture
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
