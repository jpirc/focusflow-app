import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
                <div className="bg-white text-gray-900 rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Task</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="What needs to be done?"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            placeholder="Add details..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time Block
                            </label>
                            <select
                                value={timeBlock}
                                onChange={(e) => setTimeBlock(e.target.value as TimeBlock)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="anytime">Anytime</option>
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                                <option value="evening">Evening</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project
                        </label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">None</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Energy
                            </label>
                            <select
                                value={energyLevel}
                                onChange={(e) => setEnergyLevel(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time (min)
                            </label>
                            <input
                                type="number"
                                value={estimatedMinutes}
                                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                min="5"
                                step="5"
                            />
                        </div>
                    </div>

                    {/* Subtasks Section */}
                    {onAddSubtask && onToggleSubtask && onDeleteSubtask && (
                        <div className="border-t pt-4">
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
                        <div className="border-t pt-4">
                            <DependencySelector
                                taskId={task.id}
                                currentDependencies={task.dependencies || []}
                                availableTasks={allTasks}
                                onAddDependency={(dependsOnId) => onAddDependency(task.id, dependsOnId)}
                                onRemoveDependency={(depId) => onRemoveDependency(task.id, depId)}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
