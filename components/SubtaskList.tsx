import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, X, GripVertical, Edit2, Check } from 'lucide-react';
import { Subtask } from '../types';

interface SubtaskListProps {
    taskId: string;
    subtasks: Subtask[];
    onToggleSubtask: (subtaskId: string) => void;
    onAddSubtask: (title: string) => void;
    onDeleteSubtask: (subtaskId: string) => void;
    onUpdateSubtask?: (subtaskId: string, updates: { estimatedMinutes?: number; title?: string }) => void;
    editable?: boolean;
}

export function SubtaskList({
    taskId,
    subtasks,
    onToggleSubtask,
    onAddSubtask,
    onDeleteSubtask,
    onUpdateSubtask,
    editable = true,
}: SubtaskListProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingMinutes, setEditingMinutes] = useState<number | undefined>(undefined);

    const completedCount = subtasks.filter(s => s.completed).length;
    const totalCount = subtasks.length;

    const handleStartEdit = (subtaskId: string, minutes?: number) => {
        setEditingId(subtaskId);
        setEditingMinutes(minutes);
    };

    const handleSaveMinutes = (subtaskId: string) => {
        if (onUpdateSubtask && editingMinutes !== undefined) {
            onUpdateSubtask(subtaskId, { estimatedMinutes: editingMinutes });
        }
        setEditingId(null);
        setEditingMinutes(undefined);
    };

    return (
        <div className="space-y-2">
            {/* Progress header */}
            {totalCount > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Subtasks ({completedCount}/{totalCount})</span>
                    {totalCount > 0 && (
                        <div className="flex-1 mx-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Subtask list */}
            <div className="space-y-1.5">
                {subtasks.map((subtask) => (
                    <div
                        key={subtask.id}
                        className="group flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors"
                    >
                        <button
                            onClick={() => onToggleSubtask(subtask.id)}
                            className="flex-shrink-0"
                        >
                            {subtask.completed ? (
                                <CheckCircle2 size={16} className="text-green-500" />
                            ) : (
                                <Circle size={16} className="text-gray-300 group-hover:text-gray-400" />
                            )}
                        </button>

                        <span
                            className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'
                                }`}
                        >
                            {subtask.title}
                        </span>

                        {editingId === subtask.id ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="1"
                                    max="480"
                                    value={editingMinutes || ''}
                                    onChange={(e) => setEditingMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-12 px-2 py-1 text-xs border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    autoFocus
                                />
                                <span className="text-xs text-gray-400">min</span>
                                <button
                                    onClick={() => handleSaveMinutes(subtask.id)}
                                    className="p-1 hover:bg-green-50 rounded transition-colors"
                                >
                                    <Check size={14} className="text-green-500" />
                                </button>
                            </div>
                        ) : (
                            <>
                                {subtask.estimatedMinutes && (
                                    <button
                                        onClick={() => handleStartEdit(subtask.id, subtask.estimatedMinutes)}
                                        className="text-xs text-gray-400 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                                        title="Click to edit duration"
                                    >
                                        {subtask.estimatedMinutes}m
                                        {editable && <Edit2 size={12} />}
                                    </button>
                                )}
                            </>
                        )}

                        {editable && (
                            <button
                                onClick={() => onDeleteSubtask(subtask.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
                            >
                                <X size={14} className="text-red-500" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add subtask */}
            {editable && (
                <div className="pt-2">
                    {isAdding ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (newSubtaskTitle.trim()) {
                                            onAddSubtask(newSubtaskTitle.trim());
                                            setNewSubtaskTitle('');
                                            setIsAdding(false);
                                        }
                                    }
                                }}
                                placeholder="Subtask name..."
                                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (newSubtaskTitle.trim()) {
                                        onAddSubtask(newSubtaskTitle.trim());
                                        setNewSubtaskTitle('');
                                        setIsAdding(false);
                                    }
                                }}
                                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewSubtaskTitle('');
                                }}
                                className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            <Plus size={16} />
                            Add Subtask
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
