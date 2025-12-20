import React, { useState } from 'react';
import { X } from 'lucide-react';

const PRESET_COLORS = [
    '#6366f1', // indigo (muted)
    '#8b5cf6', // violet (muted)
    '#a855f7', // purple (muted)
    '#ec4899', // pink (muted)
    '#f43f5e', // rose (muted)
    '#f97316', // coral
    '#eab308', // gold (muted)
    '#22c55e', // sage green
    '#14b8a6', // teal (muted)
    '#0ea5e9', // sky (muted)
    '#64748b', // slate
    '#78716c', // stone
];

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, color: string, icon: string) => void;
}

export function CreateProjectModal({
    isOpen,
    onClose,
    onCreate,
}: CreateProjectModalProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [icon, setIcon] = useState('folder');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name, color, icon);
            // Reset form
            setName('');
            setColor(PRESET_COLORS[0]);
            setIcon('folder');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                    <X size={18} />
                </button>

                <h2 className="text-base font-bold text-gray-900 mb-3">New Project</h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Project name..."
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Color
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                            {PRESET_COLORS.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    type="button"
                                    onClick={() => setColor(presetColor)}
                                    className={`w-7 h-7 rounded-lg transition-all ${color === presetColor
                                            ? 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                                            : 'hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: presetColor }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Icon
                        </label>
                        <div className="flex gap-1.5 flex-wrap">
                            {[
                                { id: 'folder', emoji: '📁' },
                                { id: 'briefcase', emoji: '💼' },
                                { id: 'target', emoji: '🎯' },
                                { id: 'heart', emoji: '❤️' },
                                { id: 'home', emoji: '🏠' },
                                { id: 'book', emoji: '📚' },
                                { id: 'dumbbell', emoji: '💪' },
                                { id: 'coffee', emoji: '☕' },
                            ].map((i) => (
                                <button
                                    key={i.id}
                                    type="button"
                                    onClick={() => setIcon(i.id)}
                                    className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center transition-all ${
                                        icon === i.id
                                            ? 'border-purple-400 bg-purple-50 scale-110'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {i.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
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
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
