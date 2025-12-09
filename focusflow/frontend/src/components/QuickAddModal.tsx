import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '../store';
import { TIME_BLOCKS, DEFAULT_PROJECTS } from '../types';
import type { TimeBlock, Priority, EnergyLevel } from '../types';

export default function QuickAddModal() {
  const { showQuickAdd, toggleQuickAdd, addTask, projects } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'personal');
  const [timeBlock, setTimeBlock] = useState<TimeBlock>('anytime');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showQuickAdd) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Determine energy level based on time block
      const energyLevel: EnergyLevel =
        timeBlock === 'morning'
          ? 'high'
          : timeBlock === 'evening'
          ? 'low'
          : 'medium';

      await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId,
        date: null, // Goes to inbox
        timeBlock,
        priority,
        estimatedMinutes,
        energyLevel,
        icon: projects.find((p) => p.id === projectId)?.icon || 'target',
        status: 'pending',
        subtasks: [],
        dependsOn: [],
        dependents: [],
        recurrenceType: 'none',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setEstimatedMinutes(30);
      setPriority('medium');
      setTimeBlock('anytime');
      toggleQuickAdd();
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      toggleQuickAdd();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Quick Add Task</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              autoFocus
              disabled={isSubmitting}
            />

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details (optional)"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none h-16"
              disabled={isSubmitting}
            />

            {/* Grid options */}
            <div className="grid grid-cols-2 gap-3">
              {/* Project */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Block */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Time Block
                </label>
                <select
                  value={timeBlock}
                  onChange={(e) => setTimeBlock(e.target.value as TimeBlock)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {TIME_BLOCKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Duration
                </label>
                <select
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>

          {/* Tip */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Tip: Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">N</kbd> to
            quickly add a task from anywhere
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
