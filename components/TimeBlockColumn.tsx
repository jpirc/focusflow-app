import React, { useState, useEffect } from 'react';
import { Task, Project, Subtask, TaskStatus, TimeBlock, DragItem, TimeBlockConfig } from '../types';
import { QuickEditTaskCard } from './QuickEditTaskCard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Theme } from '@/lib/themes';

interface TimeBlockColumnProps {
    block: TimeBlockConfig;
    tasks: Task[];
    allTasks: Task[];
    projects: Project[];
    date: string;
    selectedTaskId: string | null;
    highlightedTaskId?: string | null; // Cross-panel highlighting
    onSelectTask: (id: string) => void;
    onHoverTask?: (id: string | null) => void; // Cross-panel hover
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onPause: (id: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onStartDrag: (item: DragItem) => void;
    onDrop: (taskId: string, targetDate: string, targetBlock: TimeBlock, insertBeforeTaskId?: string) => void;
    onDelete: (id: string) => void;
    onAIBreakdown: (task: Task) => void;
    onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
    onEdit: (task: Task) => void;
    onStartPomodoro?: (task: Task) => void;
    onUnschedule?: (taskId: string) => void;
    compact?: boolean;
    subtasksExpandedAll?: boolean;
    theme?: Theme;
}

export const TimeBlockColumn: React.FC<TimeBlockColumnProps> = ({
    block, tasks, allTasks, projects, date, selectedTaskId, highlightedTaskId,
    onSelectTask, onHoverTask, onUpdate, onStatusChange, onPause, onToggleSubtask, onStartDrag, onDrop, onDelete,
    onAIBreakdown, onUpdateSubtasks, onEdit, onStartPomodoro, onUnschedule, compact = false, subtasksExpandedAll = true, theme
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
    // Collapse state for anytime block only
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (block.id !== 'anytime') return false;
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('focusflow_anytime_collapsed');
        return saved === 'true';
    });

