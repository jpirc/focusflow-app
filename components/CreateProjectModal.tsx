import React, { useState, useEffect } from 'react';
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

const PROJECT_ICONS = [
    // Work & Business
    { id: 'briefcase', emoji: '💼', label: 'Briefcase' },
    { id: 'laptop', emoji: '💻', label: 'Laptop' },
    { id: 'chart', emoji: '📊', label: 'Chart' },
    { id: 'calendar', emoji: '📅', label: 'Calendar' },
    { id: 'clipboard', emoji: '📋', label: 'Clipboard' },
    { id: 'phone', emoji: '📱', label: 'Phone' },
    { id: 'email', emoji: '📧', label: 'Email' },
    { id: 'rocket', emoji: '🚀', label: 'Rocket' },
    
    // Learning & Knowledge
    { id: 'book', emoji: '📚', label: 'Books' },
    { id: 'graduation', emoji: '🎓', label: 'Graduation' },
    { id: 'lightbulb', emoji: '💡', label: 'Idea' },
    { id: 'pencil', emoji: '✏️', label: 'Pencil' },
    { id: 'notebook', emoji: '📓', label: 'Notebook' },
    { id: 'microscope', emoji: '🔬', label: 'Science' },
    
    // Life & Health
    { id: 'heart', emoji: '❤️', label: 'Heart' },
    { id: 'dumbbell', emoji: '💪', label: 'Fitness' },
    { id: 'apple', emoji: '🍎', label: 'Health' },
    { id: 'yoga', emoji: '🧘', label: 'Meditation' },
    { id: 'running', emoji: '🏃', label: 'Running' },
    { id: 'bicycle', emoji: '🚴', label: 'Cycling' },
    
    // Home & Family
    { id: 'home', emoji: '🏠', label: 'Home' },
    { id: 'family', emoji: '👨‍👩‍👧‍👦', label: 'Family' },
    { id: 'baby', emoji: '👶', label: 'Baby' },
    { id: 'pet', emoji: '🐕', label: 'Pet' },
    { id: 'plant', emoji: '🌱', label: 'Garden' },
    { id: 'cooking', emoji: '🍳', label: 'Cooking' },
    
    // Creative & Hobbies
    { id: 'art', emoji: '🎨', label: 'Art' },
    { id: 'music', emoji: '🎵', label: 'Music' },
    { id: 'camera', emoji: '📷', label: 'Photo' },
    { id: 'game', emoji: '🎮', label: 'Gaming' },
    { id: 'guitar', emoji: '🎸', label: 'Guitar' },
    { id: 'movie', emoji: '🎬', label: 'Film' },
    
    // Finance & Money
    { id: 'money', emoji: '💰', label: 'Money' },
    { id: 'bank', emoji: '🏦', label: 'Bank' },
    { id: 'chart-up', emoji: '📈', label: 'Growth' },
    { id: 'piggy', emoji: '🐷', label: 'Savings' },
    { id: 'credit-card', emoji: '💳', label: 'Card' },
    
    // Goals & Targets
    { id: 'target', emoji: '🎯', label: 'Target' },
    { id: 'trophy', emoji: '🏆', label: 'Trophy' },
    { id: 'star', emoji: '⭐', label: 'Star' },
    { id: 'fire', emoji: '🔥', label: 'Fire' },
    { id: 'gem', emoji: '💎', label: 'Gem' },
    { id: 'crown', emoji: '👑', label: 'Crown' },
    
    // Travel & Adventure
    { id: 'plane', emoji: '✈️', label: 'Travel' },
    { id: 'world', emoji: '🌍', label: 'World' },
    { id: 'beach', emoji: '🏖️', label: 'Beach' },
    { id: 'mountain', emoji: '⛰️', label: 'Mountain' },
    { id: 'camping', emoji: '🏕️', label: 'Camping' },
    
    // General & Misc
    { id: 'folder', emoji: '📁', label: 'Folder' },
    { id: 'coffee', emoji: '☕', label: 'Coffee' },
    { id: 'pizza', emoji: '🍕', label: 'Food' },
    { id: 'gift', emoji: '🎁', label: 'Gift' },
    { id: 'balloon', emoji: '🎈', label: 'Party' },
    { id: 'sunny', emoji: '☀️', label: 'Sunny' },
    { id: 'moon', emoji: '🌙', label: 'Night' },
    { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
];

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, color: string, icon: string) => void;
    editProject?: { id: string; name: string; color: string; icon: string } | null;
    onUpdate?: (id: string, name: string, color: string, icon: string) => void;
}

export function CreateProjectModal({
    isOpen,
    onClose,
    onCreate,
    editProject,
    onUpdate,
}: CreateProjectModalProps) {
    const [name, setName] = useState(editProject?.name || '');
    const [color, setColor] = useState(editProject?.color || PRESET_COLORS[0]);
    const [icon, setIcon] = useState(editProject?.icon || 'folder');

    // Update form when editProject changes
    useEffect(() => {
        if (editProject) {
            setName(editProject.name);
            setColor(editProject.color);
            setIcon(editProject.icon);
        } else {
            setName('');
            setColor(PRESET_COLORS[0]);
            setIcon('folder');
        }
    }, [editProject]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            if (editProject && onUpdate) {
                onUpdate(editProject.id, name, color, icon);
            } else {
                onCreate(name, color, icon);
            }
            // Reset form
            setName('');
            setColor(PRESET_COLORS[0]);
            setIcon('folder');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 shadow-2xl w-full max-w-sm p-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                    <X size={18} />
                </button>

                <h2 className="text-base font-bold text-gray-900 mb-3">{editProject ? 'Edit Project' : 'New Project'}</h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Project name..."
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Color
                        </label>
                        <div className="grid grid-cols-6 gap-1.5 mb-2">
                            {PRESET_COLORS.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    type="button"
                                    onClick={() => setColor(presetColor)}
                                    className={`w-7 h-7 transition-all ${
                                        color === presetColor
                                            ? 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                                            : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: presetColor }}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">Custom:</label>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-7 w-16 rounded cursor-pointer border border-gray-300"
                            />
                            <input
                                type="text"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                placeholder="#000000"
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                                maxLength={7}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Icon
                        </label>
                        <div className="max-h-48 overflow-y-auto border border-gray-200 p-2">
                            <div className="grid grid-cols-8 gap-1.5">
                                {PROJECT_ICONS.map((i) => (
                                    <button
                                        key={i.id}
                                        type="button"
                                        onClick={() => setIcon(i.id)}
                                        className={`w-8 h-8 border text-sm flex items-center justify-center transition-all ${
                                            icon === i.id
                                                ? 'border-purple-400 bg-purple-50 scale-110'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        title={i.label}
                                    >
                                        {i.emoji}
                                    </button>
                                ))}
                            </div>
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
                            {editProject ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
