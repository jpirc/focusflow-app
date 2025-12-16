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
}

export const TaskCard: React.FC<TaskCardProps> = (props) => {
    const { task, project, allTasks, isSelected, onSelect, onStatusChange,
        onToggleSubtask, onStartDrag, onDelete, onAIBreakdown, onEdit } = props;

    const [expanded, setExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);

    const dependencyTasks = (task.dependsOn || []).map(id => allTasks.find(t => t.id === id)).filter(Boolean as any);
    const hasBlockingDeps = dependencyTasks.some((t: any) => t && t.status !== 'completed');
    const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;

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
                'group relative rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md',
                isSelected ? 'ring-2 ring-purple-400 ring-offset-1' : '',
                task.status === 'completed' ? 'opacity-70' : '',
                hasBlockingDeps ? 'border-dashed border-amber-400' : 'border-gray-200',
                (task.rolloverCount || 0) >= 3 && task.status !== 'completed' ? 'shadow-orange-100 shadow-md' : '',
                (task.rolloverCount || 0) >= 5 && task.status !== 'completed' ? 'shadow-red-100 shadow-lg' : ''
            ].filter(Boolean).join(' ')}
            style={{ borderLeftColor: project.color, borderLeftWidth: '3px' }}
        >
            {task.aiGenerated && (
                <div className="absolute -top-2 -left-2 bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Sparkles size={10} /> AI
                </div>
            )}

            <div className="p-3">
                <div className="flex items-start gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); const nextStatus = task.status === 'completed' ? 'pending' : 'completed'; onStatusChange(task.id, nextStatus); }}
                        className="mt-0.5 flex-shrink-0"
                    >
                        {task.status === 'completed' ? (
                            <CheckCircle2 size={18} className="text-green-500" />
                        ) : task.status === 'in-progress' ? (
                            <div className="w-[18px] h-[18px] rounded-full border-2 border-blue-500 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /></div>
                        ) : (
                            <Circle size={18} className="text-gray-300 hover:text-gray-400" />
                        )}
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1.5">
                            <span className="p-1 rounded flex-shrink-0 mt-0.5" style={{ backgroundColor: project.bgColor, color: project.color }}>
                                {iconMap[task.icon] || <Target size={14} />}
                            </span>
                            <h4 className={`font-medium text-sm break-words leading-snug ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</h4>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap ml-[30px]">
                            <span className="text-[11px] text-gray-500">{task.estimatedMinutes}min</span>
                            <PriorityBadge priority={task.priority} />
                            <EnergyBadge level={task.energyLevel} />
                            {(task.subtasks || []).length > 0 && (<span className="text-[11px] text-gray-500">{completedSubtasks}/{(task.subtasks || []).length} steps</span>)}
                            <RolloverBadge count={task.rolloverCount || 0} />
                            <TaskAgeBadge createdAt={task.createdAt} />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.status === 'pending' && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'in-progress'); }} className="p-1 hover:bg-blue-100 rounded transition-colors" title="Start task"><Play size={14} className="text-blue-600" /></button>
                        )}

                        {task.status !== 'completed' && task.subtasks.length === 0 && (
                            <button onClick={(e) => { e.stopPropagation(); onAIBreakdown(task); }} className="p-1 hover:bg-purple-100 rounded transition-colors" title="AI breakdown"><Wand2 size={14} className="text-purple-500" /></button>
                        )}

                        <button ref={menuButtonRef} onClick={onMenuToggle} className="p-1 hover:bg-gray-100 rounded transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button>
                    </div>
                </div>

                {showMenu && menuStyle && createPortal(
                    <div style={{ position: 'fixed', top: menuStyle.top, left: menuStyle.left, zIndex: 9999 }}>
                        <div className="bg-white text-gray-900 rounded-lg shadow-2xl border border-gray-200 py-1 min-w-[160px]">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(task); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Edit3 size={14} /> Edit task</button>
                            <button onClick={(e) => { e.stopPropagation(); onAIBreakdown(task); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-sm hover:bg-purple-50 text-purple-600 flex items-center gap-2"><Wand2 size={14} /> AI breakdown</button>
                            <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Link2 size={14} /> Link to task</button>
                            <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Copy size={14} /> Duplicate</button>
                            <hr className="my-1" />
                            <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                        </div>
                    </div>,
                    (typeof document !== 'undefined' ? (document.body as any) : ({} as any))
                )}

                {(task.subtasks || []).length > 0 && (
                    <div className="mt-2 ml-6 space-y-1 border-l-2 border-gray-100 pl-2">
                        {(task.subtasks || []).map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-2 group/subtask">
                                <button onClick={(e) => { e.stopPropagation(); onToggleSubtask(task.id, subtask.id); }}>
                                    {subtask.completed ? <CheckCircle2 size={14} className="text-green-500" /> : <Circle size={14} className="text-gray-300 group-hover/subtask:text-gray-400" />}
                                </button>
                                <span className={`text-xs flex-1 ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>{subtask.title}</span>
                                {subtask.estimatedMinutes && <span className="text-[10px] text-gray-400">{subtask.estimatedMinutes}m</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
