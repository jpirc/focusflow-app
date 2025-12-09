import React, { useState } from 'react';
import { Task, Project, Subtask, TaskStatus, TimeBlock, DragItem, TimeBlockConfig } from '../types';
import { TaskCard } from './TaskCard';

interface TimeBlockColumnProps {
    block: TimeBlockConfig;
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
    onEdit: (task: Task) => void;
}

export const TimeBlockColumn: React.FC<TimeBlockColumnProps> = ({
    block, tasks, allTasks, projects, date, selectedTaskId,
    onSelectTask, onStatusChange, onToggleSubtask, onStartDrag, onDrop, onDelete,
    onAIBreakdown, onUpdateSubtasks, onEdit
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

            {/* Tasks list */}
            <div className="p-2 space-y-2">
                {tasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId) || { id: 'default', name: 'No Project', color: '#6b7280', bgColor: '#f3f4f6', icon: 'folder' };
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
                            onEdit={onEdit}
                        />
                    );
                })}

                {tasks.length === 0 && (
                    <div className="h-12 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-xs">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
};
