import React, { useState, useEffect } from 'react';
import { X, Link2, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface Dependency {
    id: string;
    dependsOnId: string;
    dependsOn: Task;
}

interface DependencySelectorProps {
    taskId: string;
    currentDependencies: Dependency[];
    availableTasks: Task[];
    onAddDependency: (dependsOnId: string) => void;
    onRemoveDependency: (dependencyId: string) => void;
}

export function DependencySelector({
    taskId,
    currentDependencies,
    availableTasks,
    onAddDependency,
    onRemoveDependency,
}: DependencySelectorProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState('');

    // Filter out current task, already selected dependencies, and completed tasks
    const dependencyIds = new Set(currentDependencies.map(d => d.dependsOnId));
    const selectableTasks = availableTasks.filter(
        t => t.id !== taskId && 
        !dependencyIds.has(t.id) && 
        t.status !== 'completed' && 
        t.status !== 'skipped'
    );

    // Group tasks by project for better organization
    const groupedTasks = selectableTasks.reduce((acc, task) => {
        const key = task.projectId || 'no-project';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
    }, {} as Record<string, typeof selectableTasks>);

    const handleAdd = () => {
        if (selectedTaskId) {
            onAddDependency(selectedTaskId);
            setSelectedTaskId('');
            setIsAdding(false);
        }
    };

    const hasBlockedDependencies = currentDependencies.some(
        d => !d.dependsOn.completed && d.dependsOn.status !== 'completed'
    );

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-medium text-gray-500 uppercase">Dependencies</h4>
                {hasBlockedDependencies && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600">
                        <AlertCircle size={10} />
                        Blocked
                    </span>
                )}
            </div>

            {/* Current dependencies */}
            {currentDependencies.length > 0 ? (
                <div className="space-y-1">
                    {currentDependencies.map((dep) => (
                        <div
                            key={dep.id}
                            className="flex items-center gap-1.5 py-1 px-1.5 bg-gray-50 rounded group"
                        >
                            <Link2 size={12} className="text-gray-400" />
                            <span className="flex-1 text-xs text-gray-700 truncate">
                                {dep.dependsOn.title}
                            </span>
                            <span
                                className={`text-[10px] px-1.5 py-0.5 rounded ${dep.dependsOn.completed || dep.dependsOn.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}
                            >
                                {dep.dependsOn.completed || dep.dependsOn.status === 'completed'
                                    ? '✓'
                                    : '•••'}
                            </span>
                            <button
                                onClick={() => onRemoveDependency(dep.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity"
                            >
                                <X size={12} className="text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[10px] text-gray-400 italic">No dependencies</p>
            )}

            {/* Add dependency */}
            {isAdding ? (
                <div className="space-y-1.5">
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded">
                        {Object.keys(groupedTasks).length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-400 italic">
                                No active tasks available
                            </div>
                        ) : (
                            Object.entries(groupedTasks).map(([projectId, tasks]) => (
                                <div key={projectId} className="border-b border-gray-100 last:border-0">
                                    {tasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => setSelectedTaskId(task.id)}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-purple-50 transition-colors border-l-2 ${
                                                selectedTaskId === task.id
                                                    ? 'bg-purple-50 border-purple-500'
                                                    : 'border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                    task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                                                }`} />
                                                <span className="flex-1 truncate text-gray-900">{task.title}</span>
                                                {task.priority === 'urgent' && (
                                                    <span className="text-red-500 text-[10px]">!</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            onClick={handleAdd}
                            disabled={!selectedTaskId}
                            className="flex-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setSelectedTaskId('');
                            }}
                            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={selectableTasks.length === 0}
                    className="text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    + Add Dependency
                </button>
            )}

            {selectableTasks.length === 0 && !isAdding && (
                <p className="text-[10px] text-gray-400 italic">
                    No tasks available
                </p>
            )}
        </div>
    );
}
