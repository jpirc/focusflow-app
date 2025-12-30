/**
 * useCelebration Hook - Manages celebration animations and sounds
 * Provides dopamine hits when tasks are completed
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';

// Encouraging messages that rotate
const CELEBRATION_MESSAGES = [
    "Nice work!",
    "You're on fire!",
    "Crushed it!",
    "Awesome!",
    "Keep going!",
    "Boom!",
    "Nailed it!",
    "Way to go!",
    "Fantastic!",
    "You rock!",
];

// Streak milestone messages
const STREAK_MESSAGES: Record<number, string> = {
    3: "3 in a row! You're building momentum!",
    5: "5 tasks done! You're on fire!",
    10: "10 tasks! Unstoppable!",
    15: "15 tasks! Incredible focus!",
    20: "20 tasks! Legendary!",
};

interface CelebrationOptions {
    /** Enable/disable celebrations */
    enabled?: boolean;
    /** Enable/disable sound effects */
    soundEnabled?: boolean;
    /** Intensity level */
    intensity?: 'subtle' | 'normal' | 'extra';
}

interface UseCelebrationReturn {
    /** Trigger a celebration */
    celebrate: (streakCount?: number) => void;
    /** Current message being displayed (or null) */
    message: string | null;
    /** Current streak count for today */
    todayStreak: number;
    /** Increment the streak (call when task completed) */
    incrementStreak: () => number;
    /** Reset the streak (call at start of day) */
    resetStreak: () => void;
}

export function useCelebration(options: CelebrationOptions = {}): UseCelebrationReturn {
    const {
        enabled = true,
        soundEnabled = false, // Off by default, respect user preferences
        intensity = 'normal',
    } = options;

    const [message, setMessage] = useState<string | null>(null);
    const [todayStreak, setTodayStreak] = useState(0);
    const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio element for sound effects
    useEffect(() => {
        if (typeof window !== 'undefined' && soundEnabled) {
            // Create a simple completion sound using Web Audio API
            audioRef.current = new Audio('/sounds/complete.mp3');
            audioRef.current.volume = 0.3;
        }
        return () => {
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
            }
        };
    }, [soundEnabled]);

    // Load today's streak from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const today = new Date().toISOString().split('T')[0];
            const stored = localStorage.getItem('focusflow_daily_streak');
            if (stored) {
                const { date, count } = JSON.parse(stored);
                if (date === today) {
                    setTodayStreak(count);
                } else {
                    // New day, reset streak
                    localStorage.setItem('focusflow_daily_streak', JSON.stringify({ date: today, count: 0 }));
                }
            }
        }
    }, []);

    const incrementStreak = useCallback(() => {
        const newCount = todayStreak + 1;
        setTodayStreak(newCount);

        // Persist to localStorage
        if (typeof window !== 'undefined') {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem('focusflow_daily_streak', JSON.stringify({ date: today, count: newCount }));
        }

        return newCount;
    }, [todayStreak]);

    const resetStreak = useCallback(() => {
        setTodayStreak(0);
        if (typeof window !== 'undefined') {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem('focusflow_daily_streak', JSON.stringify({ date: today, count: 0 }));
        }
    }, []);

    const celebrate = useCallback((streakCount?: number) => {
        if (!enabled) return;

        const count = streakCount ?? todayStreak;

        // Clear any existing message timeout
        if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current);
        }

        // Choose message - milestone or random
        let celebrationMessage: string;
        if (count > 0 && STREAK_MESSAGES[count]) {
            celebrationMessage = STREAK_MESSAGES[count];
        } else {
            celebrationMessage = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
        }
        setMessage(celebrationMessage);

        // Play sound if enabled
        if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
                // Ignore audio play errors (user hasn't interacted yet, etc.)
            });
        }

        // Fire confetti based on intensity and milestones
        const isMilestone = count > 0 && STREAK_MESSAGES[count];

        if (intensity === 'subtle') {
            // Subtle: small burst from the center-bottom
            confetti({
                particleCount: isMilestone ? 50 : 20,
                spread: 40,
                origin: { y: 0.9, x: 0.5 },
                colors: ['#a855f7', '#3b82f6', '#22c55e'],
                scalar: 0.8,
                gravity: 1.2,
            });
        } else if (intensity === 'normal') {
            // Normal: nice burst from both sides
            const defaults = {
                spread: 60,
                ticks: 100,
                gravity: 1,
                decay: 0.94,
                startVelocity: 20,
                colors: ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899'],
            };

            confetti({
                ...defaults,
                particleCount: isMilestone ? 60 : 30,
                origin: { x: 0.3, y: 0.7 },
            });
            confetti({
                ...defaults,
                particleCount: isMilestone ? 60 : 30,
                origin: { x: 0.7, y: 0.7 },
            });
        } else if (intensity === 'extra') {
            // Extra: full celebration!
            const duration = isMilestone ? 2000 : 1000;
            const animationEnd = Date.now() + duration;

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    return;
                }

                confetti({
                    particleCount: 3,
                    angle: randomInRange(55, 125),
                    spread: randomInRange(50, 70),
                    origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
                    colors: ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'],
                });
            }, 50);
        }

        // Clear message after delay
        messageTimeoutRef.current = setTimeout(() => {
            setMessage(null);
        }, isMilestone ? 3000 : 2000);

    }, [enabled, soundEnabled, intensity, todayStreak]);

    return {
        celebrate,
        message,
        todayStreak,
        incrementStreak,
        resetStreak,
    };
}
