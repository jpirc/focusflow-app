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

    // Filter out current task and already selected dependencies
    const dependencyIds = new Set(currentDependencies.map(d => d.dependsOnId));
    const selectableTasks = availableTasks.filter(
        t => t.id !== taskId && !dependencyIds.has(t.id)
    );

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
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Dependencies</h4>
                {hasBlockedDependencies && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertCircle size={12} />
                        Task is blocked
                    </span>
                )}
            </div>

            {/* Current dependencies */}
            {currentDependencies.length > 0 ? (
                <div className="space-y-2">
                    {currentDependencies.map((dep) => (
                        <div
                            key={dep.id}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
                        >
                            <Link2 size={14} className="text-gray-400" />
                            <span className="flex-1 text-sm text-gray-700">
                                {dep.dependsOn.title}
                            </span>
                            <span
                                className={`text-xs px-2 py-0.5 rounded ${dep.dependsOn.completed || dep.dependsOn.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}
                            >
                                {dep.dependsOn.completed || dep.dependsOn.status === 'completed'
                                    ? 'Complete'
                                    : 'Pending'}
                            </span>
                            <button
                                onClick={() => onRemoveDependency(dep.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                            >
                                <X size={14} className="text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">No dependencies</p>
            )}

            {/* Add dependency */}
            {isAdding ? (
                <div className="space-y-2">
                    <select
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">Select a task...</option>
                        {selectableTasks.map((task) => (
                            <option key={task.id} value={task.id}>
                                {task.title}
                            </option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={!selectedTaskId}
                            className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Dependency
                        </button>
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setSelectedTaskId('');
                            }}
                            className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={selectableTasks.length === 0}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    + Add Dependency
                </button>
            )}

            {selectableTasks.length === 0 && !isAdding && (
                <p className="text-xs text-gray-400 italic">
                    No other tasks available to add as dependencies
                </p>
            )}
        </div>
    );
}
