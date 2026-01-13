/**
 * usePomodoro Hook - Manages Pomodoro timer state and operations
 * 
 * Features:
 * - Accurate countdown timer (no drift)
 * - Work/break cycle management
 * - Session tracking and persistence
 * - Integration with task management
 * - User settings management
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Task } from '@/types';

// ============================================
// TYPES
// ============================================

export type TimerState = 'idle' | 'work' | 'short-break' | 'long-break' | 'paused';
export type OverlayMode = 'off' | 'subtle' | 'full';

export interface PomodoroSettings {
    workDuration: number;          // minutes
    shortBreakDuration: number;    // minutes
    longBreakDuration: number;     // minutes
    pomodorosUntilLongBreak: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    soundEnabled: boolean;
    soundVolume: number;           // 0-1
    desktopNotifications: boolean;
    ambientSound?: string | null;
    ambientVolume: number;         // 0-1
    overlayMode: OverlayMode;      // visual overlay indicator
    testMode: boolean;             // 15s work / 5s break for testing
}

export interface PomodoroSessionData {
    sessionId?: string;
    taskId?: string;
    startedAt: Date;
    endedAt?: Date;
    plannedDuration: number;       // minutes
    actualDuration?: number;       // minutes
    completed: boolean;
    abandoned: boolean;
    pausedDuration: number;        // seconds
    breakTaken: boolean;
    breakType?: 'short' | 'long';
    breakDuration?: number;        // minutes
    sessionNumber: number;
    timeOfDay: number;             // 0-23
}

export interface TodayStats {
    completed: number;             // completed pomodoros
    abandoned: number;             // abandoned pomodoros
    totalMinutes: number;          // actual work time
    currentStreak: number;         // consecutive completed pomodoros today
}

interface UsePomodoroOptions {
    isAuthenticated: boolean;
    onPomodoroComplete?: (sessionData: PomodoroSessionData) => void;
    onBreakComplete?: () => void;
    /** Called when starting a pomodoro on a task - receives taskId and should update task status to in-progress */
    onTaskStart?: (taskId: string) => void;
    /** Called when a session completes or is abandoned - to refresh task data (actualMinutes) */
    onSessionComplete?: () => void;
}

interface UsePomodoroReturn {
    // Timer State
    timerState: TimerState;
    isActive: boolean;
    isPaused: boolean;
    timeRemaining: number;         // seconds
    currentTask: Task | null;
    sessionNumber: number;         // 1-4 (which pomodoro in sequence)
    totalSessionTime: number;      // total seconds elapsed in current session
    
    // Settings
    settings: PomodoroSettings;
    loadingSettings: boolean;
    updateSettings: (updates: Partial<PomodoroSettings>) => Promise<void>;
    
    // Actions
    startPomodoro: (task?: Task, customDuration?: number) => Promise<void>;
    pausePomodoro: () => void;
    resumePomodoro: () => void;
    stopPomodoro: (abandoned?: boolean) => Promise<void>;
    skipBreak: () => void;
    
    // Stats
    todayStats: TodayStats;
    loadingStats: boolean;
    
    // Internal state for debugging
    sessionStartedAt: Date | null;
}

// ============================================
// DEFAULT SETTINGS
// ============================================

const DEFAULT_SETTINGS: PomodoroSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosUntilLongBreak: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    soundEnabled: true,
    soundVolume: 0.5,
    desktopNotifications: true,
    ambientSound: null,
    ambientVolume: 0.3,
    overlayMode: 'subtle',
    testMode: false,
};

// ============================================
// HOOK
// ============================================

