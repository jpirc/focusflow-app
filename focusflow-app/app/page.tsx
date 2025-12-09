'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, Plus, ChevronLeft, ChevronRight, Play, Pause, Check, GripVertical, 
  Coffee, Briefcase, Home, Heart, Dumbbell, BookOpen, Link2, Sparkles,
  ChevronDown, ChevronUp, Sun, Sunrise, Sunset, Inbox, FolderKanban,
  Target, BatteryLow, BatteryMedium, BatteryFull, MoreHorizontal,
  Calendar, ArrowRight, Trash2, Edit3, Copy, X, Layers, Circle, Flag,
  CheckCircle2, Wand2, Loader2, Bell, Settings, User, LogOut, Search,
  Zap, TrendingUp, Volume2, VolumeX, Moon, Menu, Timer, Brain, Lightbulb,
  AlertTriangle, RefreshCw, ExternalLink, Share2, Download
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type TimeBlock = 'anytime' | 'morning' | 'afternoon' | 'evening';
type EnergyLevel = 'low' | 'medium' | 'high';
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'skipped' | 'carried-over';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Project {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  description?: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  date: string | null;
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
  createdAt: string;
  aiGenerated?: boolean;
}

interface DragItem {
  taskId: string;
  sourceDate: string | null;
  sourceTimeBlock: TimeBlock;
}

interface AIBreakdownSuggestion {
  subtasks: { title: string; estimatedMinutes: number }[];
  totalEstimate: number;
  tips: string[];
}

// ============================================
// CONSTANTS
// ============================================

const TIME_BLOCKS: { id: TimeBlock; label: string; icon: React.ReactNode; hours: string; energyMatch: EnergyLevel }[] = [
  { id: 'anytime', label: 'Anytime', icon: <Clock size={16} />, hours: 'Flexible', energyMatch: 'medium' },
  { id: 'morning', label: 'Morning', icon: <Sunrise size={16} />, hours: '6 AM - 12 PM', energyMatch: 'high' },
  { id: 'afternoon', label: 'Afternoon', icon: <Sun size={16} />, hours: '12 PM - 5 PM', energyMatch: 'medium' },
  { id: 'evening', label: 'Evening', icon: <Sunset size={16} />, hours: '5 PM - 10 PM', energyMatch: 'low' },
];

const PROJECTS: Project[] = [
  { id: 'work', name: 'Work', color: '#2563eb', bgColor: '#dbeafe', icon: 'briefcase' },
  { id: 'health', name: 'Health & Fitness', color: '#059669', bgColor: '#d1fae5', icon: 'dumbbell' },
  { id: 'learning', name: 'Learning', color: '#7c3aed', bgColor: '#ede9fe', icon: 'book' },
  { id: 'personal', name: 'Personal', color: '#ec4899', bgColor: '#fce7f3', icon: 'heart' },
  { id: 'home', name: 'Home', color: '#f59e0b', bgColor: '#fef3c7', icon: 'home' },
];

// ============================================
// UTILITIES
// ============================================

