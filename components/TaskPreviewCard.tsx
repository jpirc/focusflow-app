"use client";

import React, { useState } from 'react';
import {
  Calendar,
  Sun,
  Sunset,
  Moon,
  Clock,
  Play,
  Timer,
  ChevronDown,
  Check,
  Circle
} from 'lucide-react';
import { TimeBlock, Priority, EnergyLevel } from '@/types';

export interface ParsedTask {
  tempId: string;
  title: string;
  description?: string;
  date: string | null;
  timeBlock: TimeBlock;
  scheduledHour: number | null;
  scheduledMinute: number | null;
  estimatedMinutes: number;
  priority: Priority;
  energyLevel: EnergyLevel;
  icon: string;
}

interface TaskPreviewCardProps {
  task: ParsedTask;
  onUpdate: (updates: Partial<ParsedTask>) => void;
  onStartNow: () => void;
  onStartPomodoro: () => void;
  isCreating?: boolean;
}

// Date helper functions
function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function formatDateLabel(dateStr: string | null): string {
  if (!dateStr) return 'Inbox';
  const today = getTodayString();
  const tomorrow = getTomorrowString();
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Time block config
const TIME_BLOCKS: { id: TimeBlock; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: 'anytime', label: 'Anytime', shortLabel: 'Any', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'morning', label: 'Morning', shortLabel: 'AM', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'afternoon', label: 'Afternoon', shortLabel: 'PM', icon: <Sunset className="w-3.5 h-3.5" /> },
  { id: 'evening', label: 'Evening', shortLabel: 'Eve', icon: <Moon className="w-3.5 h-3.5" /> },
];

// Duration options
const DURATION_OPTIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
];

// Priority config
const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { label: 'Med', color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
};

const PRIORITY_ORDER: Priority[] = ['low', 'medium', 'high', 'urgent'];

export const TaskPreviewCard: React.FC<TaskPreviewCardProps> = ({
  task,
  onUpdate,
  onStartNow,
  onStartPomodoro,
  isCreating = false,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState(task.date || getTodayString());

  const today = getTodayString();
  const tomorrow = getTomorrowString();

  const cyclePriority = () => {
    const currentIndex = PRIORITY_ORDER.indexOf(task.priority);
    const nextIndex = (currentIndex + 1) % PRIORITY_ORDER.length;
    onUpdate({ priority: PRIORITY_ORDER[nextIndex] });
  };

  const handleDateSelect = (date: string | null) => {
    onUpdate({ date });
    setShowDatePicker(false);
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setCustomDate(newDate);
    onUpdate({ date: newDate });
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-3">
      {/* Task Title */}
      <div className="flex items-start gap-2">
        <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-900 flex-1">
          {task.title}
        </span>
        {/* Priority Badge */}
        <button
          onClick={cyclePriority}
          className={`px-2 py-0.5 text-xs font-medium rounded ${priorityConfig.bg} ${priorityConfig.color} hover:opacity-80 transition-opacity`}
          title="Click to change priority"
        >
          {priorityConfig.label}
        </button>
      </div>

      {/* Quick Selectors Row */}
      <div className="space-y-2">
        {/* Date Selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-12">When:</span>
          <button
            onClick={() => handleDateSelect(null)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              task.date === null
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => handleDateSelect(today)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              task.date === today
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleDateSelect(tomorrow)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              task.date === tomorrow
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tomorrow
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                task.date && task.date !== today && task.date !== tomorrow
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {task.date && task.date !== today && task.date !== tomorrow
                ? formatDateLabel(task.date)
                : 'Pick'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                <input
                  type="date"
                  value={customDate}
                  onChange={handleCustomDateChange}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  min={today}
                />
              </div>
            )}
          </div>
        </div>

        {/* Time Block Selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-12">Time:</span>
          {TIME_BLOCKS.map((block) => (
            <button
              key={block.id}
              onClick={() => onUpdate({ timeBlock: block.id })}
              className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                task.timeBlock === block.id
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {block.icon}
              {block.shortLabel}
            </button>
          ))}
        </div>

        {/* Duration Selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-12">Time:</span>
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ estimatedMinutes: opt.value })}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                task.estimatedMinutes === opt.value
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onStartNow}
          disabled={isCreating}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Start Now
        </button>
        <button
          onClick={onStartPomodoro}
          disabled={isCreating}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <Timer className="w-4 h-4" />
          Pomodoro
        </button>
      </div>
    </div>
  );
};
