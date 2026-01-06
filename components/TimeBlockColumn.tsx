import React, { useState } from 'react';
import { Task, Project, Subtask, TaskStatus, TimeBlock, DragItem, TimeBlockConfig } from '../types';
import { QuickEditTaskCard } from './QuickEditTaskCard';

interface TimeBlockColumnProps {
    block: TimeBlockConfig;
    tasks: Task[];
    allTasks: Task[];
    projects: Project[];
    date: string;
    selectedTaskId: string | null;
    onSelectTask: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onPause: (id: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onStartDrag: (item: DragItem) => void;
    onDrop: (taskId: string, targetDate: string, targetBlock: TimeBlock, insertBeforeOrder?: number) => void;
    onDelete: (id: string) => void;
    onAIBreakdown: (task: Task) => void;
    onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
    onEdit: (task: Task) => void;
    compact?: boolean;
}

export const TimeBlockColumn: React.FC<TimeBlockColumnProps> = ({
    block, tasks, allTasks, projects, date, selectedTaskId,
    onSelectTask, onUpdate, onStatusChange, onPause, onToggleSubtask, onStartDrag, onDrop, onDelete,
    onAIBreakdown, onUpdateSubtasks, onEdit, compact = false
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        // Only activate column drag-over if not hovering over a task
        const target = e.target as HTMLElement;
        const isOverTask = target.closest('[data-task-id]');
        if (!isOverTask) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setIsDragOver(true);
        } else {
            e.preventDefault();
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
        delete (window as any).__dropBeforeTaskId;
        
        if (taskId) {
            if (dropBeforeTaskId) {
                // Dropped on a specific task - reorder before that task
                const targetTask = tasks.find(t => t.id === dropBeforeTaskId);
                if (targetTask) {
                    onDrop(taskId, date, block.id, targetTask.order);
                } else {
                    onDrop(taskId, date, block.id);
                }
            } else {
                // Dropped in empty space - append to end
                onDrop(taskId, date, block.id);
            }
        }
    };

    const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    // Clean outlined style with subtle color accents
    const blockStyles = {
        morning: { border: 'border-sky-200', icon: 'text-sky-500', headerBg: 'bg-sky-50/50' },
        afternoon: { border: 'border-emerald-200', icon: 'text-emerald-500', headerBg: 'bg-emerald-50/50' },
        evening: { border: 'border-violet-200', icon: 'text-violet-500', headerBg: 'bg-violet-50/50' },
        anytime: { border: 'border-gray-200', icon: 'text-gray-400', headerBg: 'bg-gray-50/50' },
    };

    const style = blockStyles[block.id];

    return (
        <div
            className={`flex-1 rounded-lg border bg-white transition-all duration-200
                ${compact ? 'min-h-[48px]' : 'min-h-[72px]'}
                ${isDragOver ? 'border-purple-400 bg-purple-50 scale-[1.02] border-2' : style.border}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Block header */}
            <div className={`flex items-center justify-between rounded-t-lg ${style.headerBg} ${compact ? 'px-1 py-0.5' : 'px-2 py-1'}`}>
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
            </div>

            {/* Tasks list */}
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
                                onSelect={onSelectTask}
                                onUpdate={onUpdate}
                                onStatusChange={onStatusChange}
                                onPause={onPause}
                                onToggleSubtask={onToggleSubtask}
                                onStartDrag={onStartDrag}
                                onDelete={onDelete}
                                onAIBreakdown={onAIBreakdown}
                                onUpdateSubtasks={onUpdateSubtasks}
                                onEdit={onEdit}
                                compact={compact}
                            />
                        </div>
                    );
                })}

                {tasks.length === 0 && (
                    <div className={`border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 ${compact ? 'h-6 text-[9px]' : 'h-8 text-[10px]'}`}>
                        {compact ? '+' : 'Drop here'}
                    </div>
                )}
            </div>
        </div>
    );
};
