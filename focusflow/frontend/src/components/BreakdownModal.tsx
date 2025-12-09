import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Plus, Check, Lightbulb, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import { aiApi } from '../api';
import type { AIBreakdownResponse, EnergyLevel } from '../types';

export default function BreakdownModal() {
  const {
    showBreakdownModal,
    closeBreakdownModal,
    breakdownTaskId,
    tasks,
    applyBreakdown,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<AIBreakdownResponse | null>(null);
  const [selectedSubtasks, setSelectedSubtasks] = useState<Set<number>>(new Set());
  const [context, setContext] = useState('');
  const [error, setError] = useState<string | null>(null);

  const task = tasks.find((t) => t.id === breakdownTaskId);

  if (!showBreakdownModal || !task) return null;

  const handleGenerateBreakdown = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await aiApi.breakdownTask(
        task.title,
        task.description,
        task.estimatedMinutes,
        context || undefined
      );
      setBreakdown(result);
      // Select all subtasks by default
      setSelectedSubtasks(new Set(result.subtasks.map((_, i) => i)));
    } catch (err) {
      setError('Failed to generate breakdown. Please try again.');
      console.error('Breakdown error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubtask = (index: number) => {
    const newSelected = new Set(selectedSubtasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSubtasks(newSelected);
  };

  const handleApply = async () => {
    if (!breakdown) return;
    
    const selectedItems = breakdown.subtasks
      .filter((_, i) => selectedSubtasks.has(i))
      .map((st) => ({
        title: st.title,
        estimatedMinutes: st.estimatedMinutes,
      }));

    if (selectedItems.length > 0) {
      await applyBreakdown(task.id, selectedItems);
    }
    
    closeBreakdownModal();
  };

  const getEnergyColor = (level: EnergyLevel) => {
    switch (level) {
      case 'low': return 'text-slate-500 bg-slate-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'high': return 'text-green-600 bg-green-100';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={closeBreakdownModal}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-lg font-semibold">AI Task Breakdown</h2>
              </div>
              <button
                onClick={closeBreakdownModal}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/80 text-sm mt-1">
              Let AI help break "{task.title}" into smaller, manageable steps
            </p>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Pre-breakdown state */}
            {!breakdown && !isLoading && (
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-800 mb-1">
                    Feeling stuck? Let's break it down!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Our AI will create small, actionable steps to help you get started
                    without overwhelm.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Add context (optional)
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Any additional details that might help? e.g., 'I have 2 hours', 'I'm feeling low energy', 'This is urgent'"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none h-20 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerateBreakdown}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Break Down This Task
                </button>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="py-12 text-center">
                <Loader2 className="w-10 h-10 text-purple-500 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600 font-medium">Analyzing your task...</p>
                <p className="text-sm text-gray-500 mt-1">
                  Creating small, achievable steps just for you
                </p>
              </div>
            )}

            {/* Breakdown results */}
            {breakdown && !isLoading && (
              <div className="space-y-4">
                {/* Motivation tip */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 flex gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {breakdown.motivationTip}
                    </p>
                  </div>
                </div>

                {/* Suggested approach */}
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Approach:</span>{' '}
                    {breakdown.suggestedApproach}
                  </p>
                </div>

                {/* Subtasks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">
                      Steps ({selectedSubtasks.size} selected)
                    </h4>
                    <span className="text-xs text-gray-500">
                      Total: {breakdown.totalEstimatedMinutes} min
                    </span>
                  </div>

                  <div className="space-y-2">
                    {breakdown.subtasks.map((subtask, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => toggleSubtask(index)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedSubtasks.has(index)
                            ? 'border-purple-400 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                              selectedSubtasks.has(index)
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-200'
                            }`}
                          >
                            {selectedSubtasks.has(index) && <Check className="w-3 h-3" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-500">
                                Step {index + 1}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {subtask.estimatedMinutes} min
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${getEnergyColor(
                                  subtask.energyLevel
                                )}`}
                              >
                                <Zap className="w-3 h-3 inline mr-0.5" />
                                {subtask.energyLevel}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {subtask.title}
                            </p>
                            {subtask.tips && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                💡 {subtask.tips}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Regenerate option */}
                <button
                  onClick={handleGenerateBreakdown}
                  className="w-full py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Regenerate with different breakdown
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {breakdown && (
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button
                onClick={closeBreakdownModal}
                className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={selectedSubtasks.size === 0}
                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add {selectedSubtasks.size} Steps
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
