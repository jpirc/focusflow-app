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

      console.log('Parsed tasks:', tasks);

      // Create each task
      const createdTasks = [];
      for (const task of tasks) {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...task,
            status: 'pending',
            completed: false,
            date: null, // Tasks go to inbox (no date)
            timeBlock: null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to create task: ${errorData.error || 'Unknown error'}`);
        }

        const createdTask = await response.json();
        createdTasks.push(createdTask);
      }

      console.log('Created tasks:', createdTasks);

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
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">Smart Task Capture</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Dump your thoughts, notes, or ideas here. AI will organize them into actionable tasks.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g., 'Need to fix the leaky faucet in the bathroom, probably take 30 mins. Also book dentist appointment for next week and start planning mom's birthday party'"
            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            autoFocus
            disabled={isLoading}
          />

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">
              ⌘ + Enter to create tasks • ESC to cancel
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || isLoading}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Create Tasks
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
