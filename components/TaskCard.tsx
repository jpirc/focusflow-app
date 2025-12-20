"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Play, Wand2, MoreHorizontal, Edit3, Link2, Copy, Trash2,
    ChevronUp, ChevronDown, GripVertical, CheckCircle2, Circle,
    Sparkles, ArrowRight, Target, Flag, BatteryLow, BatteryMedium, BatteryFull,
    Coffee, Briefcase, Home, Heart, Dumbbell, BookOpen, RotateCcw, Clock
} from 'lucide-react';
import { Task, Project, Subtask, TaskStatus, Priority, EnergyLevel, DragItem } from '../types';
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

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
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

export const EnergyBadge: React.FC<{ level: EnergyLevel }> = ({ level }) => {
    const config = {
        low: { icon: <BatteryLow size={12} />, color: 'text-slate-500' },
        medium: { icon: <BatteryMedium size={12} />, color: 'text-amber-500' },
        high: { icon: <BatteryFull size={12} />, color: 'text-green-500' },
    };
    return <span className={config[level].color}>{config[level].icon}</span>;
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
// COMPONENT
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
    onEdit: (task: Task) => void;
    compact?: boolean; // For 5-day view
}

// Helper to lighten a hex color for backgrounds
function lightenColor(hex: string, amount: number = 0.85): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.round((num >> 16) + (255 - (num >> 16)) * amount);
    const g = Math.round(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount);
    const b = Math.round((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount);
    return `rgb(${r}, ${g}, ${b})`;
}