export function usePomodoro({ 
    isAuthenticated, 
    onPomodoroComplete,
    onBreakComplete,
    onTaskStart,
    onSessionComplete
}: UsePomodoroOptions): UsePomodoroReturn {
    
    // ============================================
    // STATE
    // ============================================
    
    const [timerState, setTimerState] = useState<TimerState>('idle');
    const [previousTimerState, setPreviousTimerState] = useState<TimerState>('idle'); // Track state before pause
    const [timeRemaining, setTimeRemaining] = useState(0); // seconds
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [sessionNumber, setSessionNumber] = useState(1); // 1-4
    const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
    const [totalPausedTime, setTotalPausedTime] = useState(0); // seconds
    const [pauseStartedAt, setPauseStartedAt] = useState<Date | null>(null);
    const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [todayStats, setTodayStats] = useState<TodayStats>({
        completed: 0,
        abandoned: 0,
        totalMinutes: 0,
        currentStreak: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    
    // Refs for accurate timing
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const endTimeRef = useRef<number | null>(null);
    const workStartTimeRef = useRef<number | null>(null);
    
    // Audio refs for sounds
    const completionSoundRef = useRef<HTMLAudioElement | null>(null);
    const breakEndSoundRef = useRef<HTMLAudioElement | null>(null);
    const tickSoundRef = useRef<HTMLAudioElement | null>(null);
    
    // Ref to always have latest handleTimerComplete (prevents stale closure in timer)
    const handleTimerCompleteRef = useRef<(() => Promise<void>) | null>(null);
    
    // ============================================
    // COMPUTED VALUES
    // ============================================
    
    const isActive = timerState === 'work' || timerState === 'short-break' || timerState === 'long-break';
    const isPaused = timerState === 'paused';
    const totalSessionTime = workStartTimeRef.current 
        ? Math.floor((Date.now() - workStartTimeRef.current) / 1000) - totalPausedTime
        : 0;
    
    // ============================================
    // FETCH SETTINGS & STATS
    // ============================================
    
    useEffect(() => {
        if (!isAuthenticated) {
            setLoadingSettings(false);
            setLoadingStats(false);
            return;
        }
        
        // Fetch user settings
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/pomodoro/settings');
                if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error('Failed to load pomodoro settings:', error);
            } finally {
                setLoadingSettings(false);
            }
        };
        
        // Fetch today's stats
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/pomodoro/stats?period=today');
                if (response.ok) {
                    const data = await response.json();
                    setTodayStats(data);
                }
            } catch (error) {
                console.error('Failed to load pomodoro stats:', error);
            } finally {
                setLoadingStats(false);
            }
        };
        
        fetchSettings();
        fetchStats();
    }, [isAuthenticated]);
    
    // Initialize sounds
    useEffect(() => {
        // Simple beep sounds using Web Audio API
        completionSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm');
        breakEndSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuT1/LNejEGLoTO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm');
        tickSoundRef.current = new Audio('data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==');
    }, []);
    
    //============================================
    // TIMER LOGIC
    // ============================================
    
    const startTimer = useCallback((durationMinutes: number) => {
        const durationMs = durationMinutes * 60 * 1000;
        endTimeRef.current = Date.now() + durationMs;
        setTimeRemaining(durationMinutes * 60);
        
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        // Use setInterval for accurate countdown (corrects for drift)
        intervalRef.current = setInterval(() => {
            if (!endTimeRef.current) return;
            
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
            
            setTimeRemaining(remaining);
            
            if (remaining <= 0) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                // Use ref to call latest version of handleTimerComplete
                handleTimerCompleteRef.current?.();
            }
        }, 100); // Check every 100ms for accuracy
    }, []);
    
    const stopTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        endTimeRef.current = null;
    }, []);
    
    // ============================================
    // TIMER COMPLETION
    // ============================================
    
    const handleTimerComplete = useCallback(async () => {
        const wasWorkSession = timerState === 'work';
        
        console.log('[Pomodoro] Timer complete:', { wasWorkSession, timerState, currentTask: currentTask?.title });
        
        if (wasWorkSession) {
            // Work session completed
            const sessionData: PomodoroSessionData = {
                sessionId: currentSessionId || undefined,
                taskId: currentTask?.id,
                startedAt: sessionStartedAt!,
                endedAt: new Date(),
                plannedDuration: settings.workDuration,
                actualDuration: settings.workDuration,
                completed: true,
                abandoned: false,
                pausedDuration: totalPausedTime,
                breakTaken: false,
                sessionNumber,
                timeOfDay: new Date().getHours(),
            };
            
            // Save session to database
            await saveSession(sessionData);
            
            // Play completion sound
            if (settings.soundEnabled) {
                playCompletionSound();
            }
            
            // Show notification
            if (settings.desktopNotifications) {
                showNotification('🍅 Pomodoro Complete!', 'Great work! Time for a break.');
            }
            
            // Update stats
            setTodayStats(prev => ({
                ...prev,
                completed: prev.completed + 1,
                totalMinutes: prev.totalMinutes + settings.workDuration,
                currentStreak: prev.currentStreak + 1,
            }));
            
            // Callback
            if (onPomodoroComplete) {
                onPomodoroComplete(sessionData);
            }
            
            // Start break
            const isLongBreak = sessionNumber >= settings.pomodorosUntilLongBreak;
            // Use 0.083 min (5s) for breaks in test mode
            const breakDuration = settings.testMode ? 0.083 : (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration);
            const breakType = isLongBreak ? 'long-break' : 'short-break';
            
            console.log('[Pomodoro] Starting break:', { breakType, breakDuration, isLongBreak, autoStartBreaks: settings.autoStartBreaks });
            
            if (settings.autoStartBreaks) {
                console.log('[Pomodoro] Setting timer state to:', breakType);
                setTimerState(breakType);
                startTimer(breakDuration);
                console.log('[Pomodoro] Break timer started');
                
                // Reset session number after long break
                if (isLongBreak) {
                    setSessionNumber(1);
                } else {
                    setSessionNumber(prev => prev + 1);
                }
            } else {
                setTimerState('idle');
                setTimeRemaining(0);
            }
            
            // Reset pause tracking
            setTotalPausedTime(0);
            setPauseStartedAt(null);
            
        } else {
            // Break completed
            if (settings.soundEnabled) {
                playBreakEndSound();
            }
            
            if (settings.desktopNotifications) {
                showNotification('☕ Break Over!', 'Ready to focus again?');
            }
            
            if (onBreakComplete) {
                onBreakComplete();
            }
            
            if (settings.autoStartPomodoros && currentTask) {
                // Auto-start next pomodoro
                setTimerState('work');
                startTimer(settings.workDuration);
                workStartTimeRef.current = Date.now();
                setSessionStartedAt(new Date());
            } else {
                setTimerState('idle');
                setTimeRemaining(0);
            }
        }
    }, [
        timerState, 
        sessionNumber, 
        settings, 
        currentTask, 
        sessionStartedAt, 
        totalPausedTime,
        currentSessionId,
        onPomodoroComplete,
        onBreakComplete
    ]);
    
    // Keep ref updated with latest callback to avoid stale closures in timer
    useEffect(() => {
        handleTimerCompleteRef.current = handleTimerComplete;
    }, [handleTimerComplete]);
    
    // ============================================
    // API INTEGRATION
    // ============================================
    
    const saveSession = async (sessionData: PomodoroSessionData): Promise<void> => {
        if (!isAuthenticated) return;
        
        try {
            const response = await fetch('/api/pomodoro/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData),
            });
            
            if (!response.ok) {
                console.error('Failed to save pomodoro session');
            } else {
                // Notify parent to refresh task data (get updated actualMinutes)
                if (onSessionComplete) {
                    onSessionComplete();
                }
            }
        } catch (error) {
            console.error('Error saving pomodoro session:', error);
        }
    };
    
    // ============================================
    // PUBLIC ACTIONS
    // ============================================
    
    const startPomodoro = useCallback(async (task?: Task, customDuration?: number) => {
        // Don't restart if there's already an active pomodoro
        if (timerState !== 'idle' && timerState !== 'paused') {
            console.log('Pomodoro already active');
            return;
        }
        
        // Use 0.25 min (15s) for work in test mode, 0.083 min (5s) for breaks
        const duration = customDuration || (settings.testMode ? 0.25 : settings.workDuration);
        
        setCurrentTask(task || null);
        setTimerState('work');
        setSessionStartedAt(new Date());
        workStartTimeRef.current = Date.now();
        setTotalPausedTime(0);
        setPauseStartedAt(null);
        
        // Notify parent to update task status to in-progress
        if (task?.id && onTaskStart) {
            onTaskStart(task.id);
        }
        
        // Create session in database
        if (isAuthenticated) {
            try {
                const response = await fetch('/api/pomodoro/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId: task?.id,
                        duration,
                    }),
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setCurrentSessionId(data.sessionId);
                }
            } catch (error) {
                console.error('Failed to start pomodoro session:', error);
            }
        }
        
        startTimer(duration);
    }, [settings.workDuration, isAuthenticated, startTimer, onTaskStart, timerState]);
    
    const pausePomodoro = useCallback(() => {
        if (timerState !== 'work' && timerState !== 'short-break' && timerState !== 'long-break') {
            return;
        }
        
        setPreviousTimerState(timerState); // Save the state before pausing
        stopTimer();
        setTimerState('paused');
        setPauseStartedAt(new Date());
        playTickSound(); // Sound feedback
    }, [timerState, stopTimer]);
    
    const resumePomodoro = useCallback(() => {
        if (timerState !== 'paused') return;
        
        // Track pause duration
        if (pauseStartedAt) {
            const pauseDuration = Math.floor((Date.now() - pauseStartedAt.getTime()) / 1000);
            setTotalPausedTime(prev => prev + pauseDuration);
        }
        setPauseStartedAt(null);
        
        // Resume timer
        const durationMs = timeRemaining * 1000;
        endTimeRef.current = Date.now() + durationMs;
        
        // Restore previous state
        setTimerState(previousTimerState);
        playTickSound(); // Sound feedback
        
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
            if (!endTimeRef.current) return;
            
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
            
            setTimeRemaining(remaining);
            
            if (remaining <= 0) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                handleTimerComplete();
            }
        }, 100);
    }, [timerState, timeRemaining, pauseStartedAt, handleTimerComplete]);
    
    const stopPomodoro = useCallback(async (abandoned: boolean = false) => {
        stopTimer();
        
        // Save session if it was a work session
        if (timerState === 'work' && sessionStartedAt) {
            const actualDuration = Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000 / 60);
            
            const sessionData: PomodoroSessionData = {
                sessionId: currentSessionId || undefined,
                taskId: currentTask?.id,
                startedAt: sessionStartedAt,
                endedAt: new Date(),
                plannedDuration: settings.workDuration,
                actualDuration,
                completed: false,
                abandoned: true,
                pausedDuration: totalPausedTime,
                breakTaken: false,
                sessionNumber,
                timeOfDay: new Date().getHours(),
            };
            
            await saveSession(sessionData);
            
            if (abandoned) {
                setTodayStats(prev => ({
                    ...prev,
                    abandoned: prev.abandoned + 1,
                    currentStreak: 0, // Break streak
                }));
            }
        }
        
        // Reset state
        setTimerState('idle');
        setTimeRemaining(0);
        setCurrentTask(null);
        setSessionStartedAt(null);
        setTotalPausedTime(0);
        setPauseStartedAt(null);
        setCurrentSessionId(null);
        workStartTimeRef.current = null;
    }, [
        timerState, 
        sessionStartedAt, 
        currentTask, 
        settings.workDuration, 
        totalPausedTime,
        sessionNumber,
        currentSessionId,
        stopTimer
    ]);
    
    const skipBreak = useCallback(() => {
        if (timerState !== 'short-break' && timerState !== 'long-break') {
            return;
        }
        
        stopTimer();
        
        if (onBreakComplete) {
            onBreakComplete();
        }
        
        setTimerState('idle');
        setTimeRemaining(0);
    }, [timerState, stopTimer, onBreakComplete]);
    
    const updateSettings = useCallback(async (updates: Partial<PomodoroSettings>) => {
        if (!isAuthenticated) return;
        
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        
        try {
            await fetch('/api/pomodoro/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
        } catch (error) {
            console.error('Failed to update pomodoro settings:', error);
            // Rollback on error
            setSettings(settings);
        }
    }, [isAuthenticated, settings]);
    
    // ============================================
    // SOUND & NOTIFICATIONS
    // ============================================
    
    const playCompletionSound = () => {
        if (settings.soundEnabled && completionSoundRef.current) {
            completionSoundRef.current.volume = settings.soundVolume;
            completionSoundRef.current.play().catch(e => console.error('Failed to play sound:', e));
        }
    };
    
    const playBreakEndSound = () => {
        if (settings.soundEnabled && breakEndSoundRef.current) {
            breakEndSoundRef.current.volume = settings.soundVolume;
            breakEndSoundRef.current.play().catch(e => console.error('Failed to play sound:', e));
        }
    };
    
    const playTickSound = () => {
        if (settings.soundEnabled && tickSoundRef.current) {
            tickSoundRef.current.volume = settings.soundVolume * 0.3; // Quieter
            tickSoundRef.current.play().catch(e => console.error('Failed to play sound:', e));
        }
    };
    
    const showNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    };
    
    // ============================================
    // CLEANUP
    // ============================================
    
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    
    // ============================================
    // RETURN
    // ============================================
    
    return {
        // State
        timerState,
        isActive,
        isPaused,
        timeRemaining,
        currentTask,
        sessionNumber,
        totalSessionTime,
        sessionStartedAt,
        
        // Settings
        settings,
        loadingSettings,
        updateSettings,
        
        // Actions
        startPomodoro,
        pausePomodoro,
        resumePomodoro,
        stopPomodoro,
        skipBreak,
        
        // Stats
        todayStats,
        loadingStats,
    };
}