    // Save collapse preference for anytime block
    useEffect(() => {
        if (block.id === 'anytime') {
            localStorage.setItem('focusflow_anytime_collapsed', String(isCollapsed));
        }
    }, [isCollapsed, block.id]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // MUST always prevent default to allow drop
        e.dataTransfer.dropEffect = 'move';
        
        // Only activate visual drag-over if not hovering over a task
        const target = e.target as HTMLElement;
        const isOverTask = target.closest('[data-task-id]');
        if (!isOverTask) {
            setIsDragOver(true);
        } else {
            setIsDragOver(false);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        const target = e.relatedTarget as HTMLElement;
        const isStillInColumn = e.currentTarget.contains(target);
        if (!isStillInColumn) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        const dropBeforeTaskId = (window as any).__dropBeforeTaskId;
        console.log('[COLUMN] handleDrop - taskId:', taskId, 'dropBeforeTaskId:', dropBeforeTaskId);
        // Clean up the global
        delete (window as any).__dropBeforeTaskId;
        
        if (taskId) {
            if (dropBeforeTaskId) {
                // Dropped on a specific task - reorder before that task
                console.log('[COLUMN] Calling onDrop with dropBefore:', dropBeforeTaskId);
                onDrop(taskId, date, block.id, dropBeforeTaskId);
            } else {
                // Dropped in empty space - append to end
                console.log('[COLUMN] Calling onDrop without dropBefore');
                onDrop(taskId, date, block.id);
            }
        }
    };

    const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    // Clean outlined style with subtle color accents
    const blockStyles = {
        inbox: { border: 'border-gray-200', icon: 'text-gray-400', headerBg: 'bg-gray-50/50' },
        morning: { border: 'border-sky-200', icon: 'text-sky-500', headerBg: 'bg-sky-50/50' },
        afternoon: { border: 'border-emerald-200', icon: 'text-emerald-500', headerBg: 'bg-emerald-50/50' },
        evening: { border: 'border-violet-200', icon: 'text-violet-500', headerBg: 'bg-violet-50/50' },
        anytime: { border: 'border-gray-200', icon: 'text-gray-400', headerBg: 'bg-gray-50/50' },
    };

    const style = blockStyles[block.id];
    
    // Calculate min height based on state
    const minHeight = compact 
        ? 'min-h-[48px]' 
        : (block.id === 'anytime' && isCollapsed) 
            ? 'min-h-[32px]' 
            : 'min-h-[72px]';
    
    // Calculate padding based on state
    const headerPadding = compact 
        ? 'px-1 py-0.5' 
        : (block.id === 'anytime' && isCollapsed) 
            ? 'px-2 py-0.5' 
            : 'px-2 py-1';

    return (
        <div
            className={`flex-1 border transition-all duration-200 ${minHeight} ${isDragOver ? 'scale-[1.02] border-2' : style.border} ${!isDragOver ? 'bg-white' : ''}`}
            style={isDragOver ? {
                borderColor: theme?.colors.dragBorder || '#60a5fa',
                backgroundColor: theme?.colors.dragBg || '#eff6ff'
            } : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Block header */}
            <div className={`flex items-center justify-between ${style.headerBg} ${headerPadding}`}>
                {block.id === 'anytime' ? (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`flex items-center gap-1 flex-1 hover:bg-white/30 transition-colors ${isCollapsed ? '-mx-2 -my-0.5 px-2 py-0.5' : '-mx-2 -my-1 px-2 py-1'}`}
                    >
                        <div className="flex items-center gap-1">
                            <span className={`${style.icon} ${isCollapsed ? 'text-sm' : ''}`}>
                                {block.icon}
                            </span>
                            <span className={`font-medium text-gray-700 ${compact ? 'text-[10px]' : isCollapsed ? 'text-[11px]' : 'text-xs'}`}>{compact ? block.label.slice(0, 4) : block.label}</span>
                            {!compact && !isCollapsed && <span className="text-[10px] text-gray-400">({block.hours})</span>}
                        </div>
                        <div className="flex items-center gap-1 ml-auto text-gray-400">
                            <div className={`flex items-center gap-1 ${compact ? 'text-[9px]' : isCollapsed ? 'text-[9px]' : 'text-[10px]'}`}>
                                {tasks.length > 0 && (
                                    <>
                                        <span>{completedCount}/{tasks.length}</span>
                                        {!compact && <span>•</span>}
                                        {!compact && <span>{totalMinutes}min</span>}
                                    </>
                                )}
                            </div>
                            {isCollapsed ? (
                                <ChevronDown size={12} className="text-gray-500" />
                            ) : (
                                <ChevronUp size={12} className="text-gray-500" />
                            )}
                        </div>
                    </button>
                ) : (
                    <>
                        <div className="flex items-center gap-1">
                            <span className={style.icon}>
                                {block.icon}
                            </span>
                            <span className={`font-medium text-gray-700 ${compact ? 'text-[10px]' : 'text-xs'}`}>{compact ? block.label.slice(0, 4) : block.label}</span>
                            {!compact && <span className="text-[10px] text-gray-400">({block.hours})</span>}
                        </div>
                        <div className={`flex items-center gap-1 text-gray-400 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                            {tasks.length > 0 && (
                                <>
                                    <span>{completedCount}/{tasks.length}</span>
                                    {!compact && <span>•</span>}
                                    {!compact && <span>{totalMinutes}min</span>}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Tasks list */}
            {!(block.id === 'anytime' && isCollapsed) && (
                <div className={`${compact ? 'p-0.5 space-y-0.5' : 'p-1 space-y-1'}`}>
                {tasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId) || { id: 'default', name: 'No Project', color: '#6b7280', bgColor: '#f3f4f6', icon: 'folder' };
                    return (
                        <div key={task.id} data-task-id={task.id}>
                            <QuickEditTaskCard
                                task={task}
                                project={project}
                                allTasks={allTasks}
                                allProjects={projects}
                                isSelected={selectedTaskId === task.id}
                                isHighlighted={highlightedTaskId === task.id}
                                onSelect={onSelectTask}
                                onHover={onHoverTask}
                                onUpdate={onUpdate}
                                onStatusChange={onStatusChange}
                                onPause={onPause}
                                onToggleSubtask={onToggleSubtask}
                                onStartDrag={onStartDrag}
                                onDelete={onDelete}
                                onAIBreakdown={onAIBreakdown}
                                onUpdateSubtasks={onUpdateSubtasks}
                                onEdit={onEdit}
                                onStartPomodoro={onStartPomodoro}
                                onUnschedule={onUnschedule}
                                compact={compact}
                                subtasksExpandedAll={subtasksExpandedAll}
                            />
                        </div>
                    );
                })}

                {tasks.length === 0 && (
                    <div className={`border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 ${compact ? 'h-6 text-[9px]' : 'h-8 text-[10px]'}`}>
                        {compact ? '+' : 'Drop here'}
                    </div>
                )}
                </div>
            )}
        </div>
    );
};
