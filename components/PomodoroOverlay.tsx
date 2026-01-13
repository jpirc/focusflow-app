/**
 * PomodoroOverlay Component
 * Persistent visual indicator for Pomodoro state
 * Provides subtle/full overlay modes with color-coded states
 */

'use client';

import React from 'react';
import { Coffee, Zap, Pause } from 'lucide-react';

type OverlayMode = 'off' | 'subtle' | 'full';
type TimerState = 'idle' | 'work' | 'short-break' | 'long-break' | 'paused';

interface PomodoroOverlayProps {
    timerState: TimerState;
    isActive: boolean;
    isPaused: boolean;
    timeRemaining: number; // seconds
    mode: OverlayMode;
}

export function PomodoroOverlay({
    timerState,
    isActive,
    isPaused,
    timeRemaining,
    mode,
}: PomodoroOverlayProps) {
    const willShow = !(mode === 'off' || timerState === 'idle' || (!isActive && !isPaused));
    
    // Debug logging
    if (timerState !== 'idle') {
        console.log('PomodoroOverlay render:', { 
            timerState, 
            isActive, 
            isPaused, 
            timeRemaining, 
            mode,
            willShow
        });
    }
    
    // Don't show overlay if mode is off or timer is idle
    // Show overlay if paused OR active (paused should still display)
    if (!willShow) {
        return null;
    }

    const isBreak = timerState === 'short-break' || timerState === 'long-break';

    // Format time display
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Color schemes based on state
    const getColorScheme = () => {
        if (isPaused) {
            return {
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/30',
                text: 'text-yellow-700',
                accent: 'bg-yellow-500',
                icon: <Pause size={16} className="text-yellow-600" />,
                label: 'Paused',
            };
        }
        
        if (isBreak) {
            return {
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/30',
                text: 'text-blue-700',
                accent: 'bg-blue-500',
                icon: <Coffee size={16} className="text-blue-600" />,
                label: timerState === 'long-break' ? 'Long Break' : 'Break',
            };
        }
        
        // Work mode
        return {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            text: 'text-red-700',
            accent: 'bg-red-500',
            icon: <Zap size={16} className="text-red-600" />,
            label: 'Focus',
        };
    };

    const colors = getColorScheme();

    if (mode === 'subtle') {
        return (
            <>
                {/* Top border indicator */}
                <div className={`fixed top-0 left-0 right-0 h-1 ${colors.accent} z-50 shadow-lg`} />
                
                {/* Floating timer badge - top right, larger and more visible */}
                <div className="fixed top-20 right-6 z-50 pointer-events-none">
                    <div className={`${colors.bg} ${colors.border} border-3 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-sm`}>
                        <div className="flex items-center gap-3">
                            {colors.icon}
                            <div className="flex flex-col">
                                <span className={`text-xs font-medium ${colors.text} opacity-80`}>
                                    {colors.label}
                                </span>
                                <span className={`text-2xl font-bold ${colors.text} tabular-nums leading-tight`}>
                                    {timeDisplay}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Full overlay mode
    return (
        <div className="fixed inset-0 pointer-events-none z-40">
            {/* Border overlay */}
            <div className={`absolute inset-0 border-[6px] ${colors.border} pointer-events-none rounded-lg`} />
            
            {/* Corner accents */}
            <div className={`absolute top-0 left-0 w-32 h-32 ${colors.accent} opacity-30 blur-3xl`} />
            <div className={`absolute top-0 right-0 w-32 h-32 ${colors.accent} opacity-30 blur-3xl`} />
            <div className={`absolute bottom-0 left-0 w-32 h-32 ${colors.accent} opacity-30 blur-3xl`} />
            <div className={`absolute bottom-0 right-0 w-32 h-32 ${colors.accent} opacity-30 blur-3xl`} />
            
            {/* Top status bar with large timer */}
            <div className={`absolute top-0 left-0 right-0 ${colors.bg} backdrop-blur-md border-b-4 ${colors.border} pointer-events-none shadow-2xl`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="scale-125">{colors.icon}</div>
                        <div className="flex flex-col">
                            <span className={`text-xs font-medium ${colors.text} opacity-70 uppercase tracking-wide`}>
                                {colors.label}
                            </span>
                            <span className={`text-4xl font-bold ${colors.text} tabular-nums leading-tight`}>
                                {timeDisplay}
                            </span>
                        </div>
                    </div>
                    <div className={`text-sm ${colors.text} opacity-60 font-medium`}>
                        {isPaused ? '⏸ Paused' : isBreak ? '☕ Relax' : '🎯 Focus Mode'}
                    </div>
                </div>
            </div>
        </div>
    );
}
