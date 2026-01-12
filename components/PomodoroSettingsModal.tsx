/**
 * PomodoroSettingsModal - Customize timer durations and preferences
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PomodoroSettings } from '@/hooks/usePomodoro';

interface PomodoroSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: PomodoroSettings;
    onSave: (updates: Partial<PomodoroSettings>) => Promise<void>;
}

export const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSave,
}) => {
    const [workDuration, setWorkDuration] = useState(settings.workDuration);
    const [shortBreakDuration, setShortBreakDuration] = useState(settings.shortBreakDuration);
    const [longBreakDuration, setLongBreakDuration] = useState(settings.longBreakDuration);
    const [pomodorosUntilLongBreak, setPomodorosUntilLongBreak] = useState(settings.pomodorosUntilLongBreak);
    const [autoStartBreaks, setAutoStartBreaks] = useState(settings.autoStartBreaks);
    const [autoStartPomodoros, setAutoStartPomodoros] = useState(settings.autoStartPomodoros);
    const [saving, setSaving] = useState(false);

    // Update local state when settings prop changes
    useEffect(() => {
        setWorkDuration(settings.workDuration);
        setShortBreakDuration(settings.shortBreakDuration);
        setLongBreakDuration(settings.longBreakDuration);
        setPomodorosUntilLongBreak(settings.pomodorosUntilLongBreak);
        setAutoStartBreaks(settings.autoStartBreaks);
        setAutoStartPomodoros(settings.autoStartPomodoros);
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                workDuration,
                shortBreakDuration,
                longBreakDuration,
                pomodorosUntilLongBreak,
                autoStartBreaks,
                autoStartPomodoros,
            });
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 text-gray-900"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Pomodoro Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Timer Durations */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Timer Durations</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                    Work Duration
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="5"
                                        max="60"
                                        step="5"
                                        value={workDuration}
                                        onChange={(e) => setWorkDuration(Number(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                    />
                                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                                        {workDuration} min
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                    Short Break
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="15"
                                        step="1"
                                        value={shortBreakDuration}
                                        onChange={(e) => setShortBreakDuration(Number(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                                    />
                                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                                        {shortBreakDuration} min
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                    Long Break
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="5"
                                        max="30"
                                        step="5"
                                        value={longBreakDuration}
                                        onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                                        {longBreakDuration} min
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                    Pomodoros Until Long Break
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="2"
                                        max="8"
                                        step="1"
                                        value={pomodorosUntilLongBreak}
                                        onChange={(e) => setPomodorosUntilLongBreak(Number(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                                        {pomodorosUntilLongBreak}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Auto-start Preferences */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Auto-start</h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoStartBreaks}
                                    onChange={(e) => setAutoStartBreaks(e.target.checked)}
                                    className="w-4 h-4 text-red-500 rounded focus:ring-2 focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700">Auto-start breaks</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoStartPomodoros}
                                    onChange={(e) => setAutoStartPomodoros(e.target.checked)}
                                    className="w-4 h-4 text-red-500 rounded focus:ring-2 focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700">Auto-start pomodoros after breaks</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};