const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = addDays(today, 1);
  if (dateStr === formatDate(today)) return 'Today';
  if (dateStr === formatDate(tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const isToday = (dateStr: string): boolean => dateStr === formatDate(new Date());

const iconMap: Record<string, React.ReactNode> = {
  coffee: <Coffee size={14} />,
  briefcase: <Briefcase size={14} />,
  home: <Home size={14} />,
  heart: <Heart size={14} />,
  dumbbell: <Dumbbell size={14} />,
  book: <BookOpen size={14} />,
  target: <Target size={14} />,
};

// ============================================
// SAMPLE DATA
// ============================================

const createSampleTasks = (): Task[] => {
  const today = formatDate(new Date());
  const tomorrow = formatDate(addDays(new Date(), 1));
  const dayAfter = formatDate(addDays(new Date(), 2));
  
  return [
    {
      id: 't1', title: 'Morning Standup', description: 'Daily team sync', projectId: 'work',
      date: today, timeBlock: 'morning', estimatedMinutes: 30, status: 'completed',
      priority: 'medium', energyLevel: 'medium', icon: 'briefcase',
      subtasks: [], dependsOn: [], dependents: ['t2'], createdAt: new Date().toISOString()
    },
    {
      id: 't2', title: 'Q4 Planning Document', description: 'Draft the quarterly objectives', projectId: 'work',
      date: today, timeBlock: 'morning', estimatedMinutes: 120, status: 'in-progress',
      priority: 'high', energyLevel: 'high', icon: 'briefcase',
      subtasks: [
        { id: 's1', title: 'Review Q3 metrics', completed: true, estimatedMinutes: 30 },
        { id: 's2', title: 'Draft objectives', completed: false, estimatedMinutes: 45 },
        { id: 's3', title: 'Get stakeholder input', completed: false, estimatedMinutes: 30 },
      ],
      dependsOn: ['t1'], dependents: ['t5'], createdAt: new Date().toISOString()
    },
    {
      id: 't3', title: 'Gym - Upper Body', description: 'Chest, shoulders, triceps', projectId: 'health',
      date: today, timeBlock: 'afternoon', estimatedMinutes: 60, status: 'pending',
      priority: 'medium', energyLevel: 'high', icon: 'dumbbell',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't4', title: 'Read AI Research Paper', projectId: 'learning',
      date: today, timeBlock: 'evening', estimatedMinutes: 45, status: 'pending',
      priority: 'low', energyLevel: 'low', icon: 'book',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't5', title: 'Present Q4 Plan', description: 'Leadership review meeting', projectId: 'work',
      date: tomorrow, timeBlock: 'morning', estimatedMinutes: 60, status: 'pending',
      priority: 'urgent', energyLevel: 'high', icon: 'briefcase',
      subtasks: [], dependsOn: ['t2'], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't6', title: 'Dentist Appointment', projectId: 'personal',
      date: tomorrow, timeBlock: 'afternoon', estimatedMinutes: 60, status: 'pending',
      priority: 'high', energyLevel: 'low', icon: 'heart',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't7', title: 'Online Course Module 3', description: 'React Advanced Patterns', projectId: 'learning',
      date: tomorrow, timeBlock: 'evening', estimatedMinutes: 90, status: 'pending',
      priority: 'medium', energyLevel: 'medium', icon: 'book',
      subtasks: [
        { id: 's4', title: 'Watch lecture videos', completed: false, estimatedMinutes: 45 },
        { id: 's5', title: 'Complete exercises', completed: false, estimatedMinutes: 45 },
      ],
      dependsOn: [], dependents: ['t9'], createdAt: new Date().toISOString()
    },
    {
      id: 't8', title: 'Grocery Shopping', projectId: 'home',
      date: dayAfter, timeBlock: 'morning', estimatedMinutes: 45, status: 'pending',
      priority: 'medium', energyLevel: 'medium', icon: 'home',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't9', title: 'Course Quiz', description: 'Module 3 assessment', projectId: 'learning',
      date: dayAfter, timeBlock: 'afternoon', estimatedMinutes: 30, status: 'pending',
      priority: 'high', energyLevel: 'high', icon: 'book',
      subtasks: [], dependsOn: ['t7'], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't10', title: 'Research vacation destinations', projectId: 'personal',
      date: null, timeBlock: 'anytime', estimatedMinutes: 30, status: 'pending',
      priority: 'low', energyLevel: 'low', icon: 'heart',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't11', title: 'Update LinkedIn profile', projectId: 'work',
      date: null, timeBlock: 'anytime', estimatedMinutes: 20, status: 'pending',
      priority: 'low', energyLevel: 'low', icon: 'briefcase',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
  ];
};

// ============================================
// AI TASK BREAKDOWN COMPONENT
// ============================================

interface AIBreakdownModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onApply: (subtasks: Subtask[]) => void;
}

const AIBreakdownModal: React.FC<AIBreakdownModalProps> = ({ task, isOpen, onClose, onApply }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AIBreakdownSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateBreakdown = async () => {
    setIsLoading(true);
    setError(null);
    
    // Simulated AI response - in production this would call Claude API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate contextual breakdown based on task title
    const breakdowns: Record<string, AIBreakdownSuggestion> = {
      default: {
        subtasks: [
          { title: 'Gather materials and context needed', estimatedMinutes: 10 },
          { title: 'Create initial outline or draft', estimatedMinutes: 15 },
          { title: 'Work on main content/task', estimatedMinutes: Math.max(15, task.estimatedMinutes - 40) },
          { title: 'Review and refine', estimatedMinutes: 10 },
          { title: 'Final check and wrap up', estimatedMinutes: 5 },
        ],
        totalEstimate: task.estimatedMinutes,
        tips: [
          'Start with the easiest subtask to build momentum',
          'Take a 5-minute break between subtasks if needed',
          'Check off each subtask as you complete it for dopamine boost'
        ]
      }
    };

    // Customize based on task keywords
    if (task.title.toLowerCase().includes('document') || task.title.toLowerCase().includes('report')) {
      setSuggestion({
        subtasks: [
          { title: 'Review requirements and gather source materials', estimatedMinutes: 15 },
          { title: 'Create document outline with main sections', estimatedMinutes: 10 },
          { title: 'Write first draft of key sections', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.4) },
          { title: 'Add supporting details and examples', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.2) },
          { title: 'Review, edit, and format', estimatedMinutes: 15 },
          { title: 'Get feedback or final approval', estimatedMinutes: 10 },
        ],
        totalEstimate: task.estimatedMinutes,
        tips: [
          'Don\'t aim for perfection on the first draft',
          'Use bullet points first, then convert to prose',
          'Set a timer for each section to maintain momentum'
        ]
      });
    } else if (task.title.toLowerCase().includes('meeting') || task.title.toLowerCase().includes('present')) {
      setSuggestion({
        subtasks: [
          { title: 'Review meeting agenda and objectives', estimatedMinutes: 5 },
          { title: 'Prepare talking points or slides', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.3) },
          { title: 'Anticipate questions and prepare answers', estimatedMinutes: 10 },
          { title: 'Do a quick practice run-through', estimatedMinutes: 10 },
          { title: 'Attend meeting and present', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.4) },
          { title: 'Document action items and follow-ups', estimatedMinutes: 5 },
        ],
        totalEstimate: task.estimatedMinutes,
        tips: [
          'Arrive 5 minutes early to settle in',
          'Have your materials open and ready beforehand',
          'It\'s okay to say "I\'ll follow up on that"'
        ]
      });
    } else if (task.title.toLowerCase().includes('email') || task.title.toLowerCase().includes('write')) {
      setSuggestion({
        subtasks: [
          { title: 'Identify the main purpose and recipient needs', estimatedMinutes: 3 },
          { title: 'Draft the key message in bullet points', estimatedMinutes: 5 },
          { title: 'Expand bullets into full sentences', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.4) },
          { title: 'Add opening and closing', estimatedMinutes: 5 },
          { title: 'Proofread and send', estimatedMinutes: 5 },
        ],
        totalEstimate: task.estimatedMinutes,
        tips: [
          'Start with the action you want the reader to take',
          'Keep paragraphs short (2-3 sentences max)',
          'Read it aloud before sending'
        ]
      });
    } else if (task.title.toLowerCase().includes('research') || task.title.toLowerCase().includes('learn')) {
      setSuggestion({
        subtasks: [
          { title: 'Define what you want to learn/find out', estimatedMinutes: 5 },
          { title: 'Identify 3-5 good sources', estimatedMinutes: 10 },
          { title: 'Read/review sources and take notes', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.5) },
          { title: 'Synthesize key findings', estimatedMinutes: 10 },
          { title: 'Document conclusions or next steps', estimatedMinutes: 5 },
        ],
        totalEstimate: task.estimatedMinutes,
        tips: [
          'Set a time limit to avoid rabbit holes',
          'Use the Pomodoro technique (25 min focus, 5 min break)',
          'Write summaries in your own words to retain information'
        ]
      });
    } else {
      setSuggestion(breakdowns.default);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && !suggestion) {
      generateBreakdown();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (suggestion) {
      const newSubtasks: Subtask[] = suggestion.subtasks.map((st, i) => ({
        id: `ai-${Date.now()}-${i}`,
        title: st.title,
        completed: false,
        estimatedMinutes: st.estimatedMinutes
      }));
      onApply(newSubtasks);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Brain size={20} />
              </div>
              <div>
                <h2 className="font-semibold">AI Task Breakdown</h2>
                <p className="text-sm text-white/80">Making "{task.title}" manageable</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 size={40} className="mx-auto text-purple-500 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Analyzing your task...</p>
              <p className="text-sm text-gray-400 mt-1">Breaking it into bite-sized pieces</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle size={40} className="mx-auto text-amber-500 mb-4" />
              <p className="text-gray-600">{error}</p>
              <button 
                onClick={generateBreakdown}
                className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                Try Again
              </button>
            </div>
          ) : suggestion ? (
            <div className="space-y-4">
              {/* Suggested subtasks */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-500" />
                  Suggested Subtasks
                </h3>
                <div className="space-y-2">
                  {suggestion.subtasks.map((subtask, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{subtask.title}</p>
                      </div>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        ~{subtask.estimatedMinutes}min
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm text-gray-500">
                  Total: ~{suggestion.subtasks.reduce((sum, st) => sum + st.estimatedMinutes, 0)} minutes
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <h4 className="text-sm font-medium text-amber-800 flex items-center gap-1.5 mb-2">
                  <Lightbulb size={14} />
                  Getting Started Tips
                </h4>
                <ul className="space-y-1">
                  {suggestion.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!isLoading && suggestion && (
          <div className="p-4 border-t bg-gray-50 flex gap-2">
            <button
              onClick={generateBreakdown}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-white flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Regenerate
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 font-medium"
            >
              <Check size={16} />
              Apply Breakdown
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// PRIORITY & ENERGY BADGES
// ============================================

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles[priority]}`}>
      {priority === 'urgent' && <Flag size={10} className="inline mr-0.5" />}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const EnergyBadge: React.FC<{ level: EnergyLevel }> = ({ level }) => {
  const config = {
    low: { icon: <BatteryLow size={12} />, color: 'text-slate-500' },
    medium: { icon: <BatteryMedium size={12} />, color: 'text-amber-500' },
    high: { icon: <BatteryFull size={12} />, color: 'text-green-500' },
  };
  return <span className={config[level].color}>{config[level].icon}</span>;
};

// ============================================
// TASK CARD COMPONENT
// ============================================

interface TaskCardProps {
  task: Task;
  project: Project;
  allTasks: Task[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onStartDrag: (item: DragItem) => void;
  onDelete: (id: string) => void;
  onAIBreakdown: (task: Task) => void;
  onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task, project, allTasks, isSelected, onSelect, onStatusChange, 
  onToggleSubtask, onStartDrag, onDelete, onAIBreakdown
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const dependencyTasks = task.dependsOn.map(id => allTasks.find(t => t.id === id)).filter(Boolean);
  const hasBlockingDeps = dependencyTasks.some(t => t && t.status !== 'completed');
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  
  const statusConfig = {
    'pending': { bg: 'bg-white', ring: '' },
    'in-progress': { bg: 'bg-white', ring: 'ring-2 ring-blue-400 ring-offset-1' },
    'completed': { bg: 'bg-white/60', ring: '' },
    'skipped': { bg: 'bg-white/40', ring: '' },
    'carried-over': { bg: 'bg-amber-50', ring: 'ring-1 ring-amber-300' },
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        onStartDrag({ taskId: task.id, sourceDate: task.date, sourceTimeBlock: task.timeBlock });
      }}
      onClick={() => onSelect(task.id)}
      className={`
        group relative rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing
        ${statusConfig[task.status].bg} ${statusConfig[task.status].ring}
        ${isSelected ? 'ring-2 ring-purple-400 ring-offset-1' : ''}
        ${task.status === 'completed' ? 'opacity-70' : ''}
        ${hasBlockingDeps ? 'border-dashed border-amber-400' : 'border-gray-200'}
        hover:shadow-md
      `}
      style={{ borderLeftColor: project.color, borderLeftWidth: '3px' }}
    >
      {/* AI Generated badge */}
      {task.aiGenerated && (
        <div className="absolute -top-2 -left-2 bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Sparkles size={10} /> AI
        </div>
      )}
      
      {/* Carried over indicator */}
      {task.carriedOverFrom && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <ArrowRight size={10} /> Carried
        </div>
      )}
      
      <div className="p-2">
        <div className="flex items-start gap-2">
          {/* Status checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
              onStatusChange(task.id, nextStatus);
            }}
            className="mt-0.5 flex-shrink-0"
          >
            {task.status === 'completed' ? (
              <CheckCircle2 size={18} className="text-green-500" />
            ) : task.status === 'in-progress' ? (
              <div className="w-[18px] h-[18px] rounded-full border-2 border-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
            ) : (
              <Circle size={18} className="text-gray-300 hover:text-gray-400" />
            )}
          </button>

          {/* Task info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span 
                className="p-1 rounded"
                style={{ backgroundColor: project.bgColor, color: project.color }}
              >
                {iconMap[task.icon] || <Target size={14} />}
              </span>
              <h4 className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {task.title}
              </h4>
            </div>
            
            {/* Meta info */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-gray-500">{task.estimatedMinutes}min</span>
              <PriorityBadge priority={task.priority} />
              <EnergyBadge level={task.energyLevel} />
              
              {task.subtasks.length > 0 && (
                <span className="text-[11px] text-gray-500">
                  {completedSubtasks}/{task.subtasks.length} steps
                </span>
              )}
              
              {task.dependsOn.length > 0 && (
                <span className={`text-[11px] flex items-center gap-0.5 ${hasBlockingDeps ? 'text-amber-600' : 'text-green-600'}`}>
                  <Link2 size={10} />
                  {hasBlockingDeps ? 'Blocked' : 'Ready'}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.status === 'pending' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'in-progress'); }}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
                title="Start task"
              >
                <Play size={14} className="text-blue-600" />
              </button>
            )}
            
            {/* AI Breakdown button */}
            {task.status !== 'completed' && task.subtasks.length === 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onAIBreakdown(task); }}
                className="p-1 hover:bg-purple-100 rounded transition-colors"
                title="AI breakdown"
              >
                <Wand2 size={14} className="text-purple-500" />
              </button>
            )}
            
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <MoreHorizontal size={14} className="text-gray-400" />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 z-50 min-w-[160px]">
                    <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Edit3 size={14} /> Edit task
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAIBreakdown(task); setShowMenu(false); }}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-purple-50 text-purple-600 flex items-center gap-2"
                    >
                      <Wand2 size={14} /> AI breakdown
                    </button>
                    <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Link2 size={14} /> Link to task
                    </button>
                    <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Copy size={14} /> Duplicate
                    </button>
                    <hr className="my-1" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(task.id); setShowMenu(false); }}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {task.subtasks.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            
            <GripVertical size={14} className="text-gray-300 cursor-grab" />
          </div>
        </div>

        {/* Subtasks (expanded) */}
        {expanded && task.subtasks.length > 0 && (
          <div className="mt-2 ml-6 space-y-1 border-l-2 border-gray-100 pl-2">
            {task.subtasks.map(subtask => (
              <div key={subtask.id} className="flex items-center gap-2 group/subtask">
                <button onClick={(e) => { e.stopPropagation(); onToggleSubtask(task.id, subtask.id); }}>
                  {subtask.completed ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Circle size={14} className="text-gray-300 group-hover/subtask:text-gray-400" />
                  )}
                </button>
                <span className={`text-xs flex-1 ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                  {subtask.title}
                </span>
                {subtask.estimatedMinutes && (
                  <span className="text-[10px] text-gray-400">{subtask.estimatedMinutes}m</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// TIME BLOCK COLUMN
// ============================================

interface TimeBlockColumnProps {
  block: typeof TIME_BLOCKS[0];
  tasks: Task[];
  allTasks: Task[];
  projects: Project[];
  date: string;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onStartDrag: (item: DragItem) => void;
  onDrop: (taskId: string, targetDate: string, targetBlock: TimeBlock) => void;
  onDelete: (id: string) => void;
  onAIBreakdown: (task: Task) => void;
  onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
}

const TimeBlockColumn: React.FC<TimeBlockColumnProps> = ({
  block, tasks, allTasks, projects, date, selectedTaskId,
  onSelectTask, onStatusChange, onToggleSubtask, onStartDrag, onDrop, onDelete,
  onAIBreakdown, onUpdateSubtasks
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) onDrop(taskId, date, block.id);
  };

  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const blockColors = {
    morning: 'from-amber-50 to-orange-50 border-amber-200',
    afternoon: 'from-yellow-50 to-amber-50 border-yellow-200',
    evening: 'from-orange-50 to-rose-50 border-orange-200',
    anytime: 'from-slate-50 to-gray-50 border-slate-200',
  };

  return (
    <div 
      className={`flex-1 min-h-[100px] rounded-lg border transition-all duration-200
        ${isDragOver ? 'border-blue-400 bg-blue-50 scale-[1.02]' : `bg-gradient-to-br ${blockColors[block.id]}`}
      `}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Block header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-inherit">
        <div className="flex items-center gap-1.5 text-gray-600">
          <span className={block.id === 'morning' ? 'text-amber-500' : block.id === 'afternoon' ? 'text-yellow-600' : block.id === 'evening' ? 'text-orange-500' : 'text-gray-400'}>
            {block.icon}
          </span>
          <span className="text-xs font-medium">{block.label}</span>
          <span className="text-[10px] text-gray-400">({block.hours})</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          {tasks.length > 0 && (
            <>
              <span>{completedCount}/{tasks.length}</span>
              <span>•</span>
              <span>{totalMinutes}min</span>
            </>
          )}
        </div>
      </div>
      
      {/* Tasks */}
      <div className="p-1.5 space-y-1.5 min-h-[60px]">
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400">
            {isDragOver ? '✨ Drop here!' : 'Drop tasks here'}
          </div>
        ) : (
          tasks.map(task => {
            const project = projects.find(p => p.id === task.projectId)!;
            return (
              <TaskCard
                key={task.id}
                task={task}
                project={project}
                allTasks={allTasks}
                isSelected={selectedTaskId === task.id}
                onSelect={onSelectTask}
                onStatusChange={onStatusChange}
                onToggleSubtask={onToggleSubtask}
                onStartDrag={onStartDrag}
                onDelete={onDelete}
                onAIBreakdown={onAIBreakdown}
                onUpdateSubtasks={onUpdateSubtasks}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

// ============================================
// DAY COLUMN
// ============================================

interface DayColumnProps {
  date: string;
  tasks: Task[];
  allTasks: Task[];
  projects: Project[];
  selectedTaskId: string | null;
  isTodayColumn: boolean;
  onSelectTask: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onStartDrag: (item: DragItem) => void;
  onDrop: (taskId: string, targetDate: string, targetBlock: TimeBlock) => void;
  onDelete: (id: string) => void;
  onAIBreakdown: (task: Task) => void;
  onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  date, tasks, allTasks, projects, selectedTaskId, isTodayColumn,
  onSelectTask, onStatusChange, onToggleSubtask, onStartDrag, onDrop, onDelete,
  onAIBreakdown, onUpdateSubtasks
}) => {
  const tasksByBlock = useMemo(() => {
    const grouped: Record<TimeBlock, Task[]> = { anytime: [], morning: [], afternoon: [], evening: [] };
    tasks.forEach(task => grouped[task.timeBlock].push(task));
    return grouped;
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className={`flex-1 min-w-[300px] max-w-[400px] ${isTodayColumn ? 'order-first' : ''}`}>
      {/* Day header */}
      <div className={`rounded-t-xl p-3 ${isTodayColumn ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-white border border-gray-200 border-b-0'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${isTodayColumn ? 'text-white' : 'text-gray-800'}`}>
              {formatDisplayDate(date)}
            </h3>
            <p className={`text-xs ${isTodayColumn ? 'text-white/80' : 'text-gray-500'}`}>
              {completedTasks} of {totalTasks} tasks
            </p>
          </div>
          {isTodayColumn && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Zap size={12} /> Now
            </span>
          )}
        </div>
        
        <div className={`mt-2 h-1.5 rounded-full ${isTodayColumn ? 'bg-white/30' : 'bg-gray-100'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isTodayColumn ? 'bg-white' : 'bg-green-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Time blocks */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-xl p-2 space-y-2">
        {TIME_BLOCKS.filter(b => b.id !== 'anytime').map(block => (
          <TimeBlockColumn
            key={block.id}
            block={block}
            tasks={tasksByBlock[block.id]}
            allTasks={allTasks}
            projects={projects}
            date={date}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onStatusChange={onStatusChange}
            onToggleSubtask={onToggleSubtask}
            onStartDrag={onStartDrag}
            onDrop={onDrop}
            onDelete={onDelete}
            onAIBreakdown={onAIBreakdown}
            onUpdateSubtasks={onUpdateSubtasks}
          />
        ))}
        
        {/* Anytime section */}
        {tasksByBlock.anytime.length > 0 && (
          <div className="border-t pt-2">
            <TimeBlockColumn
              block={TIME_BLOCKS[0]}
              tasks={tasksByBlock.anytime}
              allTasks={allTasks}
              projects={projects}
              date={date}
              selectedTaskId={selectedTaskId}
              onSelectTask={onSelectTask}
              onStatusChange={onStatusChange}
              onToggleSubtask={onToggleSubtask}
              onStartDrag={onStartDrag}
              onDrop={onDrop}
              onDelete={onDelete}
              onAIBreakdown={onAIBreakdown}
              onUpdateSubtasks={onUpdateSubtasks}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// INBOX PANEL
// ============================================

interface InboxPanelProps {
  tasks: Task[];
  allTasks: Task[];
  projects: Project[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onStartDrag: (item: DragItem) => void;
  onDelete: (id: string) => void;
  onAIBreakdown: (task: Task) => void;
  onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
  onDropToInbox: (taskId: string) => void;
}

const InboxPanel: React.FC<InboxPanelProps> = ({
  tasks, allTasks, projects, selectedTaskId,
  onSelectTask, onStatusChange, onToggleSubtask, onStartDrag, onDelete,
  onAIBreakdown, onUpdateSubtasks, onDropToInbox
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div 
      className={`bg-white rounded-xl border shadow-sm transition-all duration-300 
        ${isCollapsed ? 'w-12' : 'w-72'}
        ${isDragOver ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) onDropToInbox(taskId);
      }}
    >
      <div 
        className="flex items-center justify-between p-3 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Inbox size={18} className="text-gray-600" />
            <span className="font-semibold text-gray-800">Inbox</span>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
        )}
        <button className="p-1 hover:bg-gray-100 rounded">
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
          {isDragOver && (
            <div className="text-center py-4 text-sm text-blue-500 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
              ✨ Drop to unschedule
            </div>
          )}
          {tasks.length === 0 && !isDragOver ? (
            <div className="text-center py-8 text-gray-400">
              <Inbox size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No unscheduled tasks</p>
              <p className="text-xs mt-1">Drag tasks here to unschedule</p>
            </div>
          ) : (
            tasks.map(task => {
              const project = projects.find(p => p.id === task.projectId)!;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={project}
                  allTasks={allTasks}
                  isSelected={selectedTaskId === task.id}
                  onSelect={onSelectTask}
                  onStatusChange={onStatusChange}
                  onToggleSubtask={onToggleSubtask}
                  onStartDrag={onStartDrag}
                  onDelete={onDelete}
                  onAIBreakdown={onAIBreakdown}
                  onUpdateSubtasks={onUpdateSubtasks}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// PROJECT SIDEBAR
// ============================================

interface ProjectSidebarProps {
  projects: Project[];
  tasks: Task[];
  selectedProject: string | null;
  onSelectProject: (id: string | null) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ projects, tasks, selectedProject, onSelectProject }) => {
  const projectStats = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const completed = projectTasks.filter(t => t.status === 'completed').length;
      return { ...project, total: projectTasks.length, completed };
    });
  }, [projects, tasks]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-64">
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <FolderKanban size={18} className="text-gray-600" />
          <span className="font-semibold text-gray-800">Projects</span>
        </div>
      </div>
      
      <div className="p-2 space-y-1">
        <button
          onClick={() => onSelectProject(null)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2
            ${selectedProject === null ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-50'}
          `}
        >
          <Layers size={16} />
          <span className="text-sm font-medium">All Projects</span>
          <span className="ml-auto text-xs text-gray-500">{tasks.length}</span>
        </button>
        
        {projectStats.map(project => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors
              ${selectedProject === project.id ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'}
            `}
            style={selectedProject === project.id ? { backgroundColor: project.bgColor, ringColor: project.color } : {}}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
              <span className="text-sm font-medium text-gray-700">{project.name}</span>
              <span className="ml-auto text-xs text-gray-500">{project.completed}/{project.total}</span>
            </div>
            {project.total > 0 && (
              <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(project.completed / project.total) * 100}%`, backgroundColor: project.color }}
                />
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="p-2 border-t">
        <button className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg flex items-center gap-2">
          <Plus size={16} />
          Add Project
        </button>
      </div>
    </div>
  );
};

// ============================================
// WEEK MINIMAP
// ============================================

const WeekMinimap: React.FC<{ tasks: Task[]; startDate: Date; onSelectDate: (date: string) => void }> = ({ tasks, startDate, onSelectDate }) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startDate, i - startDate.getDay());
    const dateStr = formatDate(date);
    const dayTasks = tasks.filter(t => t.date === dateStr);
    const completed = dayTasks.filter(t => t.status === 'completed').length;
    
    return {
      date: dateStr,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      tasks: dayTasks.length,
      completed,
      isToday: isToday(dateStr),
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
        <Calendar size={14} /> Week Overview
      </h4>
      <div className="flex gap-1">
        {days.map(day => (
          <button
            key={day.date}
            onClick={() => onSelectDate(day.date)}
            className={`flex-1 p-1.5 rounded-lg text-center transition-colors
              ${day.isToday ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
            `}
          >
            <div className={`text-[10px] ${day.isToday ? 'text-white/80' : 'text-gray-500'}`}>{day.day}</div>
            <div className={`text-sm font-semibold ${day.isToday ? 'text-white' : 'text-gray-700'}`}>{day.dayNum}</div>
            {day.tasks > 0 && (
              <div className={`text-[10px] ${day.isToday ? 'text-white/80' : 'text-gray-500'}`}>
                {day.completed}/{day.tasks}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// QUICK ADD MODAL
// ============================================

const QuickAddModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Partial<Task>) => void;
  projects: Project[];
}> = ({ isOpen, onClose, onAdd, projects }) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0].id);
  const [timeBlock, setTimeBlock] = useState<TimeBlock>('anytime');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [scheduleToday, setScheduleToday] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onAdd({
      title: title.trim(),
      projectId,
      date: scheduleToday ? formatDate(new Date()) : null,
      timeBlock,
      priority,
      estimatedMinutes,
      status: 'pending',
      energyLevel: timeBlock === 'morning' ? 'high' : timeBlock === 'evening' ? 'low' : 'medium',
      icon: projects.find(p => p.id === projectId)?.icon || 'target',
      subtasks: [],
      dependsOn: [],
      dependents: [],
    });
    
    setTitle('');
    setScheduleToday(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Plus size={20} className="text-blue-500" />
            Quick Add Task
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            autoFocus
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
              <select 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Time Block</label>
              <select 
                value={timeBlock} 
                onChange={e => setTimeBlock(e.target.value as TimeBlock)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {TIME_BLOCKS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Priority</label>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Duration</label>
              <select 
                value={estimatedMinutes} 
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={scheduleToday}
              onChange={e => setScheduleToday(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Schedule for today</span>
          </label>
          
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 font-medium"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================

export default function FocusFlowApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [visibleDays, setVisibleDays] = useState(3);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [aiBreakdownTask, setAiBreakdownTask] = useState<Task | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Simulated auth state

  // Initialize with sample data
  useEffect(() => {
    setTasks(createSampleTasks());
  }, []);

  // Get visible dates
  const visibleDates = useMemo(() => {
    return Array.from({ length: visibleDays }, (_, i) => formatDate(addDays(startDate, i)));
  }, [startDate, visibleDays]);

  // Filter tasks by project
  const filteredTasks = useMemo(() => {
    if (!selectedProject) return tasks;
    return tasks.filter(t => t.projectId === selectedProject);
  }, [tasks, selectedProject]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    visibleDates.forEach(date => {
      grouped[date] = filteredTasks.filter(t => t.date === date);
    });
    return grouped;
  }, [filteredTasks, visibleDates]);

  // Inbox tasks
  const inboxTasks = useMemo(() => filteredTasks.filter(t => t.date === null), [filteredTasks]);

  // Handlers
  const handleStatusChange = useCallback((taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status } : task));
  }, []);

  const handleToggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        subtasks: task.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
      };
    }));
  }, []);

  const handleDrop = useCallback((taskId: string, targetDate: string, targetBlock: TimeBlock) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return { ...task, date: targetDate, timeBlock: targetBlock };
    }));
    setDraggedItem(null);
  }, []);

  const handleDropToInbox = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return { ...task, date: null };
    }));
    setDraggedItem(null);
  }, []);

  const handleDelete = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const handleAddTask = useCallback((taskData: Partial<Task>) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: taskData.title || 'New Task',
      projectId: taskData.projectId || 'personal',
      date: taskData.date || null,
      timeBlock: taskData.timeBlock || 'anytime',
      estimatedMinutes: taskData.estimatedMinutes || 30,
      status: 'pending',
      priority: taskData.priority || 'medium',
      energyLevel: taskData.energyLevel || 'medium',
      icon: taskData.icon || 'target',
      subtasks: [],
      dependsOn: [],
      dependents: [],
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const handleUpdateSubtasks = useCallback((taskId: string, subtasks: Subtask[]) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const totalTime = subtasks.reduce((sum, st) => sum + (st.estimatedMinutes || 0), 0);
      return { 
        ...task, 
        subtasks,
        estimatedMinutes: totalTime > 0 ? totalTime : task.estimatedMinutes,
        aiGenerated: true
      };
    }));
  }, []);

  const navigateDays = (direction: number) => setStartDate(prev => addDays(prev, direction));
  const goToToday = () => setStartDate(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Target size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    FocusFlow
                  </h1>
                </div>
              </div>
              
              {/* Day navigation */}
              <div className="flex items-center gap-2">
                <button onClick={() => navigateDays(-visibleDays)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={goToToday} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium">
                  Today
                </button>
                <button onClick={() => navigateDays(visibleDays)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* View controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {[2, 3, 5].map(days => (
                  <button
                    key={days}
                    onClick={() => setVisibleDays(days)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors
                      ${visibleDays === days ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}
                    `}
                  >
                    {days}d
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setShowQuickAdd(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
              >
                <Plus size={18} />
                <span className="text-sm font-medium">Add Task</span>
              </button>

              {/* User menu */}
              <div className="flex items-center gap-2 pl-3 border-l">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Bell size={18} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Settings size={18} className="text-gray-600" />
                </button>
                <button className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  J
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1800px] mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Left sidebar */}
          <aside className="flex-shrink-0 space-y-4">
            <ProjectSidebar
              projects={PROJECTS}
              tasks={tasks}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
            />
            <WeekMinimap
              tasks={tasks}
              startDate={startDate}
              onSelectDate={(date) => setStartDate(new Date(date))}
            />
          </aside>

          {/* Inbox */}
          <InboxPanel
            tasks={inboxTasks}
            allTasks={tasks}
            projects={PROJECTS}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
            onStatusChange={handleStatusChange}
            onToggleSubtask={handleToggleSubtask}
            onStartDrag={setDraggedItem}
            onDelete={handleDelete}
            onAIBreakdown={setAiBreakdownTask}
            onUpdateSubtasks={handleUpdateSubtasks}
            onDropToInbox={handleDropToInbox}
          />

          {/* Timeline columns */}
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
            {visibleDates.map(date => (
              <DayColumn
                key={date}
                date={date}
                tasks={tasksByDate[date] || []}
                allTasks={tasks}
                projects={PROJECTS}
                selectedTaskId={selectedTaskId}
                isTodayColumn={isToday(date)}
                onSelectTask={setSelectedTaskId}
                onStatusChange={handleStatusChange}
                onToggleSubtask={handleToggleSubtask}
                onStartDrag={setDraggedItem}
                onDrop={handleDrop}
                onDelete={handleDelete}
                onAIBreakdown={setAiBreakdownTask}
                onUpdateSubtasks={handleUpdateSubtasks}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAdd={handleAddTask}
        projects={PROJECTS}
      />

      {aiBreakdownTask && (
        <AIBreakdownModal
          task={aiBreakdownTask}
          isOpen={!!aiBreakdownTask}
          onClose={() => setAiBreakdownTask(null)}
          onApply={(subtasks) => handleUpdateSubtasks(aiBreakdownTask.id, subtasks)}
        />
      )}

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg border text-xs text-gray-500 flex items-center gap-3">
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">N</kbd> New task</span>
        <span>•</span>
        <span>Drag tasks between days & time blocks</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Wand2 size={12} className="text-purple-500" /> AI breakdown</span>
      </div>
    </div>
  );
}
