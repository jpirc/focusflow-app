// ============================================
// FOCUSFLOW TYPES
// ============================================

export type TimeBlock = 'anytime' | 'morning' | 'afternoon' | 'evening';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'skipped' | 'carried-over';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  date: string | null; // ISO date string or null for inbox
  timeBlock: TimeBlock;
  estimatedMinutes: number;
  actualMinutes?: number;
  status: TaskStatus;
  priority: Priority;
  energyLevel: EnergyLevel;
  icon: string;
  subtasks: Subtask[];
  dependsOn: string[];
  dependents: string[];
  carriedOverFrom?: string;
  notes?: string;
  recurrenceType: RecurrenceType;
  recurrenceDays?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  description?: string;
}

export interface DragItem {
  taskId: string;
  sourceDate: string | null;
  sourceTimeBlock: TimeBlock;
}

export interface AIBreakdownResponse {
  subtasks: {
    title: string;
    estimatedMinutes: number;
    energyLevel: EnergyLevel;
    tips: string;
  }[];
  totalEstimatedMinutes: number;
  suggestedApproach: string;
  motivationTip: string;
}

export interface ScheduleSuggestion {
  taskId: string;
  suggestedTimeBlock: TimeBlock;
  reason: string;
}

export interface DaySchedule {
  date: string;
  morning: Task[];
  afternoon: Task[];
  evening: Task[];
  anytime: Task[];
  stats: {
    total: number;
    completed: number;
    progress: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultTaskDuration: number;
  morningStart: string;
  afternoonStart: string;
  eveningStart: string;
  highEnergyTime: TimeBlock;
  enableSounds: boolean;
  enableAnimations: boolean;
}

// Action history for undo/redo
export interface Action {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  taskId: string;
  previousState?: Partial<Task>;
  newState?: Partial<Task>;
  timestamp: string;
}

// Time block configuration
export interface TimeBlockConfig {
  id: TimeBlock;
  label: string;
  hours: string;
  energyMatch: EnergyLevel;
  startHour: number;
  endHour: number;
}

export const TIME_BLOCKS: TimeBlockConfig[] = [
  { id: 'anytime', label: 'Anytime', hours: 'Flexible', energyMatch: 'medium', startHour: 0, endHour: 24 },
  { id: 'morning', label: 'Morning', hours: '6 AM - 12 PM', energyMatch: 'high', startHour: 6, endHour: 12 },
  { id: 'afternoon', label: 'Afternoon', hours: '12 PM - 5 PM', energyMatch: 'medium', startHour: 12, endHour: 17 },
  { id: 'evening', label: 'Evening', hours: '5 PM - 10 PM', energyMatch: 'low', startHour: 17, endHour: 22 },
];

// Default projects
export const DEFAULT_PROJECTS: Project[] = [
  { id: 'work', name: 'Work', color: '#2563eb', bgColor: '#dbeafe', icon: 'briefcase', description: 'Professional tasks' },
  { id: 'health', name: 'Health & Fitness', color: '#059669', bgColor: '#d1fae5', icon: 'dumbbell', description: 'Exercise and wellness' },
  { id: 'learning', name: 'Learning', color: '#7c3aed', bgColor: '#ede9fe', icon: 'book', description: 'Courses and skill building' },
  { id: 'personal', name: 'Personal', color: '#ec4899', bgColor: '#fce7f3', icon: 'heart', description: 'Life admin and errands' },
  { id: 'home', name: 'Home', color: '#f59e0b', bgColor: '#fef3c7', icon: 'home', description: 'Household tasks' },
];

// Icon name to component mapping keys
export const TASK_ICONS = [
  'briefcase', 'dumbbell', 'book', 'heart', 'home', 'target', 'coffee',
  'phone', 'mail', 'calendar', 'clock', 'star', 'flag', 'bookmark',
  'folder', 'file', 'edit', 'check', 'x', 'alert', 'info', 'help',
  'settings', 'user', 'users', 'message', 'send', 'image', 'video',
  'music', 'headphones', 'mic', 'camera', 'map', 'navigation', 'globe',
  'sun', 'moon', 'cloud', 'umbrella', 'zap', 'battery', 'wifi',
  'bluetooth', 'monitor', 'smartphone', 'tablet', 'laptop', 'printer',
  'gift', 'shopping-cart', 'credit-card', 'dollar-sign', 'percent',
  'truck', 'package', 'box', 'archive', 'trash', 'refresh', 'download',
  'upload', 'share', 'link', 'external-link', 'copy', 'scissors', 'clipboard'
];

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  quickAdd: 'n',
  search: '/',
  undo: 'z',
  redo: 'y',
  today: 't',
  nextDay: 'ArrowRight',
  prevDay: 'ArrowLeft',
  completeTask: 'c',
  startTask: 's',
  deleteTask: 'Backspace',
  escape: 'Escape',
};
