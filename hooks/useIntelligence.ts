/**
 * useIntelligence Hook
 * Manages AI suggestions, insights, and pattern data
 */

import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types';

export interface SmartSuggestion {
    id: string;
    type:
      | 'time_block'
      | 'reschedule'
      | 'priority'
      | 'breakdown'
      | 'energy_match'
      | 'overload_warning'
      | 'stale_task'
      | 'dependency_ready'
      | 'focus_recommendation'
      | 'daily_plan';
    taskId: string | null;
    title: string;
    description: string | null;
    action: {
        type: string;
        targetTimeBlock?: string;
        targetPriority?: string;
        targetDate?: string;
        suggestedSubtasks?: string[];
        taskIds?: string[];
    };
    reasoning: string | null;
    confidence: number;
    source: 'rule' | 'pattern' | 'ai';
    status: 'pending' | 'accepted' | 'dismissed' | 'expired';
    createdAt: string;
    expiresAt: string | null;
}

export interface UserInsight {
    id: string;
    insightType: string;
    category: string | null;
    pattern: unknown;
    confidence: number;
    sampleSize: number;
    lastUpdated: string;
}

interface UseIntelligenceProps {
    isAuthenticated: boolean;
    tasks?: Task[];
}

// Snooze storage helpers
const SNOOZE_STORAGE_KEY = 'dopatika_snoozed_suggestions';

function getSnoozedSuggestions(): Record<string, number> {
    if (typeof window === 'undefined') return {};
    try {
        const stored = window.localStorage.getItem(SNOOZE_STORAGE_KEY);
        if (!stored) return {};
        const parsed = JSON.parse(stored);
        // Clean up expired snoozes
        const now = Date.now();
        const active: Record<string, number> = {};
        for (const [id, expiresAt] of Object.entries(parsed)) {
            if (typeof expiresAt === 'number' && expiresAt > now) {
                active[id] = expiresAt;
            }
        }
        return active;
    } catch {
        return {};
    }
}

function setSnoozedSuggestion(suggestionId: string, durationMs: number) {
    const current = getSnoozedSuggestions();
    current[suggestionId] = Date.now() + durationMs;
    window.localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(current));
}

function isSuggestionSnoozed(suggestionId: string): boolean {
    const snoozed = getSnoozedSuggestions();
    const expiresAt = snoozed[suggestionId];
    return typeof expiresAt === 'number' && expiresAt > Date.now();
}

export function useIntelligence({ isAuthenticated, tasks = [] }: UseIntelligenceProps) {
    const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
    const [insights, setInsights] = useState<UserInsight[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastFetch, setLastFetch] = useState<number>(0);
    const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());

    // Fetch suggestions from API
    const fetchSuggestions = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            setLoading(true);
            const [suggestionsRes, insightsRes] = await Promise.all([
                fetch('/api/intelligence'),
                fetch('/api/intelligence?type=insights'),
            ]);

            if (!suggestionsRes.ok) throw new Error('Failed to fetch suggestions');

            const suggestionsData = await suggestionsRes.json();
            const insightsData = insightsRes.ok ? await insightsRes.json() : [];

            const suggestionsList = Array.isArray(suggestionsData)
                ? suggestionsData
                : suggestionsData?.suggestions || [];

            // Filter to only pending suggestions
            const pending = suggestionsList.filter(
                (s: SmartSuggestion) => s.status === 'pending'
            );
            
            setSuggestions(pending);
            setInsights(Array.isArray(insightsData) ? insightsData : insightsData?.insights || []);
            setLastFetch(Date.now());
        } catch (err) {
            console.error('Failed to fetch intelligence:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Accept a suggestion
    const acceptSuggestion = useCallback(async (suggestionId: string) => {
        try {
            const res = await fetch(`/api/intelligence/suggestions/${suggestionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accepted: true }),
            });

            if (res.ok) {
                // Remove from local state
                setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
            }
        } catch (err) {
            console.error('Failed to accept suggestion:', err);
        }
    }, []);

    // Dismiss a suggestion
    const dismissSuggestion = useCallback(async (suggestionId: string) => {
        try {
            const res = await fetch(`/api/intelligence/suggestions/${suggestionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accepted: false }),
            });

            if (res.ok) {
                // Remove from local state
                setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
            }
        } catch (err) {
            console.error('Failed to dismiss suggestion:', err);
        }
    }, []);

    // Snooze a suggestion for a duration (client-side only)
    const snoozeSuggestion = useCallback((suggestionId: string, durationMs: number = 60 * 60 * 1000) => {
        setSnoozedSuggestion(suggestionId, durationMs);
        setSnoozedIds(prev => {
            const next = new Set(prev);
            next.add(suggestionId);
            return next;
        });
    }, []);

    // Check if a suggestion is snoozed
    const isSnoozing = useCallback((suggestionId: string) => {
        return snoozedIds.has(suggestionId) || isSuggestionSnoozed(suggestionId);
    }, [snoozedIds]);

    // Load snoozed IDs on mount
    useEffect(() => {
        const snoozed = getSnoozedSuggestions();
        setSnoozedIds(new Set(Object.keys(snoozed)));
    }, []);

    // Filter out snoozed suggestions
    const activeSuggestions = suggestions.filter(s => !isSuggestionSnoozed(s.id));

    // Generate new suggestions based on current tasks
    const generateSuggestions = useCallback(async () => {
        if (!isAuthenticated || tasks.length === 0) return;

        try {
            const res = await fetch('/api/intelligence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks }),
            });

            if (res.ok) {
                await fetchSuggestions();
            }
        } catch (err) {
            console.error('Failed to generate suggestions:', err);
        }
    }, [isAuthenticated, tasks, fetchSuggestions]);

    // Get suggestions for a specific task
    const getSuggestionsForTask = useCallback((taskId: string) => {
        return suggestions.filter(s => s.taskId === taskId);
    }, [suggestions]);

    // Get suggestions for a specific time block
    const getSuggestionsForTimeBlock = useCallback((timeBlock: string, date: string) => {
        return suggestions.filter(s => {
            if (!s.taskId || !tasks) return false;
            const task = tasks.find(t => t.id === s.taskId);
            return task && task.timeBlock === timeBlock && task.date === date;
        });
    }, [suggestions, tasks]);

    // Auto-fetch on mount and when tasks change significantly
    useEffect(() => {
        if (isAuthenticated) {
            fetchSuggestions();
        }
    }, [isAuthenticated, fetchSuggestions]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(() => {
            const timeSinceLastFetch = Date.now() - lastFetch;
            if (timeSinceLastFetch > 5 * 60 * 1000) { // 5 minutes
                fetchSuggestions();
            }
        }, 60 * 1000); // Check every minute

        return () => clearInterval(interval);
    }, [isAuthenticated, lastFetch, fetchSuggestions]);

    return {
        suggestions: activeSuggestions,
        insights,
        loading,
        fetchSuggestions,
        acceptSuggestion,
        dismissSuggestion,
        snoozeSuggestion,
        isSnoozing,
        generateSuggestions,
        getSuggestionsForTask,
        getSuggestionsForTimeBlock,
    };
}
