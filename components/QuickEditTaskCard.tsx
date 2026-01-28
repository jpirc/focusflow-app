/**
 * QuickEditTaskCard - ADHD-friendly inline editing
 * 
 * Design Philosophy:
 * - Double-click title to edit (most common action)
 * - Click badges to change values (priority, time block, energy)
 * - Auto-save on blur (no save button)
 * - Hover shows quick actions (complete, delete)
 * - Esc to cancel, Enter to save
 * - Keep menu for advanced editing (subtasks, dependencies, AI)
 * 
 * Reduces clicks from 4+ to 1-2 for most edits
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Play, Pause, Wand2, MoreHorizontal, Edit3, Link2, Copy, Trash2,
    ChevronUp, ChevronDown, GripVertical, CheckCircle2, Circle,
    Sparkles, ArrowRight, Target, Flag, BatteryLow, BatteryMedium, BatteryFull,
    Coffee, Briefcase, Home, Heart, Dumbbell, BookOpen, RotateCcw, Clock, Star,
    Check, X, Calendar, Plus, Timer
} from 'lucide-react';
import { Task, Project, Subtask, TaskStatus, Priority, EnergyLevel, DragItem, TimeBlock } from '../types';
import { RolloverWarning } from './RolloverWarning';
import { RolloverBadge, TaskAgeBadge } from './ui/badges';
import { StartNowButton } from './ui/StartNowButton';

// BADGES & UTILS
// ============================================

const iconMap: Record<string, React.ReactNode> = {
    coffee: <Coffee size={14} />,
    briefcase: <Briefcase size={14} />,
    home: <Home size={14} />,
    heart: <Heart size={14} />,
    dumbbell: <Dumbbell size={14} />,
    book: <BookOpen size={14} />,
    target: <Target size={14} />,
};

const projectIconMap: Record<string, string> = {
    // Work & Business
    briefcase: '💼',
    laptop: '💻',
    chart: '📊',
    calendar: '📅',
    clipboard: '📋',
    phone: '📱',
    email: '📧',
    rocket: '🚀',
    // Learning & Knowledge
    book: '📚',
    graduation: '🎓',
    lightbulb: '💡',
    pencil: '✏️',
    notebook: '📓',
    microscope: '🔬',
    // Life & Health
    heart: '❤️',
    dumbbell: '💪',
    apple: '🍎',
    yoga: '🧘',
    running: '🏃',
    bicycle: '🚴',
    // Home & Family
    home: '🏠',
    family: '👨‍👩‍👧‍👦',
    baby: '👶',
    pet: '🐕',
    plant: '🌱',
    cooking: '🍳',
    // Creative & Hobbies
    art: '🎨',
    music: '🎵',
    camera: '📷',
    game: '🎮',
    guitar: '🎸',
    movie: '🎬',
    // Finance & Money
    money: '💰',
    bank: '🏦',
    'chart-up': '📈',
    piggy: '🐷',
    'credit-card': '💳',
    // Goals & Targets
    target: '🎯',
    trophy: '🏆',
    star: '⭐',
    fire: '🔥',
    gem: '💎',
    crown: '👑',
    // Travel & Adventure
    plane: '✈️',
    world: '🌍',
    beach: '🏖️',
    mountain: '⛰️',
    camping: '🏕️',
    // General & Misc
    folder: '📁',
    coffee: '☕',
    pizza: '🍕',
    gift: '🎁',
    balloon: '🎈',
    sunny: '☀️',
    moon: '🌙',
    rainbow: '🌈',
};

// Editable Priority Badge with dropdown
export const EditablePriorityBadge: React.FC<{ 
    priority: Priority; 
    onChange: (priority: Priority) => void;
    disabled?: boolean;
}> = ({ priority, onChange, disabled = false }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const styles = {
        low: { color: '#9CA3AF', label: 'Low' },
        medium: { color: '#3B82F6', label: 'Medium' },
        high: { color: '#F97316', label: 'High' },
        urgent: { color: '#EF4444', label: 'Urgent' },
    };

    const current = styles[priority];
    const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) setShowDropdown(!showDropdown);
                }}
                disabled={disabled}
                className={`w-3 h-3 rounded-full ${disabled ? 'cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-offset-1'} transition-all flex items-center justify-center`}
                style={{ backgroundColor: current.color }}
                title={disabled ? current.label : `${current.label} priority (click to change)`}
            >
                {priority === 'urgent' && <Flag size={9} className="text-white" />}
            </button>
            
            {showDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 min-w-[120px]">
                    {priorities.map((p) => {
                        const style = styles[p];
                        return (
                            <button
                                key={p}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(p);
                                    setShowDropdown(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center" style={{ backgroundColor: style.color }}>
                                    {p === 'urgent' && <Flag size={7} className="text-white" />}
                                </div>
                                {style.label}
                                {p === priority && <Check size={12} className="ml-auto text-gray-600" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Editable Time Block Badge
export const EditableTimeBlockBadge: React.FC<{ 
    timeBlock: TimeBlock; 
    onChange: (timeBlock: TimeBlock) => void;
    disabled?: boolean;
}> = ({ timeBlock, onChange, disabled = false }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const blocks = [
        { value: 'anytime' as TimeBlock, label: 'Anytime', icon: <Clock size={14} />, color: 'text-gray-500' },
        { value: 'morning' as TimeBlock, label: 'Morning', icon: <Coffee size={14} />, color: 'text-amber-500' },
        { value: 'afternoon' as TimeBlock, label: 'Afternoon', icon: <Briefcase size={14} />, color: 'text-blue-500' },
        { value: 'evening' as TimeBlock, label: 'Evening', icon: <Home size={14} />, color: 'text-indigo-500' },
    ];

    const current = blocks.find(b => b.value === timeBlock) || blocks[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) setShowDropdown(!showDropdown);
                }}
                disabled={disabled}
                className={`${current.color} ${disabled ? 'cursor-default' : 'cursor-pointer hover:opacity-70'} transition-opacity`}
                title={disabled ? current.label : `${current.label} (click to change)`}
            >
                {current.icon}
            </button>
            
            {showDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1">
                    {blocks.map((block) => (
                        <button
                            key={block.value}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(block.value);
                                setShowDropdown(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                        >
                            {block.icon}
                            {block.label}
                            {block.value === timeBlock && <Check size={12} className="ml-auto" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Editable Energy Badge
export const EditableEnergyBadge: React.FC<{ 
    level: EnergyLevel; 
    onChange: (level: EnergyLevel) => void;
    disabled?: boolean;
}> = ({ level, onChange, disabled = false }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const levels = [
        { value: 'low' as EnergyLevel, icon: <BatteryLow size={15} />, color: 'text-slate-500', label: 'Low' },
        { value: 'medium' as EnergyLevel, icon: <BatteryMedium size={15} />, color: 'text-amber-500', label: 'Medium' },
        { value: 'high' as EnergyLevel, icon: <BatteryFull size={15} />, color: 'text-green-500', label: 'High' },
    ];

    const current = levels.find(l => l.value === level) || levels[1];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) setShowDropdown(!showDropdown);
                }}
                disabled={disabled}
                className={`${current.color} ${disabled ? 'cursor-default' : 'cursor-pointer hover:opacity-70'} transition-opacity`}
                title={disabled ? `${current.label} energy` : "Click to change energy level"}
            >
                {current.icon}
            </button>
            
            {showDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1">
                    {levels.map((lvl) => (
                        <button
                            key={lvl.value}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(lvl.value);
                                setShowDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-2`}
                        >
                            <span className={lvl.color}>{lvl.icon}</span>
                            {lvl.label}
                            {lvl.value === level && <Check size={12} className="ml-auto text-gray-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


// Editable Time Estimate Badge
export const EditableTimeBadge: React.FC<{ 
    estimatedMinutes: number | null; 
    onChange: (minutes: number | null) => void;
    disabled?: boolean;
}> = ({ estimatedMinutes, onChange, disabled = false }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [customValue, setCustomValue] = useState(estimatedMinutes?.toString() || '');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const presets = [15, 30, 45, 60, 90, 120];

    const handleCustomSubmit = () => {
        const num = parseInt(customValue);
        if (!isNaN(num) && num > 0) {
            onChange(num);
            setShowDropdown(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) {
                        setShowDropdown(!showDropdown);
                        setCustomValue(estimatedMinutes?.toString() || '');
                    }
                }}
                disabled={disabled}
                className={`flex items-center gap-0.5 text-gray-500 text-xs ${disabled ? 'cursor-default' : 'cursor-pointer hover:text-gray-700 hover:bg-gray-100'} px-1 py-0.5 rounded transition-colors`}
                title={disabled ? `${estimatedMinutes || '?'} minutes` : "Click to set time estimate"}
            >
                <Clock size={12} />
                <span className="font-medium">{estimatedMinutes || '?'}</span>
            </button>
            
            {showDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 min-w-[120px]">
                    <div className="px-2 py-1 text-[9px] text-gray-500 uppercase tracking-wide">Quick</div>
                    {presets.map((minutes) => (
                        <button
                            key={minutes}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(minutes);
                                setShowDropdown(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center justify-between"
                        >
                            {minutes}m
                            {minutes === estimatedMinutes && <Check size={12} className="text-gray-600" />}
                        </button>
                    ))}
                    <div className="border-t border-gray-200 my-1" />
                    <div className="px-3 py-1.5">
                        <input
                            type="number"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') handleCustomSubmit();
                            }}
                            placeholder="Custom"
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                            min="1"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                            setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 text-gray-600"
                    >
                        Clear estimate
                    </button>
                </div>
            )}
        </div>
    );
};

// Editable Project Badge  
export const EditableProjectBadge: React.FC<{ 
    project: Project;
    allProjects: Project[];
    onChange: (projectId: string) => void;
    disabled?: boolean;
}> = ({ project, allProjects, onChange, disabled = false }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    // Show compact dot with tooltip for projects
    if (project.id === 'default') {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) setShowDropdown(!showDropdown);
                    }}
                    disabled={disabled}
                    className={`w-5 h-5 rounded border border-dashed border-gray-300 flex items-center justify-center ${disabled ? 'cursor-default' : 'cursor-pointer hover:border-gray-400 hover:bg-gray-50'} transition-all text-[10px]`}
                    title={disabled ? 'No project' : 'Click to assign project'}
                >
                    +
                </button>
                {showDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 max-h-60 overflow-y-auto min-w-[150px]">
                        {allProjects.filter(p => p.id !== 'default').map((proj) => (
                            <button
                                key={proj.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(proj.id);
                                    setShowDropdown(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs" style={{ backgroundColor: proj.color }}>
                                    {projectIconMap[proj.icon] || '📁'}
                                </div>
                                <span className="flex-1 truncate">{proj.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) setShowDropdown(!showDropdown);
                }}
                disabled={disabled}
                className={`w-5 h-5 rounded flex items-center justify-center text-xs ${disabled ? 'cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-offset-1'} transition-all`}
                style={{ backgroundColor: project.color }}
                title={disabled ? project.name : `${project.name} (click to change)`}
            >
                {projectIconMap[project.icon] || '📁'}
            </button>
            
            {showDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 max-h-60 overflow-y-auto min-w-[150px]">
                    {allProjects.map((proj) => (
                        <button
                            key={proj.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(proj.id);
                                setShowDropdown(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs" style={{ backgroundColor: proj.color }}>
                                {projectIconMap[proj.icon] || '📁'}
                            </div>
                            <span className="flex-1 truncate">{proj.name}</span>
                            {proj.id === project.id && <Check size={12} className="text-gray-600 flex-shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


// Dependency Badge - Shows if task is blocked, linked, or blocking others
export const DependencyBadge: React.FC<{ 
    task: Task; 
    allTasks: Task[];
    onClick?: () => void;
}> = ({ task, allTasks, onClick }) => {
    // Check if task has incomplete dependencies (blocked)
    const dependencyTasks = (task.dependencies || []).map(dep => dep.dependsOn).filter(Boolean);
    const blockingDeps = dependencyTasks.filter(dep => 
        dep.status !== 'completed' && dep.status !== 'skipped'
    );
    const isTaskBlocked = blockingDeps.length > 0;
    
    // Check if other tasks depend on this one
    const dependentTasks = allTasks.filter(t => 
        t.dependencies?.some(dep => dep.dependsOnId === task.id)
    );
    const hasDependents = dependentTasks.length > 0;
    
    // Don't show badge if no dependencies at all
    if (dependencyTasks.length === 0 && !hasDependents) return null;
    
    // Determine badge state
    const isLinked = dependencyTasks.length > 0 && !isTaskBlocked;
    const isBlocking = hasDependents;
    
    // Visual configs
    const config = isTaskBlocked 
        ? { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: '🔒', label: 'Blocked' }
        : isBlocking && isLinked
        ? { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', icon: '⛓️', label: 'Linked' }
        : isBlocking
        ? { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', icon: '⛓️', label: 'Blocking' }
        : { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', icon: '🔗', label: 'Linked' };
    
    const tooltip = isTaskBlocked
        ? `Blocked by ${blockingDeps.length} task(s)`
        : isBlocking && isLinked
        ? `${dependentTasks.length} task(s) waiting • ${dependencyTasks.length} completed`
        : isBlocking
        ? `${dependentTasks.length} task(s) waiting on this`
        : `${dependencyTasks.length} dependency completed`;
    
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${config.bg} ${config.text} ${config.border} flex items-center gap-0.5 ${onClick ? 'hover:opacity-80 cursor-pointer' : ''}`}
            title={tooltip}
        >
            <span>{config.icon}</span>
            {isTaskBlocked && blockingDeps.length}
            {isBlocking && !isTaskBlocked && dependentTasks.length}
        </button>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

interface QuickEditTaskCardProps {
    task: Task;
    project: Project;
    allTasks: Task[];
    allProjects: Project[];
    isSelected: boolean;
    isHighlighted?: boolean; // Cross-panel highlighting
    onSelect: (id: string) => void;
    onHover?: (id: string | null) => void; // Cross-panel hover
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onPause: (id: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onStartDrag: (item: DragItem) => void;
    onDelete: (id: string) => void;
    onAIBreakdown: (task: Task) => void;
    onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
    onEdit: (task: Task) => void; // Opens full modal for advanced editing
    onStartPomodoro?: (task: Task) => void; // Start Pomodoro timer
    onUnschedule?: (taskId: string) => void; // Remove from timeline
    onStartNow?: (taskId: string) => Promise<void>; // ADHD-friendly one-click start
    compact?: boolean;
    subtasksExpandedAll?: boolean;
    timelineHeight?: number; // Explicit height for timeline view (in pixels)
}

// Helper to lighten a hex color for backgrounds
function lightenColor(hex: string, amount: number = 0.85): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.round((num >> 16) + (255 - (num >> 16)) * amount);
    const g = Math.round(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount);
    const b = Math.round((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount);
    return `rgb(${r}, ${g}, ${b})`;
}

const QuickEditTaskCardComponent: React.FC<QuickEditTaskCardProps> = (props) => {
    const { task, project, allTasks, allProjects, isSelected, isHighlighted = false, onSelect, onHover, onUpdate, onStatusChange, onPause,
        onToggleSubtask, onStartDrag, onDelete, onAIBreakdown, onEdit, onStartPomodoro, onUnschedule, onStartNow, compact = false, subtasksExpandedAll = true, timelineHeight } = props;

    const [expanded, setExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
    const [elapsedMinutes, setElapsedMinutes] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);
    
    // Inline editing state
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [showTimePrompt, setShowTimePrompt] = useState(false);
    const [loggedMinutes, setLoggedMinutes] = useState('');

    // Dependency blocking logic
    const dependencyTasks = (task.dependencies || []).map(dep => dep.dependsOn).filter(Boolean);
    const blockingDependencies = dependencyTasks.filter(dep => dep.status !== 'completed' && dep.status !== 'skipped');
    const isBlocked = blockingDependencies.length > 0 && task.status !== 'completed';
    
    const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
    const totalSubtasks = (task.subtasks || []).length;
    const hasSubtasks = totalSubtasks > 0;
    const [subtasksExpanded, setSubtasksExpanded] = useState(false);
    const prevGlobalState = useRef<boolean | null>(null);

    // Only sync with global state when it actually changes (button clicked), not on mount
    useEffect(() => {
        if (prevGlobalState.current !== null && prevGlobalState.current !== subtasksExpandedAll) {
            setSubtasksExpanded(subtasksExpandedAll);
        }
        prevGlobalState.current = subtasksExpandedAll;
    }, [subtasksExpandedAll]);

    // Timer for in-progress tasks
    useEffect(() => {
        if (task.status === 'in-progress' && task.startedAt) {
            const updateElapsed = () => {
                const started = new Date(task.startedAt!).getTime();
                const elapsed = Math.floor((Date.now() - started) / 60000);
                setElapsedMinutes(elapsed);
            };
            updateElapsed();
            const interval = setInterval(updateElapsed, 60000);
            return () => clearInterval(interval);
        } else {
            setElapsedMinutes(0);
        }
    }, [task.status, task.startedAt]);

    useEffect(() => {
        if (showMenu && menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            setMenuStyle({ top: rect.bottom + 6, left: rect.right - 180 });
        } else {
            setMenuStyle(null);
        }
    }, [showMenu]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleTitleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (task.status !== 'completed' && !isBlocked) {
            setIsEditingTitle(true);
        }
    };

    const handleTitleSave = () => {
        const trimmed = editedTitle.trim();
        if (trimmed && trimmed !== task.title) {
            onUpdate(task.id, { title: trimmed });
        } else {
            setEditedTitle(task.title); // Reset if empty or unchanged
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTitleSave();
        } else if (e.key === 'Escape') {
            setEditedTitle(task.title);
            setIsEditingTitle(false);
        }
    };

    const handlePriorityChange = (priority: Priority) => {
        onUpdate(task.id, { priority });
    };

    const handleTimeBlockChange = (timeBlock: TimeBlock) => {
        onUpdate(task.id, { timeBlock });
    };

    const handleEnergyChange = (energyLevel: EnergyLevel) => {
        onUpdate(task.id, { energyLevel });
    };

    const handleTimeChange = (estimatedMinutes: number | null) => {
        onUpdate(task.id, { estimatedMinutes: estimatedMinutes ?? undefined });
    };

    const handleProjectChange = (projectId: string) => {
        onUpdate(task.id, { projectId });
    };

    const onMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(v => !v);
    };

    const showPriorityDot = task.priority === 'urgent' || task.priority === 'high';
    const priorityColor = task.priority === 'urgent' ? 'bg-red-500' : 'bg-orange-400';

    const hasTooltipContent = task.description || project.name || task.estimatedMinutes;

    const getTimeStatus = () => {
        if (task.status !== 'in-progress' || !task.estimatedMinutes || elapsedMinutes === 0) {
            return { level: 'normal', color: 'text-blue-500', bgColor: 'bg-blue-50', pulse: false };
        }
        const percentage = (elapsedMinutes / task.estimatedMinutes) * 100;
        if (percentage < 100) {
            return { level: 'normal', color: 'text-blue-500', bgColor: 'bg-blue-50', pulse: false };
        } else if (percentage < 150) {
            return { level: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50', pulse: false };
        } else if (percentage < 200) {
            return { level: 'overrun', color: 'text-orange-600', bgColor: 'bg-orange-50', pulse: true };
        } else {
            return { level: 'critical', color: 'text-red-600', bgColor: 'bg-red-50', pulse: true };
        }
    };
    const timeStatus = getTimeStatus();

    const isCompleted = task.status === 'completed';
    const isPaused = task.status === 'pending' && (task.actualMinutes || 0) > 0;

    // Determine layout mode
    // If timelineHeight is set, we're in timeline/calendar view → use minimal layout
    // If no timelineHeight, we're in time blocks view → use full detailed layout
    const isTimelineView = !!timelineHeight;

    return (
        <div
            draggable={!isEditingTitle}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.setData('taskId', task.id);
                e.dataTransfer.setData('task-order', String(task.order || 0));
                const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                dragImage.style.position = 'absolute';
                dragImage.style.top = '-1000px';
                dragImage.style.opacity = '0.9';
                dragImage.style.transform = 'rotate(2deg)';
                dragImage.style.maxWidth = '250px';
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, 20, 20);
                setTimeout(() => document.body.removeChild(dragImage), 0);
                setIsDragging(true);
                onStartDrag({ taskId: task.id, sourceDate: task.date, sourceTimeBlock: task.timeBlock });
            }}
            onDragOver={(e) => {
                e.preventDefault(); // Required for drop to work
                e.dataTransfer.dropEffect = 'move';
                // Set window global here so TimeBlockColumn can read it in onDrop
                // This fires continuously while dragging over, ensuring it's set
                if (!isDragging) { // Don't set when dragging this same task
                    setIsDragOver(true);
                    (window as any).__dropBeforeTaskId = task.id;
                }
            }}
            onDragLeave={(e) => {
                // Only clear if actually leaving (not going into a child)
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!e.currentTarget.contains(relatedTarget)) {
                    setIsDragOver(false);
                    // Clear the window global when leaving
                    delete (window as any).__dropBeforeTaskId;
                }
            }}
            onDrop={(e) => {
                e.preventDefault();
                // Let event bubble to TimeBlockColumn - it will read window.__dropBeforeTaskId
                setIsDragOver(false);
            }}
            onDragEnd={() => setIsDragging(false)}
            onClick={() => !isEditingTitle && onSelect(task.id)}
            onMouseEnter={() => onHover?.(task.id)}
            onMouseLeave={() => onHover?.(null)}
            className={[
                'group relative border-l-4 transition-all duration-150 bg-white shadow-md border border-gray-200',
                isEditingTitle ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                isSelected ? 'ring-2 ring-purple-400 ring-offset-1 bg-purple-50/50' : isHighlighted ? 'ring-2 ring-purple-300 bg-purple-50/30' : 'hover:shadow-lg',
                isCompleted ? 'opacity-50' : '',
                task.status === 'in-progress' ? 'ring-4 ring-blue-400 ring-offset-2 shadow-2xl shadow-blue-500/50 animate-pulse' : '',
                isPaused ? 'ring-2 ring-amber-300 ring-offset-1 bg-amber-50/30' : '',
                isBlocked ? 'opacity-60 bg-red-50/30 ring-2 ring-red-200' : '',
                isDragging ? 'opacity-50 scale-95' : '',
                isDragOver ? 'border-t-2 border-t-purple-500' : '',
            ].filter(Boolean).join(' ')}
            style={{ 
                borderLeftColor: project.color,
                borderLeftWidth: '4px',
                // In timeline view, use lighter project color background (like Sunsama)
                // When compact (overlapping tasks), use OPAQUE white background to prevent see-through
                backgroundColor: timelineHeight 
                    ? (compact && project.id !== 'default' 
                        ? lightenColor(project.color, 0.94) // Opaque light color for overlapping tasks
                        : project.id !== 'default'
                            ? `${project.color}15` // Semi-transparent for single column
                            : 'white')
                    : (isSelected ? undefined : (project.id !== 'default' ? lightenColor(project.color, 0.97) : undefined)),
                ...(timelineHeight ? {
                    height: `${timelineHeight}px`,
                    minHeight: `${timelineHeight}px`,
                    maxHeight: `${timelineHeight}px`,
                    overflow: 'hidden'
                } : {})
            }}
        >
            {/* Hover tooltip */}
            {hasTooltipContent && !compact && !isEditingTitle && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-0 group-hover:delay-[2000ms] pointer-events-none">
                    <div className="bg-gray-900 text-white text-[10px] shadow-lg p-2 max-w-[200px]">
                        {task.description && (
                            <p className="text-gray-200 leading-snug mb-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-gray-400">
                            {project.name && project.id !== 'default' && (
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.color }}></span>
                                    {project.name}
                                </span>
                            )}
                            {task.estimatedMinutes && (
                                <span>{task.estimatedMinutes}m</span>
                            )}
                            {task.energyLevel && (
                                <span className="capitalize">{task.energyLevel} energy</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TIMELINE VIEW - Compact single-line layout */}
            {isTimelineView && (
                <div className="px-1.5 h-full flex items-center overflow-hidden">
                    <div className="flex items-center gap-1 w-full min-w-0 text-[9px]">
                        <Clock size={9} className="text-gray-500 flex-shrink-0" />
                        <span className="text-gray-600 font-semibold flex-shrink-0 whitespace-nowrap">
                            {(() => {
                                const startHour = task.scheduledHour ?? 0;
                                const startMin = task.scheduledMinute ?? 0;
                                const duration = task.estimatedMinutes || 30;
                                const endTotalMin = startHour * 60 + startMin + duration;
                                const endHour = Math.floor(endTotalMin / 60) % 24;
                                const endMin = endTotalMin % 60;
                                
                                const formatTime = (h: number, m: number) => {
                                    const hr = h % 12 || 12;
                                    return `${hr}:${String(m).padStart(2, '0')}`;
                                };
                                const ampm = (h: number) => h >= 12 ? 'P' : 'A';
                                
                                return `${formatTime(startHour, startMin)}-${formatTime(endHour, endMin)}${ampm(endHour)}`;
                            })()}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className={`font-medium truncate ${
                            isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                            {task.title}
                        </span>
                    </div>
                </div>
            )}

            {/* TIME BLOCK VIEW - Full detailed cards */}
            {!isTimelineView && (
            <div className="p-1 space-y-0.5">
                {/* Header row - Action Buttons + Title + Menu */}
                <div className={`flex items-start ${compact ? 'gap-1' : 'gap-2'}`}>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {isBlocked ? (
                            <div className={`relative ${compact ? 'w-6 h-6' : 'w-8 h-8'} flex items-center justify-center`}>
                                <Circle size={compact ? 14 : 18} className="text-red-400" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px]">🔒</span>
                                </div>
                            </div>
                        ) : task.status === 'completed' ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(task.id, 'pending');
                                }}
                                className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors`}
                                title="Mark incomplete"
                            >
                                <CheckCircle2 size={compact ? 16 : 20} className="fill-current" />
                            </button>
                        ) : (
                            <>
                                {/* Start/Pause button */}
                                {task.status === 'in-progress' ? (
                                    /* Pause button for in-progress tasks */
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPause(task.id);
                                        }}
                                        className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors`}
                                        title="Pause"
                                    >
                                        <Pause size={compact ? 14 : 18} />
                                    </button>
                                ) : onStartNow ? (
                                    /* Start Now button - available for ALL tasks (unscheduled and scheduled) */
                                    <StartNowButton
                                        onStartNow={() => onStartNow(task.id)}
                                        size={compact ? 'xs' : 'sm'}
                                        showLabel={!compact}
                                    />
                                ) : (
                                    /* Fallback: Simple start button */
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(task.id, 'in-progress');
                                        }}
                                        className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors`}
                                        title="Start task"
                                    >
                                        <Play size={compact ? 14 : 18} />
                                    </button>
                                )}

                                {/* Pomodoro Timer button - show for non-in-progress tasks */}
                                {onStartPomodoro && task.status !== 'in-progress' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStartPomodoro(task);
                                        }}
                                        className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors`}
                                        title="Start Pomodoro timer"
                                    >
                                        <Timer size={compact ? 14 : 18} />
                                    </button>
                                )}
                                
                                {/* Complete button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!task.estimatedMinutes && !task.actualMinutes) {
                                            setShowTimePrompt(true);
                                        }
                                        onStatusChange(task.id, 'completed');
                                    }}
                                    className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} flex items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors`}
                                    title="Mark complete"
                                >
                                    <CheckCircle2 size={compact ? 16 : 20} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Title - double-click to edit */}
                    <div className="flex-1 min-w-0">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                    ref={titleInputRef}
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    onBlur={handleTitleSave}
                                    onKeyDown={handleTitleKeyDown}
                                    className="flex-1 text-sm font-medium text-gray-900 bg-white border border-blue-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Task title..."
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTitleSave();
                                    }}
                                    className="text-green-600 hover:text-green-700"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditedTitle(task.title);
                                        setIsEditingTitle(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div
                                onDoubleClick={handleTitleDoubleClick}
                                className="relative"
                            >
                                <p className={`${compact ? 'text-[11px]' : 'text-sm'} font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'} ${isCompleted ? '' : 'cursor-text'}`}>
                                    {showPriorityDot && <span className={`inline-block w-1.5 h-1.5 rounded-full ${priorityColor} mr-1.5 align-middle`}></span>}
                                    {task.isTopPriority && <Star size={14} className="inline mr-1 text-amber-500 fill-amber-500" />}
                                    {task.title}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick actions - show on hover */}
                    {!compact && !isCompleted && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this task?')) {
                                    onDelete(task.id);
                                }
                            }}
                            className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete task"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button
                            ref={menuButtonRef}
                            onClick={onMenuToggle}
                            className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                            title="More actions"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    </div>
                    )}
                </div>

                {/* Time logging prompt - shown after completing without estimate */}
                {showTimePrompt && task.status === 'completed' && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200">
                        <span className="text-xs text-blue-900 flex-shrink-0">How long did it take?</span>
                        <input
                            type="number"
                            value={loggedMinutes}
                            onChange={(e) => setLoggedMinutes(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && loggedMinutes) {
                                    onUpdate(task.id, { actualMinutes: parseInt(loggedMinutes) });
                                    setShowTimePrompt(false);
                                    setLoggedMinutes('');
                                } else if (e.key === 'Escape') {
                                    setShowTimePrompt(false);
                                    setLoggedMinutes('');
                                }
                            }}
                            placeholder="mins"
                            className="w-16 px-2 py-1 text-xs border border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                        <button
                            onClick={() => {
                                if (loggedMinutes) {
                                    onUpdate(task.id, { actualMinutes: parseInt(loggedMinutes) });
                                }
                                setShowTimePrompt(false);
                                setLoggedMinutes('');
                            }}
                            className="p-1 text-blue-600 hover:text-blue-700"
                            title="Save"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={() => {
                                setShowTimePrompt(false);
                                setLoggedMinutes('');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Skip"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Metadata row - Editable badges */}
                <div className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1.5'} flex-wrap ${compact ? 'text-[9px]' : 'text-xs'} text-gray-600`}>
                    <EditableProjectBadge
                        project={project}
                        allProjects={allProjects}
                        onChange={handleProjectChange}
                        disabled={isCompleted}
                    />
                    <EditablePriorityBadge
                        priority={task.priority}
                        onChange={handlePriorityChange}
                        disabled={isCompleted || isBlocked}
                    />
                    <EditableEnergyBadge
                        level={task.energyLevel || 'medium'}
                        onChange={handleEnergyChange}
                        disabled={isCompleted || isBlocked}
                    />
                    <EditableTimeBlockBadge
                        timeBlock={task.timeBlock}
                        onChange={handleTimeBlockChange}
                        disabled={isCompleted || isBlocked}
                    />
                    {/* Scheduled Time Badge */}
                    {task.scheduledHour !== null && task.scheduledHour !== undefined && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-700 text-[10px] font-medium">
                            <Clock size={10} />
                            <span>
                                {task.scheduledHour % 12 || 12}:{String(task.scheduledMinute || 0).padStart(2, '0')}{task.scheduledHour >= 12 ? 'PM' : 'AM'}
                            </span>
                            {onUnschedule && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUnschedule(task.id);
                                    }}
                                    className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                    title="Remove from timeline"
                                >
                                    <X size={8} />
                                </button>
                            )}
                        </div>
                    )}
                    {task.rolloverCount && task.rolloverCount >= 3 ? (
                        <RolloverWarning
                            rolloverCount={task.rolloverCount}
                            onBreakdown={() => onEdit(task)}
                            onArchive={() => onStatusChange(task.id, 'skipped')}
                        />
                    ) : (
                        <RolloverBadge count={task.rolloverCount || 0} />
                    )}
                    <TaskAgeBadge createdAt={task.createdAt} />
                    <DependencyBadge 
                        task={task} 
                        allTasks={allTasks}
                        onClick={() => onEdit(task)}
                    />
                    {isPaused && (
                        <span className="flex items-center gap-0 text-amber-700 bg-amber-100 border border-amber-300 px-1 py-0.5 rounded" title={`Paused - ${task.actualMinutes}m tracked`}>
                            <Pause size={10} />
                        </span>
                    )}
                    <EditableTimeBadge
                        estimatedMinutes={task.estimatedMinutes}
                        onChange={handleTimeChange}
                        disabled={isCompleted}
                    />
                </div>

                {/* Blocking dependencies warning */}
                {isBlocked && !compact && (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded px-2 py-1.5 text-xs">
                        <span className="text-base">🔒</span>
                        <div className="flex-1">
                            <span className="font-medium text-red-900">Blocked by:</span>
                            <div className="text-red-700 mt-0.5 space-y-0.5">
                                {blockingDependencies.slice(0, 2).map((dep, i) => (
                                    <div key={i} className="truncate">• {dep.title}</div>
                                ))}
                                {blockingDependencies.length > 2 && (
                                    <div className="text-red-600">+{blockingDependencies.length - 2} more</div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(task);
                            }}
                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                            View
                        </button>
                    </div>
                )}

                {/* In-progress timer */}
                {task.status === 'in-progress' && elapsedMinutes > 0 && !compact && (
                    <div className={`flex items-center gap-1 text-[10px] ${timeStatus.color} ${timeStatus.bgColor} px-1.5 py-0.5 rounded ${timeStatus.pulse ? 'animate-pulse' : ''}`}>
                        <Play size={10} />
                        <span className="font-medium">{elapsedMinutes}</span>
                        {task.estimatedMinutes && (
                            <span className="opacity-60">/{task.estimatedMinutes}</span>
                        )}
                    </div>
                )}

                {/* Subtasks - Visual & ADHD-Friendly - Collapsible with next action always visible */}
                {hasSubtasks && !compact && (
                    <div className="mt-2 space-y-1">
                        {/* Progress header - clickable */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSubtasksExpanded(!subtasksExpanded);
                            }}
                            className="w-full flex items-center justify-between text-[10px] hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
                        >
                            <span className="text-gray-500 font-medium flex items-center gap-1">
                                <CheckCircle2 size={10} />
                                {completedSubtasks}/{totalSubtasks} steps
                            </span>
                            <div className="flex items-center gap-2 flex-1 ml-2">
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                                        style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                                    />
                                </div>
                                <span className="text-gray-400 text-[9px]">
                                    {subtasksExpanded ? '▼' : '▶'}
                                </span>
                            </div>
                        </button>

                        {/* Next action - Always visible */}
                        {(() => {
                            const nextSubtask = task.subtasks?.find(s => !s.completed);
                            const nextIndex = task.subtasks?.findIndex(s => s.id === nextSubtask?.id);
                            if (!nextSubtask) return null;
                            
                            return (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSubtask(task.id, nextSubtask.id);
                                    }}
                                    className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all text-left bg-gradient-to-r from-purple-50 to-blue-50 border-l-2 border-purple-400 text-gray-800 font-medium hover:from-purple-100 hover:to-blue-100"
                                >
                                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center">
                                        {(nextIndex ?? 0) + 1}
                                    </span>
                                    <span className="flex-1 leading-tight">
                                        {nextSubtask.title}
                                    </span>
                                    {nextSubtask.estimatedMinutes && (
                                        <span className="text-[10px] flex-shrink-0 px-1 rounded text-purple-600 bg-purple-100 font-medium">
                                            {nextSubtask.estimatedMinutes}m
                                        </span>
                                    )}
                                </button>
                            );
                        })()}

                        {/* Remaining subtasks - Only when expanded */}
                        {subtasksExpanded && task.subtasks && task.subtasks.length > 1 && (
                            <div className="space-y-0.5">
                            {task.subtasks?.map((subtask, idx) => {
                                const isNext = !subtask.completed && task.subtasks?.slice(0, idx).every(s => s.completed);
                                // Skip next action (already shown above)
                                if (isNext) return null;
                                
                                return (
                                    <button
                                        key={subtask.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleSubtask(task.id, subtask.id);
                                        }}
                                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all text-left ${
                                            subtask.completed
                                                ? 'bg-green-50/50 text-green-700 opacity-60'
                                                : 'bg-gray-50/50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <span className={`flex-shrink-0 w-4 h-4 rounded-full text-[9px] font-semibold flex items-center justify-center ${
                                            subtask.completed 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-gray-300 text-gray-600'
                                        }`}>
                                            {subtask.completed ? '✓' : idx + 1}
                                        </span>
                                        <span className={`flex-1 leading-tight ${subtask.completed ? 'line-through' : ''}`}>
                                            {subtask.title}
                                        </span>
                                        {subtask.estimatedMinutes && (
                                            <span className="text-[10px] flex-shrink-0 px-1 text-gray-500">
                                                {subtask.estimatedMinutes}m
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                            </div>
                        )}
                    </div>
                )}
            </div>
            )}

            {/* Context menu portal */}
            {showMenu && menuStyle && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: `${menuStyle.top}px`,
                        left: `${menuStyle.left}px`,
                        zIndex: 9999,
                    }}
                    className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-44 text-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            setShowMenu(false);
                            onEdit(task);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-900"
                    >
                        <Edit3 size={14} />
                        Full Edit
                    </button>
                    <button
                        onClick={() => {
                            setShowMenu(false);
                            onAIBreakdown(task);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center gap-2 text-purple-600"
                    >
                        <Wand2 size={14} />
                        AI Breakdown
                    </button>
                    <button
                        onClick={() => {
                            setShowMenu(false);
                            navigator.clipboard.writeText(task.title);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-900"
                    >
                        <Copy size={14} />
                        Copy Title
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                        onClick={() => {
                            setShowMenu(false);
                            if (confirm('Delete this task?')) {
                                onDelete(task.id);
                            }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

// Memoize to prevent re-renders when props haven't changed
export const QuickEditTaskCard = React.memo(
    QuickEditTaskCardComponent,
    (prevProps, nextProps) => {
        // Only re-render if these key props actually changed
        return (
            prevProps.task === nextProps.task &&
            prevProps.project.id === nextProps.project.id &&
            prevProps.isSelected === nextProps.isSelected &&
            prevProps.isHighlighted === nextProps.isHighlighted &&
            prevProps.compact === nextProps.compact &&
            prevProps.subtasksExpandedAll === nextProps.subtasksExpandedAll &&
            prevProps.timelineHeight === nextProps.timelineHeight
        );
    }
);