export const TaskCard: React.FC<TaskCardProps> = (props) => {
    const { task, project, allTasks, isSelected, onSelect, onStatusChange,
        onToggleSubtask, onStartDrag, onDelete, onAIBreakdown, onEdit, compact = false } = props;

    const [expanded, setExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
    const [elapsedMinutes, setElapsedMinutes] = useState(0);
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);

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
            const interval = setInterval(updateElapsed, 60000); // Update every minute
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

    const onMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(v => !v);
    };

    // Determine if we should show priority indicator (only for high/urgent)
    const showPriorityDot = task.priority === 'urgent' || task.priority === 'high';
    const priorityColor = task.priority === 'urgent' ? 'bg-red-500' : 'bg-orange-400';

    // Check if there's meaningful content for tooltip
    const hasTooltipContent = task.description || project.name || task.estimatedMinutes;

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', task.id);
                onStartDrag({ taskId: task.id, sourceDate: task.date, sourceTimeBlock: task.timeBlock });
            }}
            onClick={() => onSelect(task.id)}
            className={[
                'group relative rounded-md border-l-3 transition-all duration-150 cursor-grab active:cursor-grabbing',
                isSelected ? 'ring-2 ring-purple-400 ring-offset-1 bg-purple-50/50' : 'hover:bg-gray-50/80',
                task.status === 'completed' ? 'opacity-50' : '',
                hasBlockingDeps ? 'border-r border-r-amber-400 border-dashed' : '',
            ].filter(Boolean).join(' ')}
            style={{ 
                borderLeftColor: project.color,
                borderLeftWidth: '3px',
                backgroundColor: isSelected ? undefined : (project.id !== 'default' ? lightenColor(project.color, 0.95) : undefined),
            }}
        >
            {/* Hover tooltip - shows description and details */}
            {hasTooltipContent && !compact && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
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
            {task.aiGenerated && (
                <div className="absolute -top-1.5 -left-1.5 bg-purple-500 text-white text-[8px] px-1 py-0.5 rounded-full flex items-center gap-0.5 z-10">
                    <Sparkles size={8} /> AI
                </div>
            )}

            {/* Main content */}
            <div className="px-1.5 py-1 flex items-start gap-1.5">
                {/* Checkbox */}
                <button
                    onClick={(e) => { e.stopPropagation(); const nextStatus = task.status === 'completed' ? 'pending' : 'completed'; onStatusChange(task.id, nextStatus); }}
                    className="flex-shrink-0 mt-0.5"
                >
                    {task.status === 'completed' ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                    ) : task.status === 'in-progress' ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                    ) : (
                        <Circle size={14} className="text-gray-300 hover:text-gray-400" />
                    )}
                </button>

                {/* Priority dot */}
                {showPriorityDot && task.status !== 'completed' && (
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${priorityColor}`} title={task.priority} />
                )}

                {/* Title and content */}
                <div className="flex-1 min-w-0">
                    {/* Title - wraps to multiple lines */}
                    <div className="flex items-start justify-between gap-1">
                        <span className={`${compact ? 'text-[10px]' : 'text-xs'} leading-tight ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.title}
                        </span>
                        
                        {/* Inline indicators */}
                        <div className="flex items-center gap-1 flex-shrink-0 text-[9px] text-gray-400">
                            {/* Elapsed time for in-progress tasks */}
                            {task.status === 'in-progress' && task.startedAt && (
                                <span className="flex items-center gap-0.5 text-blue-500 font-medium">
                                    <Clock size={9} className="animate-pulse" />
                                    {elapsedMinutes}m
                                </span>
                            )}
                            {(task.rolloverCount || 0) > 0 && task.status !== 'completed' && (
                                <span className={`flex items-center ${(task.rolloverCount || 0) >= 3 ? 'text-orange-500' : ''}`}>
                                    <RotateCcw size={8} />{task.rolloverCount}
                                </span>
                            )}
                            {task.estimatedMinutes && !compact && (
                                <span>{task.estimatedMinutes}m</span>
                            )}
                            {!compact && <EnergyBadge level={task.energyLevel} />}
                        </div>
                    </div>

                    {/* Subtasks - always visible */}
                    {hasSubtasks && (
                        <div className="mt-0.5 ml-1 space-y-0 border-l border-gray-200 pl-1.5">
                            {(task.subtasks || []).map(subtask => (
                                <div key={subtask.id} className="flex items-center gap-1 py-px group/subtask">
                                    <button onClick={(e) => { e.stopPropagation(); onToggleSubtask(task.id, subtask.id); }}>
                                        {subtask.completed ? (
                                            <CheckCircle2 size={10} className="text-green-500" />
                                        ) : (
                                            <Circle size={10} className="text-gray-300 group-hover/subtask:text-gray-400" />
                                        )}
                                    </button>
                                    <span className={`text-[10px] leading-tight flex-1 ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                        {subtask.title}
                                    </span>
                                    {subtask.estimatedMinutes && (
                                        <span className="text-[9px] text-gray-400">{subtask.estimatedMinutes}m</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action buttons - show on hover */}
                <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {task.status === 'pending' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'in-progress'); }} 
                            className="p-0.5 hover:bg-blue-100 rounded transition-colors" 
                            title="Start"
                        >
                            <Play size={10} className="text-blue-600" />
                        </button>
                    )}

                    <button 
                        ref={menuButtonRef} 
                        onClick={onMenuToggle} 
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                    >
                        <MoreHorizontal size={10} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Context menu portal */}
            {showMenu && menuStyle && createPortal(
                <div style={{ position: 'fixed', top: menuStyle.top, left: menuStyle.left, zIndex: 9999 }}>
                    <div className="bg-white text-gray-900 rounded-lg shadow-2xl border border-gray-200 py-1 min-w-[160px]">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(task); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Edit3 size={14} /> Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onAIBreakdown(task); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-sm hover:bg-purple-50 text-purple-600 flex items-center gap-2">
                            <Wand2 size={14} /> AI breakdown
                        </button>
                        <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Copy size={14} /> Duplicate
                        </button>
                        <hr className="my-1" />
                        <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </div>,
                (typeof document !== 'undefined' ? (document.body as any) : ({} as any))
            )}
        </div>
    );
};
