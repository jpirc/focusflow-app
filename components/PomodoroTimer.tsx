/**
 * PomodoroTimer Component
 * Floating timer widget with circular progress ring
 * Draggable, minimizable, ADHD-friendly
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Minimize2, Maximize2, Coffee, Zap, Settings } from 'lucide-react';
import { Task } from '@/types';
import { Theme } from '@/lib/themes';
import { PomodoroSettingsModal } from './PomodoroSettingsModal';
import { PomodoroSettings } from '@/hooks/usePomodoro';

interface PomodoroTimerProps {
    // Timer state from usePomodoro hook
    timerState: 'idle' | 'work' | 'short-break' | 'long-break' | 'paused';
    isActive: boolean;
    isPaused: boolean;
    timeRemaining: number; // seconds
    currentTask: Task | null;
    sessionNumber: number;
    
    // Actions
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    
    // Settings
    settings: PomodoroSettings;
    updateSettings: (updates: Partial<PomodoroSettings>) => Promise<void>;
    
    // Theme
    theme?: Theme;
}

export function PomodoroTimer({
    timerState,
    isActive,
    isPaused,
    timeRemaining,
    currentTask,
    sessionNumber,
    onPause,
    onResume,
    onStop,
    settings,
    updateSettings,
    theme,
}: PomodoroTimerProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showSettings, setShowSettings] = useState(false);
    const timerRef = useRef<HTMLDivElement>(null);

    // Initialize position from localStorage or default to bottom-right
    useEffect(() => {
        const savedPosition = localStorage.getItem('pomodoroPosition');
        if (savedPosition) {
            setPosition(JSON.parse(savedPosition));
        } else {
            // Default to bottom-right (24px from edges)
            setPosition({
                x: window.innerWidth - 200,
                y: window.innerHeight - 200,
            });
        }
    }, []);

    // Save position to localStorage when it changes
    useEffect(() => {
        if (position.x !== 0 || position.y !== 0) {
            localStorage.setItem('pomodoroPosition', JSON.stringify(position));
        }
    }, [position]);

    // Handle dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!timerRef.current) return;
        
        const rect = timerRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!isActive) return;

            // Space = pause/resume
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                if (isPaused) {
                    onResume();
                } else {
                    onPause();
                }
            }

            // Escape = stop (with confirmation)
            if (e.code === 'Escape') {
                if (confirm('Stop this pomodoro?')) {
                    onStop();
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [isActive, isPaused, onPause, onResume, onStop]);

    // Don't render if idle
    if (timerState === 'idle') return null;

    // Format time as MM:SS
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Determine colors based on state
    const isBreak = timerState === 'short-break' || timerState === 'long-break';
    const colors = isPaused
        ? { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', ring: '#9ca3af' }
        : isBreak
        ? { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', ring: '#22c55e' }
        : { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', ring: '#ef4444' };

    // Calculate progress for circular ring
    const totalDuration = timerState === 'work' ? 25 * 60 : timerState === 'long-break' ? 15 * 60 : 5 * 60;
    const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;
    const circumference = 2 * Math.PI * 58; // radius = 58
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Pomodoro count indicator
    const pomodoroDisplay = Array.from({ length: 4 }, (_, i) => (
        <div
            key={i}
            className={`w-2 h-2 rounded-full ${
                i < sessionNumber ? 'bg-red-500' : 'bg-gray-300'
            }`}
        />
    ));

    return (
        <div
            ref={timerRef}
            className={`fixed z-[1000] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transition: isDragging ? 'none' : 'all 0.2s ease',
            }}
        >
            {isMinimized ? (
                // Minimized FAB
                <button
                    onClick={() => setIsMinimized(false)}
                    className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center ${colors.bg} ${colors.border} border-2 hover:scale-110 transition-transform`}
                    onMouseDown={handleMouseDown}
                >
                    <div className="text-center">
                        <div className={`text-sm font-bold ${colors.text}`}>{timeDisplay.split(':')[0]}</div>
                        <div className="flex gap-0.5 justify-center mt-0.5">
                            {pomodoroDisplay}
                        </div>
                    </div>
                </button>
            ) : (
                // Full widget
                <div
                    className={`w-44 rounded-2xl shadow-2xl ${colors.bg} ${colors.border} border-2 overflow-hidden`}
                    onMouseDown={handleMouseDown}
                >
                    {/* Header */}
                    <div className="px-3 py-2 bg-white/50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {isBreak ? (
                                <Coffee size={14} className={colors.text} />
                            ) : (
                                <Zap size={14} className={colors.text} />
                            )}
                            <span className={`text-xs font-semibold ${colors.text}`}>
                                {isPaused ? 'Paused' : isBreak ? 'Break Time' : 'Focus'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-1 hover:bg-white/50 rounded"
                                title="Settings"
                            >
                                <Settings size={12} className="text-gray-500" />
                            </button>
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-1 hover:bg-white/50 rounded"
                            >
                                <Minimize2 size={12} className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Timer Display */}
                    <div className="p-4 flex flex-col items-center">
                        {/* Circular Progress Ring */}
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90">
                                {/* Background circle */}
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    stroke="#e5e7eb"
                                    strokeWidth="6"
                                    fill="none"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    stroke={colors.ring}
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                />
                            </svg>
                            {/* Time in center */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`text-3xl font-bold ${colors.text} tabular-nums`}>
                                    {timeDisplay}
                                </div>
                            </div>
                        </div>

                        {/* Task Name */}
                        {currentTask && !isBreak && (
                            <div className="mt-3 text-center">
                                <p className="text-xs text-gray-600 truncate max-w-[140px]" title={currentTask.title}>
                                    {currentTask.title}
                                </p>
                            </div>
                        )}

                        {/* Pomodoro Count */}
                        <div className="mt-3 flex gap-1.5">
                            {pomodoroDisplay}
                        </div>

                        {/* Controls */}
                        <div className="mt-4 flex gap-2">
                            {isPaused ? (
                                <button
                                    onClick={onResume}
                                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                    title="Resume (Space)"
                                >
                                    <Play size={18} fill="currentColor" />
                                </button>
                            ) : (
                                <button
                                    onClick={onPause}
                                    className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                                    title="Pause (Space)"
                                >
                                    <Pause size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (confirm('Stop this pomodoro?')) {
                                        onStop();
                                    }
                                }}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                title="Stop (Esc)"
                            >
                                <Square size={18} />
                            </button>
                        </div>

                        {/* Keyboard hints */}
                        <div className="mt-3 text-[10px] text-gray-500 text-center">
                            Space: Pause • Esc: Stop
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            <PomodoroSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={settings}
                onSave={updateSettings}
            />
        </div>
    );
}
