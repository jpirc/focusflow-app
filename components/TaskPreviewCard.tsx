"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sun,
  Sunset,
  Moon,
  Clock,
  Play,
  Timer,
  ChevronDown,
  Circle,
  Folder
} from 'lucide-react';
import { TimeBlock, Priority, EnergyLevel, Project } from '@/types';

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
  projectId?: string | null;
}

interface TaskPreviewCardProps {
  task: ParsedTask;
  onUpdate: (updates: Partial<ParsedTask>) => void;
  onStartNow: () => void;
  onStartPomodoro: () => void;
  isCreating?: boolean;
  projects?: Project[];
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

// Time options for specific scheduling
const HOUR_OPTIONS = [
  { value: 6, label: '6am' },
  { value: 7, label: '7am' },
  { value: 8, label: '8am' },
  { value: 9, label: '9am' },
  { value: 10, label: '10am' },
  { value: 11, label: '11am' },
  { value: 12, label: '12pm' },
  { value: 13, label: '1pm' },
  { value: 14, label: '2pm' },
  { value: 15, label: '3pm' },
  { value: 16, label: '4pm' },
  { value: 17, label: '5pm' },
  { value: 18, label: '6pm' },
  { value: 19, label: '7pm' },
  { value: 20, label: '8pm' },
  { value: 21, label: '9pm' },
];

const MINUTE_OPTIONS = [
  { value: 0, label: ':00' },
  { value: 15, label: ':15' },
  { value: 30, label: ':30' },
  { value: 45, label: ':45' },
];

// Priority config
const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { label: 'Med', color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
};

const PRIORITY_ORDER: Priority[] = ['low', 'medium', 'high', 'urgent'];

// Smart project matching based on task title keywords
function autoDetectProject(title: string, projects: Project[]): string | null {
  const lowerTitle = title.toLowerCase();

  for (const project of projects) {
    const projectName = project.name.toLowerCase();
    // Check if task title contains project name
    if (lowerTitle.includes(projectName)) {
      return project.id;
    }
    // Check for common keyword matches
    const keywords = projectName.split(/\s+/);
    for (const keyword of keywords) {
      if (keyword.length > 3 && lowerTitle.includes(keyword)) {
        return project.id;
      }
    }
  }

  return null;
}

// Format time for display
function formatTime(hour: number | null, minute: number | null): string {
  if (hour === null) return 'No time';
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'am' : 'pm';
  const m = minute ?? 0;
  return `${h}:${m.toString().padStart(2, '0')}${ampm}`;
}

export const TaskPreviewCard: React.FC<TaskPreviewCardProps> = ({
  task,
  onUpdate,
  onStartNow,
  onStartPomodoro,
  isCreating = false,
  projects = [],
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [customDate, setCustomDate] = useState(task.date || getTodayString());

  const today = getTodayString();
  const tomorrow = getTomorrowString();

  // Auto-detect project on mount if not already set
  useEffect(() => {
    if (!task.projectId && projects.length > 0) {
      const detectedProjectId = autoDetectProject(task.title, projects);
      if (detectedProjectId) {
        onUpdate({ projectId: detectedProjectId });
      }
    }
  }, [task.title, task.projectId, projects, onUpdate]);

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

  const handleTimeSelect = (hour: number, minute: number) => {
    // Determine timeBlock from hour
    let timeBlock: TimeBlock = 'anytime';
    if (hour >= 6 && hour < 12) {
      timeBlock = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeBlock = 'afternoon';
    } else if (hour >= 17 && hour < 22) {
      timeBlock = 'evening';
    }

    onUpdate({
      scheduledHour: hour,
      scheduledMinute: minute,
      timeBlock,
      // If no date set, default to today when setting a specific time
      date: task.date || today
    });
    setShowTimePicker(false);
  };

  const handleClearTime = () => {
    onUpdate({ scheduledHour: null, scheduledMinute: null });
    setShowTimePicker(false);
  };

  const handleProjectSelect = (projectId: string | null) => {
    onUpdate({ projectId });
    setShowProjectPicker(false);
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const selectedProject = projects.find(p => p.id === task.projectId);

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

      {/* Quick Selectors */}
      <div className="space-y-2">
        {/* Date Selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-12">Date:</span>
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
          <span className="text-xs text-gray-500 w-12">Block:</span>
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

        {/* Specific Time Selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-12">Time:</span>
          <div className="relative">
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                task.scheduledHour !== null
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              {task.scheduledHour !== null
                ? formatTime(task.scheduledHour, task.scheduledMinute)
                : 'Set time'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTimePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 w-48">
                <div className="flex gap-2 mb-2">
                  {/* Hour selector */}
                  <select
                    value={task.scheduledHour ?? ''}
                    onChange={(e) => {
                      const hour = e.target.value ? parseInt(e.target.value) : null;
                      if (hour !== null) {
                        handleTimeSelect(hour, task.scheduledMinute ?? 0);
                      }
                    }}
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">Hour</option>
                    {HOUR_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {/* Minute selector */}
                  <select
                    value={task.scheduledMinute ?? 0}
                    onChange={(e) => {
                      const minute = parseInt(e.target.value);
                      if (task.scheduledHour !== null) {
                        handleTimeSelect(task.scheduledHour, minute);
                      }
                    }}
                    className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                    disabled={task.scheduledHour === null}
                  >
                    {MINUTE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleClearTime}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                >
                  Clear time
                </button>
              </div>
            )}
          </div>
          {/* Quick time buttons */}
          {task.scheduledHour === null && (
            <>
              <button
                onClick={() => handleTimeSelect(9, 0)}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                9am
              </button>
              <button
                onClick={() => handleTimeSelect(12, 0)}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                12pm
              </button>
              <button
                onClick={() => handleTimeSelect(14, 0)}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                2pm
              </button>
              <button
                onClick={() => handleTimeSelect(17, 0)}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                5pm
              </button>
            </>
          )}
        </div>

        {/* Duration Selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-12">Effort:</span>
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

        {/* Project Selection */}
        {projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-500 w-12">Project:</span>
            <div className="relative">
              <button
                onClick={() => setShowProjectPicker(!showProjectPicker)}
                className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                  task.projectId
                    ? 'font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={selectedProject ? {
                  backgroundColor: selectedProject.bgColor || selectedProject.color + '20',
                  color: selectedProject.color
                } : undefined}
              >
                <Folder className="w-3 h-3" />
                {selectedProject?.name || 'None'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showProjectPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10 min-w-[160px] max-h-48 overflow-y-auto">
                  <button
                    onClick={() => handleProjectSelect(null)}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 flex items-center gap-2 ${
                      !task.projectId ? 'bg-gray-100 font-medium' : ''
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-gray-300" />
                    None
                  </button>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 flex items-center gap-2 ${
                        task.projectId === project.id ? 'bg-gray-100 font-medium' : ''
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
