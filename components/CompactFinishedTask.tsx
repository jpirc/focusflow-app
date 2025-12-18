/**
 * Compact Finished Task - Minimal view for completed tasks in sidebar
 */

'use client';

import React from 'react';
import { Check, Undo2 } from 'lucide-react';
import { Task, Project } from '@/types';
import { formatTimeAgo } from '@/lib/utils/date';

interface CompactFinishedTaskProps {
    task: Task;
    project?: Project;
    onUncomplete: (id: string) => void;
    onEdit: (task: Task) => void;
}

export function CompactFinishedTask({ task, project, onUncomplete, onEdit }: CompactFinishedTaskProps) {
    return (
        <div
            className="group flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            onClick={() => onEdit(task)}
        >
            {/* Completed checkmark */}
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-white" strokeWidth={3} />
            </div>
            
            {/* Task title - truncated */}
            <span className="flex-1 text-xs text-gray-500 line-through truncate">
                {task.title}
            </span>
            
            {/* Project color dot */}
            {project && (
                <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                    title={project.name}
                />
            )}
            
            {/* Completed time */}
            <span className="text-[10px] text-gray-400 flex-shrink-0 hidden group-hover:hidden">
                {formatTimeAgo(task.completedAt)}
            </span>
            
            {/* Undo button - show on hover */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onUncomplete(task.id);
                }}
                className="hidden group-hover:flex p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                title="Mark as incomplete"
            >
                <Undo2 size={12} />
            </button>
        </div>
    );
}
