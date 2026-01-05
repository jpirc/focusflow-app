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
    Check, X, Calendar
} from 'lucide-react';
import { Task, Project, Subtask, TaskStatus, Priority, EnergyLevel, DragItem, TimeBlock } from '../types';
import { RolloverWarning } from './RolloverWarning';

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
        low: { bg: 'bg-slate-100', text: 'text-slate-600', hover: 'hover:bg-slate-200' },
        medium: { bg: 'bg-blue-100', text: 'text-blue-700', hover: 'hover:bg-blue-200' },
        high: { bg: 'bg-orange-100', text: 'text-orange-700', hover: 'hover:bg-orange-200' },
        urgent: { bg: 'bg-red-100', text: 'text-red-700', hover: 'hover:bg-red-200' },
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
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${current.bg} ${current.text} ${disabled ? 'cursor-default' : 'cursor-pointer ' + current.hover} transition-colors`}
                title={disabled ? undefined : "Click to change priority"}
            >
                {priority === 'urgent' && <Flag size={10} className="inline mr-0.5" />}
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
            
            {showDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1">
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
                                className={`w-full text-left px-3 py-1.5 text-xs ${style.text} ${style.hover} flex items-center gap-1`}
                            >
                                {p === 'urgent' && <Flag size={12} />}
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                                {p === priority && <Check size={12} className="ml-auto" />}
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
        { value: 'anytime' as TimeBlock, label: 'Anytime', icon: <Clock size={12} /> },
        { value: 'morning' as TimeBlock, label: 'Morning', icon: <Coffee size={12} /> },
        { value: 'afternoon' as TimeBlock, label: 'Afternoon', icon: <Briefcase size={12} /> },
        { value: 'evening' as TimeBlock, label: 'Evening', icon: <Home size={12} /> },
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
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 ${disabled ? 'cursor-default' : 'cursor-pointer hover:bg-purple-200'} transition-colors flex items-center gap-1`}
                title={disabled ? undefined : "Click to change time block"}
            >
                {current.icon}
                {current.label}
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
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center gap-2"
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
        { value: 'low' as EnergyLevel, icon: <BatteryLow size={12} />, color: 'text-slate-500', label: 'Low' },
        { value: 'medium' as EnergyLevel, icon: <BatteryMedium size={12} />, color: 'text-amber-500', label: 'Medium' },
        { value: 'high' as EnergyLevel, icon: <BatteryFull size={12} />, color: 'text-green-500', label: 'High' },
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
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center gap-2 ${lvl.color}`}
                        >
                            {lvl.icon}
                            {lvl.label}
                            {lvl.value === level && <Check size={12} className="ml-auto text-gray-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const RolloverBadge: React.FC<{ count: number }> = ({ count }) => {
    if (count === 0) return null;
    
    const config = {
        low: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
        medium: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
        high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    };
    
    const level = count <= 2 ? 'low' : count <= 4 ? 'medium' : 'high';
    const style = config[level];
    
    return (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${style.bg} ${style.text} ${style.border} flex items-center gap-0.5`} title={`Rolled over ${count} time${count > 1 ? 's' : ''}`}>
            <RotateCcw size={10} />
            {count}
        </span>
    );
};

