"use client";

import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface SmartCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: () => void;
}

export const SmartCaptureModal: React.FC<SmartCaptureModalProps> = ({ isOpen, onClose, onTasksCreated }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Parse the text into structured tasks
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

      // Create each task
      const createdTasks = [];
      for (const task of tasks) {
        // Use parsed scheduledHour/Minute if available, otherwise set defaults
        let scheduledHour = task.scheduledHour ?? null;
        let scheduledMinute = task.scheduledMinute ?? 0;

        // If no specific time was parsed, but we have a date and timeBlock, set default times
        if (scheduledHour === null && task.date && task.timeBlock) {
          switch (task.timeBlock) {
            case 'morning':
              scheduledHour = 9; // 9:00 AM
              break;
            case 'afternoon':
              scheduledHour = 13; // 1:00 PM
              break;
            case 'evening':
              scheduledHour = 18; // 6:00 PM
              break;
            case 'anytime':
              scheduledHour = 9; // Default to morning
              break;
          }
        }

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...task,
            status: 'pending',
            completed: false,
            // Use parsed date/timeBlock if available, otherwise inbox
            date: task.date || null,
            timeBlock: task.timeBlock || 'anytime',
            scheduledHour,
            scheduledMinute,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to create task: ${errorData.error || 'Unknown error'}`);
        }

        const createdTask = await response.json();
        createdTasks.push(createdTask);
      }

      setText('');
      onTasksCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating tasks:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-500" size={18} />
              <h2 className="text-base font-semibold text-gray-900">Add Task</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-2">
            Type naturally – dates, times, priorities, and durations are auto-detected.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., 'Call mom tomorrow morning - quick 15 min task' or 'Finish quarterly report by Friday afternoon - high priority 2 hours'"
            className="w-full h-28 p-3 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono"
            autoFocus
            disabled={isLoading}
          />

          <div className="mt-2 p-2 bg-purple-50 border border-purple-200">
            <div className="flex items-start gap-2 text-xs text-purple-700">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-medium">Supported patterns:</p>
                <ul className="space-y-0.5 ml-2 text-purple-600">
                  <li>• <span className="font-mono bg-white px-1 rounded">tomorrow morning</span> or <span className="font-mono bg-white px-1 rounded">Friday afternoon</span></li>
                  <li>• <span className="font-mono bg-white px-1 rounded">urgent</span>, <span className="font-mono bg-white px-1 rounded">high priority</span>, or <span className="font-mono bg-white px-1 rounded">low priority</span></li>
                  <li>• <span className="font-mono bg-white px-1 rounded">quick task</span> or <span className="font-mono bg-white px-1 rounded">complex project</span></li>
                  <li>• <span className="font-mono bg-white px-1 rounded">30 min</span> or <span className="font-mono bg-white px-1 rounded">2 hours</span></li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-gray-400">
              ⌘+Enter to create • ESC to cancel
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || isLoading}
                className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Create
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
