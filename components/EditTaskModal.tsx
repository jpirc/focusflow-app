import React, { useState, useEffect } from 'react';
import { X, Sun, Cloud, Moon, Clock, Zap, Flag, AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { Task, TimeBlock, TaskDependency, Subtask } from '../types';
import { SubtaskList } from './SubtaskList';
import { DependencySelector } from './DependencySelector';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    task: Task & {
        subtasks?: Subtask[];
        dependencies?: TaskDependency[];
    };
    projects: Array<{ id: string; name: string; color: string }>;
    allTasks: Task[];
    onAddSubtask?: (taskId: string, title: string) => void;
    onToggleSubtask?: (taskId: string, subtaskId: string) => void;
    onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
    onUpdateSubtask?: (taskId: string, subtaskId: string, updates: { estimatedMinutes?: number; title?: string }) => void;
    onAddDependency?: (taskId: string, dependsOnId: string) => void;
    onRemoveDependency?: (taskId: string, dependencyId: string) => void;
}

export function EditTaskModal({
    isOpen,
    onClose,
    onUpdate,
    task,
    projects,
    allTasks,
    onAddSubtask,
    onToggleSubtask,
    onDeleteSubtask,
    onUpdateSubtask,
    onAddDependency,
    onRemoveDependency,
}: EditTaskModalProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [date, setDate] = useState(task.date || '');
    const [timeBlock, setTimeBlock] = useState<TimeBlock>(task.timeBlock);
    const [projectId, setProjectId] = useState(task.projectId || '');
    const [priority, setPriority] = useState(task.priority);
    const [energyLevel, setEnergyLevel] = useState(task.energyLevel);
    const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimatedMinutes);

    // Update form when task changes
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setDate(task.date || '');
        setTimeBlock(task.timeBlock);
        setProjectId(task.projectId || '');
        setPriority(task.priority);
        setEnergyLevel(task.energyLevel);
        setEstimatedMinutes(task.estimatedMinutes);
    }, [task]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onUpdate(task.id, {
                title,
                description: description || undefined,
                date: date || null,
                timeBlock,
                projectId: projectId || undefined,
                priority,
                energyLevel,
                estimatedMinutes,
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white text-gray-900 rounded-xl shadow-2xl w-full max-w-lg p-4 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                    <X size={18} />
                </button>

                <h2 className="text-base font-bold text-gray-900 mb-3">Edit Task</h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Task title..."
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            placeholder="Notes (optional)..."
                            rows={2}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                            {[
                                { id: 'anytime' as TimeBlock, icon: Clock, label: 'Any' },
                                { id: 'morning' as TimeBlock, icon: Sun, label: 'AM' },
                                { id: 'afternoon' as TimeBlock, icon: Cloud, label: 'PM' },
                                { id: 'evening' as TimeBlock, icon: Moon, label: 'Eve' },
                            ].map((tb) => (
                                <button
                                    key={tb.id}
                                    type="button"
                                    onClick={() => setTimeBlock(tb.id)}
                                    className={`p-1.5 transition-colors ${
                                        timeBlock === tb.id
                                            ? 'bg-purple-100 text-purple-600'
                                            : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                    title={tb.label}
                                >
                                    <tb.icon size={14} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">No project</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={estimatedMinutes}
                            onChange={(e) => setEstimatedMinutes(parseInt(e.target.value))}
                            className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                            min="5"
                            step="5"
                            title="Minutes"
                        />
                        <span className="text-xs text-gray-400">min</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Priority:</span>
                            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                                {[
                                    { id: 'low', icon: ArrowDown, color: 'text-gray-400' },
                                    { id: 'medium', icon: ArrowRight, color: 'text-blue-500' },
                                    { id: 'high', icon: ArrowUp, color: 'text-orange-500' },
                                    { id: 'urgent', icon: AlertTriangle, color: 'text-red-500' },
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setPriority(p.id as any)}
                                        className={`p-1.5 transition-colors ${
                                            priority === p.id
                                                ? 'bg-gray-100 ' + p.color
                                                : 'hover:bg-gray-50 text-gray-300'
                                        }`}
                                        title={p.id.charAt(0).toUpperCase() + p.id.slice(1)}
                                    >
                                        <p.icon size={14} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Energy:</span>
                            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                                {[
                                    { id: 'low', level: 1 },
                                    { id: 'medium', level: 2 },
                                    { id: 'high', level: 3 },
                                ].map((e) => (
                                    <button
                                        key={e.id}
                                        type="button"
                                        onClick={() => setEnergyLevel(e.id as any)}
                                        className={`px-2 py-1.5 transition-colors ${
                                            energyLevel === e.id
                                                ? 'bg-yellow-100 text-yellow-600'
                                                : 'hover:bg-gray-50 text-gray-300'
                                        }`}
                                        title={e.id.charAt(0).toUpperCase() + e.id.slice(1)}
                                    >
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3].map((i) => (
                                                <Zap key={i} size={10} className={i <= e.level ? '' : 'opacity-30'} />
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Subtasks Section */}
                    {onAddSubtask && onToggleSubtask && onDeleteSubtask && (
                        <div className="border-t pt-2">
                            <SubtaskList
                                taskId={task.id}
                                subtasks={task.subtasks || []}
                                onToggleSubtask={(subtaskId) => onToggleSubtask(task.id, subtaskId)}
                                onAddSubtask={(title) => onAddSubtask(task.id, title)}
                                onDeleteSubtask={(subtaskId) => onDeleteSubtask(task.id, subtaskId)}
                                onUpdateSubtask={onUpdateSubtask ? (subtaskId, updates) => onUpdateSubtask(task.id, subtaskId, updates) : undefined}
                            />
                        </div>
                    )}

                    {/* Dependencies Section */}
                    {onAddDependency && onRemoveDependency && allTasks && (
                        <div className="border-t pt-2">
                            <DependencySelector
                                taskId={task.id}
                                currentDependencies={task.dependencies || []}
                                availableTasks={allTasks}
                                onAddDependency={(dependsOnId) => onAddDependency(task.id, dependsOnId)}
                                onRemoveDependency={(depId) => onRemoveDependency(task.id, depId)}
                            />
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
