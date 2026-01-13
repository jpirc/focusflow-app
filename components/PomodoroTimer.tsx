/**
 * PomodoroTimer Component
 * Floating timer widget with circular progress ring
 * Draggable, minimizable, ADHD-friendly
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Minimize2, Maximize2, Coffee, Zap, Settings, Clock } from 'lucide-react';
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
                    className={`w-20 h-20 rounded-full shadow-2xl flex items-center justify-center ${colors.bg} ${colors.border} border-3 hover:scale-110 transition-transform relative`}
                    onMouseDown={handleMouseDown}
                >
                    <div className="text-center">
                        <div className={`text-lg font-bold ${colors.text} tabular-nums`}>{timeDisplay.split(':')[0]}</div>
                        <div className="flex gap-1 justify-center mt-1">
                            {pomodoroDisplay}
                        </div>
                    </div>
                    {/* Pulsing ring animation */}
                    {!isPaused && (
                        <div className={`absolute inset-0 rounded-full ${colors.border} border-2 animate-ping opacity-20`} />
                    )}
                </button>
            ) : (
                // Full widget - enlarged and more informative
                <div
                    className={`w-[420px] rounded-3xl shadow-2xl ${colors.bg} ${colors.border} border-3 overflow-hidden`}
                    onMouseDown={handleMouseDown}
                >
                    {/* Header */}
                    <div className={`px-5 py-3 bg-gradient-to-r ${isBreak ? 'from-green-100 to-blue-100' : 'from-red-100 to-orange-100'} border-b-2 ${colors.border} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            {isBreak ? (
                                <Coffee size={20} className={colors.text} />
                            ) : (
                                <Zap size={20} className={colors.text} />
                            )}
                            <span className={`text-sm font-bold ${colors.text} uppercase tracking-wide`}>
                                {isPaused ? 'Paused' : isBreak ? (timerState === 'long-break' ? 'Long Break' : 'Short Break') : 'Focus Mode'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                                title="Settings"
                            >
                                <Settings size={16} className="text-gray-600" />
                            </button>
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                                title="Minimize"
                            >
                                <Minimize2 size={16} className="text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6">
                        {/* Task Info */}
                        {currentTask && !isBreak && (
                            <div className="mb-4 bg-white/60 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                                        <Zap size={20} className={colors.text} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2" title={currentTask.title}>
                                            {currentTask.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            {currentTask.estimatedMinutes && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {currentTask.estimatedMinutes}m est.
                                                </span>
                                            )}
                                            {currentTask.actualMinutes && currentTask.actualMinutes > 0 && (
                                                <span>• {currentTask.actualMinutes}m logged</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timer Display with Progress Ring */}
                        <div className="flex flex-col items-center mb-4">
                            {/* Circular Progress Ring */}
                            <div className="relative w-48 h-48 mb-4">
                                <svg className="w-full h-full -rotate-90">
                                    {/* Background circle */}
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke="#e5e7eb"
                                        strokeWidth="8"
                                        fill="none"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke={colors.ring}
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                    />
                                </svg>
                                {/* Time in center */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`text-5xl font-bold ${colors.text} tabular-nums`}>
                                        {timeDisplay}
                                    </div>
                                </div>
                            </div>

                            {/* Pomodoro Progress Indicator */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-600 font-medium">Session</span>
                                <div className="flex gap-2">
                                    {Array.from({ length: settings.pomodorosUntilLongBreak }, (_, i) => (
                                        <div
                                            key={i}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                                i < sessionNumber - 1
                                                    ? 'bg-red-500 text-white scale-100' // Completed
                                                    : i === sessionNumber - 1
                                                    ? `${colors.bg} ${colors.text} ${colors.border} border-2 scale-110 ring-2 ring-offset-2 ring-red-300` // Current
                                                    : 'bg-gray-200 text-gray-400 scale-90' // Upcoming
                                            }`}
                                        >
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs text-gray-600">/ {settings.pomodorosUntilLongBreak}</span>
                            </div>

                            {/* Status text */}
                            <p className="text-sm text-gray-600 text-center">
                                {isPaused 
                                    ? '⏸ Timer paused' 
                                    : isBreak 
                                    ? '☕ Take a break and recharge' 
                                    : `🎯 Stay focused on your task`}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-3 justify-center">
                            {isPaused ? (
                                <button
                                    onClick={onResume}
                                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors font-semibold flex items-center gap-2 shadow-lg"
                                    title="Resume (Space)"
                                >
                                    <Play size={20} fill="currentColor" />
                                    Resume
                                </button>
                            ) : (
                                <button
                                    onClick={onPause}
                                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors font-semibold flex items-center gap-2 shadow-lg"
                                    title="Pause (Space)"
                                >
                                    <Pause size={20} />
                                    Pause
                                </button>
                            )}
                            <button
                                onClick={onStop}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors font-semibold flex items-center gap-2 shadow-lg"
                                title="Stop (Esc)"
                            >
                                <Square size={18} />
                                Stop
                            </button>
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