export const TaskAgeBadge: React.FC<{ createdAt: string }> = ({ createdAt }) => {
    const daysOld = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOld < 3) return null;
    
    const config = {
        aging: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
        stale: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
        stuck: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    };
    
    const level = daysOld < 7 ? 'aging' : daysOld < 14 ? 'stale' : 'stuck';
    const style = config[level];
    
    return (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${style.bg} ${style.text} ${style.border} flex items-center gap-0.5`} title={`Created ${daysOld} days ago`}>
            <Clock size={10} />
            {daysOld}d
        </span>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

interface QuickEditTaskCardProps {
    task: Task;
    project: Project;
    allTasks: Task[];
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onPause: (id: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onStartDrag: (item: DragItem) => void;
    onDelete: (id: string) => void;
    onAIBreakdown: (task: Task) => void;
    onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
    onEdit: (task: Task) => void; // Opens full modal for advanced editing
    compact?: boolean;
}

// Helper to lighten a hex color for backgrounds
function lightenColor(hex: string, amount: number = 0.85): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.round((num >> 16) + (255 - (num >> 16)) * amount);
    const g = Math.round(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount);
    const b = Math.round((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount);
    return `rgb(${r}, ${g}, ${b})`;
}

export const QuickEditTaskCard: React.FC<QuickEditTaskCardProps> = (props) => {
    const { task, project, allTasks, isSelected, onSelect, onUpdate, onStatusChange, onPause,
        onToggleSubtask, onStartDrag, onDelete, onAIBreakdown, onEdit, compact = false } = props;

    const [expanded, setExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
    const [elapsedMinutes, setElapsedMinutes] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);
    
    // Inline editing state
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const dependencyTasks = (task.dependsOn || []).map(id => allTasks.find(t => t.id === id)).filter(Boolean as any);
    const hasBlockingDeps = dependencyTasks.some((t: any) => t && t.status !== 'completed');
    const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
    const totalSubtasks = (task.subtasks || []).length;
    const hasSubtasks = totalSubtasks > 0;

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
        if (task.status !== 'completed') {
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

    return (
        <div
            draggable={!isEditingTitle}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', task.id);
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
            onDragEnd={() => setIsDragging(false)}
            onClick={() => !isEditingTitle && onSelect(task.id)}
            className={[
                'group relative rounded-md border-l-3 transition-all duration-150',
                isEditingTitle ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                isSelected ? 'ring-2 ring-purple-400 ring-offset-1 bg-purple-50/50' : 'hover:bg-gray-50/80',
                isCompleted ? 'opacity-50' : '',
                hasBlockingDeps ? 'border-r border-r-amber-400 border-dashed' : '',
                isDragging ? 'opacity-50 scale-95' : '',
            ].filter(Boolean).join(' ')}
            style={{ 
                borderLeftColor: project.color,
                borderLeftWidth: '3px',
                backgroundColor: isSelected ? undefined : (project.id !== 'default' ? lightenColor(project.color, 0.95) : undefined),
            }}
        >
            {/* Hover tooltip */}
            {hasTooltipContent && !compact && !isEditingTitle && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-0 group-hover:delay-[2000ms] pointer-events-none">
                    <div className="bg-gray-900 text-white text-[10px] rounded-md shadow-lg p-2 max-w-[200px]">
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

            <div className={compact ? 'p-1.5 space-y-1' : 'p-2.5 space-y-1.5'}>
                {/* Header row - Status + Title + Quick Actions */}
                <div className={`flex items-start ${compact ? 'gap-1' : 'gap-1.5'}`}>
                    {/* Status toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (task.status === 'completed') {
                                onStatusChange(task.id, 'pending');
                            } else if (task.status === 'in-progress') {
                                onPause(task.id);
                            } else if (hasBlockingDeps) {
                                return; // Can't start if blocked
                            } else {
                                onStatusChange(task.id, 'in-progress');
                            }
                        }}
                        disabled={hasBlockingDeps && task.status === 'pending'}
                        className={`flex-shrink-0 ${compact ? 'mt-0' : 'mt-0.5'} ${hasBlockingDeps && task.status === 'pending' ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        {task.status === 'completed' && <CheckCircle2 size={compact ? 16 : 18} className="text-green-500" />}
                        {task.status === 'in-progress' && <Pause size={compact ? 16 : 18} className="text-blue-500" />}
                        {task.status !== 'completed' && task.status !== 'in-progress' && (
                            <Circle size={compact ? 16 : 18} className="text-gray-400 hover:text-blue-500 transition-colors" />
                        )}
                    </button>

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
                                <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'} ${isCompleted ? '' : 'cursor-text'}`}>
                                    {showPriorityDot && <span className={`inline-block w-1.5 h-1.5 rounded-full ${priorityColor} mr-1.5 align-middle`}></span>}
                                    {task.icon && iconMap[task.icon] && <span className="inline-block mr-1.5 align-middle">{iconMap[task.icon]}</span>}
                                    {task.isTopPriority && <Star size={14} className="inline mr-1 text-amber-500 fill-amber-500" />}
                                    {task.title}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick actions - show on hover */}
                    {!compact && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {!isCompleted && task.status !== 'in-progress' && !hasBlockingDeps && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(task.id, 'in-progress');
                                }}
                                className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Start task (track time)"
                            >
                                <Play size={14} />
                            </button>
                        )}
                        {!isCompleted && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(task.id, 'completed');
                                }}
                                className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
                                title="Mark complete"
                            >
                                <CheckCircle2 size={14} />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this task?')) {
                                    onDelete(task.id);
                                }
                            }}
                            className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete task"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button
                            ref={menuButtonRef}
                            onClick={onMenuToggle}
                            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                            title="More actions"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    </div>
                    )}
                </div>

                {/* Metadata row - Editable badges */}
                <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'} flex-wrap ${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-600`}>
                    <EditablePriorityBadge
                        priority={task.priority}
                        onChange={handlePriorityChange}
                        disabled={isCompleted}
                    />
                    {task.energyLevel && (
                        <EditableEnergyBadge
                            level={task.energyLevel}
                            onChange={handleEnergyChange}
                            disabled={isCompleted}
                        />
                    )}
                    <EditableTimeBlockBadge
                        timeBlock={task.timeBlock}
                        onChange={handleTimeBlockChange}
                        disabled={isCompleted}
                    />
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
                    {task.estimatedMinutes && (
                        <span className="flex items-center gap-0.5 text-gray-500">
                            <Clock size={10} />
                            {task.estimatedMinutes}m
                        </span>
                    )}
                </div>

                {/* In-progress timer */}
                {task.status === 'in-progress' && elapsedMinutes > 0 && !compact && (
                    <div className={`flex items-center justify-between text-xs ${timeStatus.color} ${timeStatus.bgColor} px-2 py-1 rounded-md ${timeStatus.pulse ? 'animate-pulse' : ''}`}>
                        <div className="flex items-center gap-1">
                            <Play size={12} />
                            <span className="font-medium">{elapsedMinutes}m elapsed</span>
                        </div>
                        {task.estimatedMinutes && (
                            <span className="text-[10px] opacity-75">/ {task.estimatedMinutes}m est</span>
                        )}
                    </div>
                )}

                {/* Subtasks progress (if any) */}
                {hasSubtasks && !compact && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                            />
                        </div>
                        <span>{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                )}

                {/* Blocking dependencies warning */}
                {hasBlockingDeps && (
                    <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                        <Link2 size={10} />
                        Blocked by {dependencyTasks.filter((t: any) => t?.status !== 'completed').length} task(s)
                    </div>
                )}
            </div>

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
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <Edit3 size={14} />
                        Full Edit
                    </button>
                    <button
                        onClick={() => {
                            setShowMenu(false);
                            onAIBreakdown(task);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <Wand2 size={14} />
                        AI Breakdown
                    </button>
                    <button
                        onClick={() => {
                            setShowMenu(false);
                            navigator.clipboard.writeText(task.title);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
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
