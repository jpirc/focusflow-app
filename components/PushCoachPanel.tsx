'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Brain,
    RefreshCw,
    Sparkles,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    Zap,
    MoveRight,
    Clock3,
    Loader2,
    Pencil,
    Settings,
    Clock,
} from 'lucide-react';
import { Task, Subtask, AIBreakdownSuggestion } from '@/types';
import { useIntelligence, type SmartSuggestion } from '@/hooks/useIntelligence';
import { useIntelligenceFeatures } from '@/hooks/useIntelligenceFeatures';

type SuggestionFrequency = 'minimal' | 'balanced' | 'proactive';

interface PushCoachPanelProps {
    isAuthenticated: boolean;
    tasks: Task[];
    onUpdateTask: (id: string, updates: { timeBlock?: Task['timeBlock']; date?: string | null; priority?: Task['priority'] }) => Promise<void>;
    onSelectTask: (id: string | null) => void;
    onStartNow?: (taskId: string) => Promise<void>;
    onRequestAIBreakdown: (task: Task) => void;
    onApplyAIBreakdown: (taskId: string, subtasks: Subtask[]) => Promise<void> | void;
}

const AUTO_GENERATE_COOLDOWN_MS: Record<SuggestionFrequency, number> = {
    minimal: 60 * 60 * 1000,
    balanced: 20 * 60 * 1000,
    proactive: 10 * 60 * 1000,
};
const RESCUE_DRAFT_CACHE_MS = 30 * 60 * 1000;
const RESCUE_PREFETCH_LIMIT: Record<SuggestionFrequency, number> = {
    minimal: 0,
    balanced: 1,
    proactive: 2,
};

interface RescueBreakdownDraft extends AIBreakdownSuggestion {
    reasoning?: string;
    fallback?: boolean;
    generatedAt: number;
}

function isRolloverRescueSuggestion(suggestion: SmartSuggestion, task?: Task): boolean {
    if (!task) return false;
    if (suggestion.action.type !== 'breakdown') return false;
    return (task.rolloverCount ?? 0) >= 3;
}

function getActionLabel(suggestion: SmartSuggestion): string {
    switch (suggestion.action.type) {
        case 'move_time_block':
            return `Move to ${suggestion.action.targetTimeBlock ?? 'better time'}`;
        case 'move_date':
            return 'Reschedule';
        case 'change_priority':
            return `Set ${suggestion.action.targetPriority ?? 'priority'}`;
        case 'breakdown':
            return 'Open breakdown';
        case 'focus':
            return 'Focus this';
        case 'archive':
            return 'Archive';
        default:
            return 'Accept suggestion';
    }
}

function getSuggestionAccent(type: SmartSuggestion['type']): string {
    switch (type) {
        case 'stale_task':
        case 'overload_warning':
            return 'border-amber-200 bg-amber-50/70';
        case 'dependency_ready':
        case 'focus_recommendation':
            return 'border-emerald-200 bg-emerald-50/70';
        case 'time_block':
        case 'reschedule':
            return 'border-sky-200 bg-sky-50/70';
        default:
            return 'border-violet-200 bg-violet-50/60';
    }
}

function formatFrequencyLabel(value: SuggestionFrequency) {
    if (value === 'minimal') return 'Minimal';
    if (value === 'balanced') return 'Balanced';
    return 'Proactive';
}

function getSuggestionPriorityScore(suggestion: SmartSuggestion, task?: Task): number {
    const baseByType: Record<SmartSuggestion['type'], number> = {
        breakdown: 95,
        focus_recommendation: 92,
        dependency_ready: 90,
        overload_warning: 86,
        reschedule: 82,
        time_block: 78,
        priority: 74,
        energy_match: 72,
        daily_plan: 70,
        stale_task: 68,
    };

    let score = (baseByType[suggestion.type] ?? 60) + (suggestion.confidence * 10);

    if ((task?.rolloverCount ?? 0) >= 3) score += 6;
    if (suggestion.source === 'pattern') score += 2;
    if (suggestion.source === 'ai') score += 1;
    if (suggestion.action.type === 'dismiss') score -= 8;

    return score;
}

export function PushCoachPanel({
    isAuthenticated,
    tasks,
    onUpdateTask,
    onSelectTask,
    onStartNow,
    onRequestAIBreakdown,
    onApplyAIBreakdown,
}: PushCoachPanelProps) {
    const {
        suggestions,
        loading: suggestionsLoading,
        fetchSuggestions,
        generateSuggestions,
        acceptSuggestion,
        dismissSuggestion,
        snoozeSuggestion,
    } = useIntelligence({ isAuthenticated, tasks });

    const {
        features,
        loading: featuresLoading,
        saving: featuresSaving,
        error: featureError,
        updateFeatures,
    } = useIntelligenceFeatures({ isAuthenticated });

    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem('dopatika_push_coach_collapsed') === 'true';
    });

    // Persist collapsed state
    useEffect(() => {
        window.localStorage.setItem('dopatika_push_coach_collapsed', String(collapsed));
    }, [collapsed]);
    const [busySuggestionId, setBusySuggestionId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [successToast, setSuccessToast] = useState<string | null>(null);

    // Auto-clear success toast
    useEffect(() => {
        if (successToast) {
            const timer = setTimeout(() => setSuccessToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successToast]);
    const [generating, setGenerating] = useState(false);
    const [rescueDrafts, setRescueDrafts] = useState<Record<string, RescueBreakdownDraft>>({});
    const [rescueDraftSelections, setRescueDraftSelections] = useState<Record<string, boolean[]>>({});
    const [rescueDraftLoadingIds, setRescueDraftLoadingIds] = useState<Record<string, boolean>>({});
    const [rescueDraftErrors, setRescueDraftErrors] = useState<Record<string, string>>({});
    const rescuePrefetchedTaskIdsRef = useRef<Set<string>>(new Set());

    // Inline editing state for rescue steps
    const [editingStep, setEditingStep] = useState<{ taskId: string; index: number; field: 'title' | 'duration' } | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    // Settings dropdown state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Close settings dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setSettingsOpen(false);
            }
        };
        if (settingsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [settingsOpen]);

    const taskById = useMemo(
        () => new Map(tasks.map(task => [task.id, task])),
        [tasks]
    );

    const autoGenerate = useCallback(async () => {
        setGenerating(true);
        setActionError(null);
        try {
            await generateSuggestions();
        } catch (err) {
            console.error('Failed to auto-generate suggestions:', err);
            setActionError('Could not generate suggestions right now.');
        } finally {
            setGenerating(false);
        }
    }, [generateSuggestions]);

    const generateRescueDraft = useCallback(async (task: Task, force = false): Promise<RescueBreakdownDraft | null> => {
        if (!features.aiBreakdown) {
            setRescueDraftErrors(prev => ({
                ...prev,
                [task.id]: 'AI breakdown suggestions are turned off. Enable AI breakdown in Push Coach settings to generate rescue drafts.',
            }));
            return null;
        }

        const existingDraft = rescueDrafts[task.id];
        const isCachedAndFresh = existingDraft && (Date.now() - existingDraft.generatedAt) < RESCUE_DRAFT_CACHE_MS;
        if (!force && isCachedAndFresh) {
            return existingDraft;
        }

        setRescueDraftLoadingIds(prev => ({ ...prev, [task.id]: true }));
        setRescueDraftErrors(prev => {
            const next = { ...prev };
            delete next[task.id];
            return next;
        });

        try {
            const response = await fetch('/api/intelligence/breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task.id,
                    taskTitle: task.title,
                    taskDescription: task.description || undefined,
                    estimatedMinutes: task.estimatedMinutes || 30,
                    energyLevel: task.energyLevel || 'medium',
                    priority: task.priority || 'medium',
                    projectId: task.projectId || undefined,
                    timeBlock: task.timeBlock === 'inbox' ? undefined : task.timeBlock,
                    userContext: `This task has rolled over ${task.rolloverCount ?? 0} times. Create a rescue plan with a tiny first step to reduce startup friction.`,
                    saveSuggestion: false,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate rescue draft');
            }

            const data = await response.json();
            const draft: RescueBreakdownDraft = {
                subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
                totalEstimate: typeof data.totalEstimate === 'number' ? data.totalEstimate : (task.estimatedMinutes || 30),
                tips: Array.isArray(data.tips) ? data.tips : [],
                reasoning: typeof data.reasoning === 'string' ? data.reasoning : undefined,
                fallback: Boolean(data.fallback),
                generatedAt: Date.now(),
            };

            setRescueDrafts(prev => ({ ...prev, [task.id]: draft }));
            setRescueDraftSelections(prev => ({
                ...prev,
                [task.id]: draft.subtasks.map(() => true),
            }));
            return draft;
        } catch (err) {
            console.error('Failed to generate rollover rescue draft:', err);
            const message = err instanceof Error ? err.message : 'Failed to generate rescue draft';
            setRescueDraftErrors(prev => ({ ...prev, [task.id]: message }));
            return null;
        } finally {
            setRescueDraftLoadingIds(prev => ({ ...prev, [task.id]: false }));
        }
    }, [features.aiBreakdown, rescueDrafts]);

    const toggleRescueStep = useCallback((taskId: string, index: number) => {
        setRescueDraftSelections(prev => {
            const current = prev[taskId] || [];
            if (!current.length) return prev;
            const next = [...current];
            next[index] = !next[index];
            return { ...prev, [taskId]: next };
        });
    }, []);

    const setRescueStepSelectionMode = useCallback((taskId: string, mode: 'all' | 'first-only') => {
        const draft = rescueDrafts[taskId];
        if (!draft) return;
        setRescueDraftSelections(prev => ({
            ...prev,
            [taskId]:
                mode === 'all'
                    ? draft.subtasks.map(() => true)
                    : draft.subtasks.map((_step, index) => index === 0),
        }));
    }, [rescueDrafts]);

    // Inline editing handlers for rescue steps
    const startEditingStep = useCallback((taskId: string, index: number, field: 'title' | 'duration', currentValue: string) => {
        setEditingStep({ taskId, index, field });
        setEditingValue(currentValue);
    }, []);

    const cancelEditingStep = useCallback(() => {
        setEditingStep(null);
        setEditingValue('');
    }, []);

    const saveEditingStep = useCallback(() => {
        if (!editingStep) return;
        const { taskId, index, field } = editingStep;
        const draft = rescueDrafts[taskId];
        if (!draft) return;

        const updatedSubtasks = [...draft.subtasks];
        if (field === 'title') {
            updatedSubtasks[index] = { ...updatedSubtasks[index], title: editingValue.trim() || updatedSubtasks[index].title };
        } else {
            const parsed = parseInt(editingValue, 10);
            updatedSubtasks[index] = { ...updatedSubtasks[index], estimatedMinutes: isNaN(parsed) || parsed < 1 ? updatedSubtasks[index].estimatedMinutes : parsed };
        }

        // Recalculate total estimate
        const newTotal = updatedSubtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0);

        setRescueDrafts(prev => ({
            ...prev,
            [taskId]: { ...draft, subtasks: updatedSubtasks, totalEstimate: newTotal },
        }));
        setEditingStep(null);
        setEditingValue('');
    }, [editingStep, editingValue, rescueDrafts]);

    useEffect(() => {
        if (!isAuthenticated || featuresLoading) return;
        if (!features.smartSuggestions) return;

        const cooldownMs = AUTO_GENERATE_COOLDOWN_MS[features.suggestionFrequency];
        const storageKey = 'dopatika_push_coach_last_generate_at';
        const last = Number(window.localStorage.getItem(storageKey) || 0);
        const now = Date.now();
        if (now - last < cooldownMs) return;

        window.localStorage.setItem(storageKey, String(now));
        void autoGenerate();
    }, [
        autoGenerate,
        features.smartSuggestions,
        features.suggestionFrequency,
        featuresLoading,
        isAuthenticated,
        tasks.length,
    ]);

    const visibleSuggestions = useMemo(() => {
        const limit = features.suggestionFrequency === 'proactive' ? 6 : 4;
        const minConfidence =
            features.suggestionFrequency === 'minimal' ? 0.8 :
            features.suggestionFrequency === 'balanced' ? 0.6 : 0.45;

        const filtered = suggestions.filter(suggestion => suggestion.confidence >= minConfidence);
        const ranked = [...filtered].sort((a, b) => {
            const taskA = a.taskId ? taskById.get(a.taskId) : undefined;
            const taskB = b.taskId ? taskById.get(b.taskId) : undefined;
            return getSuggestionPriorityScore(b, taskB) - getSuggestionPriorityScore(a, taskA);
        });

        const result: SmartSuggestion[] = [];
        const seenTaskIds = new Set<string>();

        for (const suggestion of ranked) {
            if (suggestion.taskId) {
                if (seenTaskIds.has(suggestion.taskId)) continue;
                seenTaskIds.add(suggestion.taskId);
            }
            result.push(suggestion);
            if (result.length >= limit) break;
        }

        return result;
    }, [features.suggestionFrequency, suggestions, taskById]);

    useEffect(() => {
        if (!isAuthenticated || featuresLoading) return;
        if (!features.smartSuggestions) return;
        if (features.suggestionFrequency === 'minimal') return;
        if (!features.aiBreakdown) return;
        const prefetchBudget = RESCUE_PREFETCH_LIMIT[features.suggestionFrequency];
        if (prefetchBudget <= 0) return;

        let prefetched = 0;
        visibleSuggestions.forEach((suggestion) => {
            if (prefetched >= prefetchBudget) return;
            if (!suggestion.taskId) return;
            const task = taskById.get(suggestion.taskId);
            if (!isRolloverRescueSuggestion(suggestion, task)) return;
            if (!task) return;
            if ((task.subtasks?.length ?? 0) > 0) return;
            const existingDraft = rescueDrafts[task.id];
            const isFreshDraft = existingDraft && (Date.now() - existingDraft.generatedAt) < RESCUE_DRAFT_CACHE_MS;
            if (isFreshDraft || rescueDraftLoadingIds[task.id]) return;
            if (rescuePrefetchedTaskIdsRef.current.has(task.id)) return;

            rescuePrefetchedTaskIdsRef.current.add(task.id);
            prefetched += 1;
            void generateRescueDraft(task);
        });
    }, [
        features.smartSuggestions,
        features.suggestionFrequency,
        features.aiBreakdown,
        featuresLoading,
        generateRescueDraft,
        isAuthenticated,
        rescueDraftLoadingIds,
        rescueDrafts,
        taskById,
        visibleSuggestions,
    ]);

    const executeSuggestion = useCallback(async (suggestion: SmartSuggestion) => {
        const action = suggestion.action;
        const targetTask = suggestion.taskId ? taskById.get(suggestion.taskId) : undefined;

        switch (action.type) {
            case 'move_time_block':
                if (suggestion.taskId && action.targetTimeBlock) {
                    const nextBlock = action.targetTimeBlock as Task['timeBlock'];
                    if (nextBlock === 'inbox') return;
                    await onUpdateTask(suggestion.taskId, { timeBlock: nextBlock });
                }
                return;
            case 'move_date':
                if (suggestion.taskId && typeof action.targetDate === 'string') {
                    await onUpdateTask(suggestion.taskId, { date: action.targetDate });
                }
                return;
            case 'change_priority':
                if (suggestion.taskId && action.targetPriority) {
                    await onUpdateTask(suggestion.taskId, { priority: action.targetPriority as Task['priority'] });
                }
                return;
            case 'breakdown':
                if (targetTask) {
                    onRequestAIBreakdown(targetTask);
                }
                return;
            case 'focus': {
                const focusTaskId = action.taskIds?.[0] ?? suggestion.taskId ?? null;
                if (focusTaskId) {
                    onSelectTask(focusTaskId);
                }
                return;
            }
            case 'archive':
                return;
            case 'dismiss':
            default:
                return;
        }
    }, [onRequestAIBreakdown, onSelectTask, onUpdateTask, taskById]);

    const handleAccept = useCallback(async (suggestion: SmartSuggestion) => {
        if (!suggestion.id) return;
        setBusySuggestionId(suggestion.id);
        setActionError(null);

        try {
            const targetTask = suggestion.taskId ? taskById.get(suggestion.taskId) : undefined;

            if (targetTask && isRolloverRescueSuggestion(suggestion, targetTask)) {
                const draft = rescueDrafts[targetTask.id] ?? await generateRescueDraft(targetTask);
                if (!draft || draft.subtasks.length === 0) {
                    setActionError('Could not generate a rescue draft yet. You can retry or open the breakdown modal.');
                    return;
                }

                const selectedMask = rescueDraftSelections[targetTask.id] ?? draft.subtasks.map(() => true);
                const selectedDraftSteps = draft.subtasks.filter((_subtask, index) => selectedMask[index] !== false);

                if (selectedDraftSteps.length === 0) {
                    setActionError('Select at least one rescue step before applying.');
                    return;
                }

                const subtaskPayload: Subtask[] = selectedDraftSteps.map((subtask, index) => ({
                    id: `push-ai-${Date.now()}-${index}`,
                    title: subtask.title,
                    estimatedMinutes: subtask.estimatedMinutes,
                    completed: false,
                }));

                await onApplyAIBreakdown(targetTask.id, subtaskPayload);
                setRescueDrafts(prev => {
                    const next = { ...prev };
                    delete next[targetTask.id];
                    return next;
                });
                setRescueDraftSelections(prev => {
                    const next = { ...prev };
                    delete next[targetTask.id];
                    return next;
                });
                await acceptSuggestion(suggestion.id);
                setSuccessToast(`Rescue plan applied to "${targetTask.title}"`);
                return;
            }

            // Opening the breakdown modal is not the same as accepting/applying a suggestion.
            // Keep the suggestion pending until the user actually applies it or dismisses it.
            if (suggestion.action.type === 'breakdown') {
                await executeSuggestion(suggestion);
                return;
            }

            await executeSuggestion(suggestion);
            await acceptSuggestion(suggestion.id);
            setSuccessToast('Suggestion applied');
        } catch (err) {
            console.error('Failed to apply suggestion:', err);
            setActionError('Could not apply that suggestion.');
        } finally {
            setBusySuggestionId(null);
        }
    }, [acceptSuggestion, executeSuggestion, generateRescueDraft, onApplyAIBreakdown, rescueDraftSelections, rescueDrafts, taskById]);

    const handleDismiss = useCallback(async (suggestionId: string) => {
        setBusySuggestionId(suggestionId);
        setActionError(null);
        try {
            await dismissSuggestion(suggestionId);
        } catch (err) {
            console.error('Failed to dismiss suggestion:', err);
            setActionError('Could not dismiss that suggestion.');
        } finally {
            setBusySuggestionId(null);
        }
    }, [dismissSuggestion]);

    const handleStartFocusTask = useCallback(async (suggestion: SmartSuggestion) => {
        if (!onStartNow) return;
        const taskId = suggestion.action.taskIds?.[0] ?? suggestion.taskId;
        if (!taskId || !suggestion.id) return;

        setBusySuggestionId(suggestion.id);
        setActionError(null);
        try {
            await onStartNow(taskId);
            await acceptSuggestion(suggestion.id);
        } catch (err) {
            console.error('Failed to start suggested task:', err);
            setActionError('Could not start the suggested task.');
        } finally {
            setBusySuggestionId(null);
        }
    }, [acceptSuggestion, onStartNow]);

    const handleToggleSmartSuggestions = async () => {
        await updateFeatures({ smartSuggestions: !features.smartSuggestions });
        if (!features.smartSuggestions) {
            void fetchSuggestions();
        }
    };

    const handleGenerateRescueDraft = useCallback(async (task: Task) => {
        setActionError(null);
        await generateRescueDraft(task, true);
    }, [generateRescueDraft]);

    if (!isAuthenticated) return null;

    return (
        <section className="px-2 sm:px-3 lg:px-4 pt-2">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-3 sm:px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-white flex items-center justify-center flex-shrink-0">
                            <Brain size={16} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">Push Coach</h3>
                                {features.smartSuggestions && (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                        <Sparkles size={10} />
                                        {formatFrequencyLabel(features.suggestionFrequency as SuggestionFrequency)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                                Optional, behavior-aware suggestions with one-tap actions
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Settings dropdown */}
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => setSettingsOpen(prev => !prev)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                                title="Push Coach settings"
                            >
                                <Settings size={16} />
                            </button>
                            {settingsOpen && (
                                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 space-y-3">
                                    <div className="text-xs font-semibold text-gray-700 pb-1 border-b border-gray-100">Settings</div>

                                    {/* Smart suggestions toggle */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-gray-700">Smart suggestions</span>
                                        <button
                                            onClick={handleToggleSmartSuggestions}
                                            disabled={featuresLoading || featuresSaving}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                                features.smartSuggestions ? 'bg-blue-500' : 'bg-gray-300'
                                            } disabled:opacity-60`}
                                        >
                                            <span
                                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                    features.smartSuggestions ? 'translate-x-4.5' : 'translate-x-0.5'
                                                }`}
                                                style={{ transform: features.smartSuggestions ? 'translateX(18px)' : 'translateX(2px)' }}
                                            />
                                        </button>
                                    </div>

                                    {/* Frequency selector */}
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-700">Frequency</span>
                                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                            {(['minimal', 'balanced', 'proactive'] as const).map(level => (
                                                <button
                                                    key={level}
                                                    onClick={() => void updateFeatures({ suggestionFrequency: level })}
                                                    disabled={!features.smartSuggestions || featuresSaving}
                                                    className={`flex-1 px-2 py-1 text-[10px] rounded-md transition-colors ${
                                                        features.suggestionFrequency === level
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'
                                                    } disabled:opacity-50`}
                                                >
                                                    {formatFrequencyLabel(level)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Learning toggle */}
                                    <label className="flex items-center justify-between gap-2 text-xs text-gray-700 cursor-pointer">
                                        <span>Learning enabled</span>
                                        <input
                                            type="checkbox"
                                            checked={features.learningEnabled}
                                            disabled={featuresSaving}
                                            onChange={() => void updateFeatures({ learningEnabled: !features.learningEnabled })}
                                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                        />
                                    </label>

                                    {/* AI breakdown toggle */}
                                    <label className="flex items-center justify-between gap-2 text-xs text-gray-700 cursor-pointer">
                                        <span>AI breakdown help</span>
                                        <input
                                            type="checkbox"
                                            checked={features.aiBreakdown}
                                            disabled={featuresSaving}
                                            onChange={() => void updateFeatures({ aiBreakdown: !features.aiBreakdown })}
                                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setCollapsed(prev => !prev)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                            title={collapsed ? 'Expand Push Coach' : 'Collapse Push Coach'}
                        >
                            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                    </div>
                </div>

                {!collapsed && (
                    <div className="p-3 sm:p-4 space-y-3">
                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => void autoGenerate()}
                                disabled={!features.smartSuggestions || generating || suggestionsLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                <RefreshCw size={12} className={(generating || suggestionsLoading) ? 'animate-spin' : ''} />
                                {suggestions.length > 0 ? 'Refresh' : 'Generate'}
                            </button>

                            <button
                                onClick={() => void fetchSuggestions()}
                                disabled={!features.smartSuggestions || suggestionsLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <Clock3 size={12} />
                                Check updates
                            </button>

                            {!features.smartSuggestions && (
                                <span className="text-xs text-gray-500">
                                    Suggestions off — enable in <Settings size={10} className="inline" />
                                </span>
                            )}
                        </div>

                        {featureError && (
                            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                {featureError}
                            </div>
                        )}

                        {actionError && (
                            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                {actionError}
                            </div>
                        )}

                        {successToast && (
                            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
                                <Check size={14} className="text-emerald-500" />
                                {successToast}
                            </div>
                        )}

                        {!features.smartSuggestions ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                                Push Coach is off. Turn on Smart suggestions when you want proactive nudges, breakdown prompts, and focus recommendations.
                            </div>
                        ) : visibleSuggestions.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                    <Zap size={14} className="text-amber-500" />
                                    No active suggestions yet
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Generate suggestions now, or keep working and Push Coach will surface patterns (rollovers, overload, stale tasks, unblocked tasks).
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {visibleSuggestions.map((suggestion) => {
                                    const targetTask = suggestion.taskId ? taskById.get(suggestion.taskId) : undefined;
                                    const isBusy = busySuggestionId === suggestion.id;
                                    const canStartFocus = !!onStartNow && suggestion.action.type === 'focus';
                                    const isRolloverRescue = isRolloverRescueSuggestion(suggestion, targetTask);
                                    const rescueDraft = targetTask ? rescueDrafts[targetTask.id] : undefined;
                                    const rescueSelections = targetTask
                                        ? (rescueDraftSelections[targetTask.id] ?? rescueDraft?.subtasks.map(() => true))
                                        : undefined;
                                    const selectedRescueCount = rescueDraft && rescueSelections
                                        ? rescueDraft.subtasks.filter((_subtask, index) => rescueSelections[index] !== false).length
                                        : 0;
                                    const rescueDraftLoading = Boolean(targetTask && rescueDraftLoadingIds[targetTask.id]);
                                    const rescueDraftError = targetTask ? rescueDraftErrors[targetTask.id] : undefined;
                                    const rescueAIDisabled = isRolloverRescue && !features.aiBreakdown;
                                    const primaryActionLabel = isRolloverRescue
                                        ? (
                                            rescueAIDisabled
                                                ? 'Enable AI breakdown'
                                                : rescueDraft
                                                ? `Apply ${selectedRescueCount || 0} step${selectedRescueCount === 1 ? '' : 's'}`
                                                : rescueDraftLoading
                                                    ? 'Drafting rescue...'
                                                    : 'Generate rescue draft'
                                        )
                                        : getActionLabel(suggestion);
                                    const primaryActionDisabled =
                                        isBusy ||
                                        (isRolloverRescue && (rescueDraftLoading || rescueAIDisabled));

                                    return (
                                        <div
                                            key={suggestion.id}
                                            className={`rounded-xl border px-3 py-3 ${getSuggestionAccent(suggestion.type)}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                            {suggestion.title}
                                                        </p>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 border border-white text-gray-600">
                                                            {Math.round(suggestion.confidence * 100)}%
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 border border-white text-gray-600 uppercase">
                                                            {suggestion.source}
                                                        </span>
                                                        {isRolloverRescue && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 border border-amber-200 text-amber-700">
                                                                Rollover rescue
                                                            </span>
                                                        )}
                                                    </div>

                                                    {suggestion.description && (
                                                        <p className="mt-1 text-xs text-gray-700">
                                                            {suggestion.description}
                                                        </p>
                                                    )}

                                                    {suggestion.reasoning && (
                                                        <p className="mt-1 text-[11px] text-gray-500">
                                                            Why: {suggestion.reasoning}
                                                        </p>
                                                    )}

                                                    {targetTask && (
                                                        <p className="mt-1 text-[11px] text-gray-500 truncate">
                                                            Task: {targetTask.title}
                                                        </p>
                                                    )}

                                                    {isRolloverRescue && targetTask && (
                                                        <p className="mt-1 text-[11px] text-amber-700">
                                                            Rolled over {targetTask.rolloverCount ?? 0}x. Push Coach can draft a smaller starting plan for review.
                                                        </p>
                                                    )}

                                                    {rescueAIDisabled && (
                                                        <p className="mt-1 text-[11px] text-gray-600">
                                                            Turn on <span className="font-medium">AI breakdown help</span> to generate a rescue draft for this task.
                                                        </p>
                                                    )}

                                                    {isRolloverRescue && rescueDraftLoading && (
                                                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/80 border border-white px-2 py-1 text-[11px] text-gray-600">
                                                            <Loader2 size={12} className="animate-spin" />
                                                            Drafting rescue plan...
                                                        </div>
                                                    )}

                                                    {isRolloverRescue && rescueDraftError && !rescueDraftLoading && (
                                                        <div className="mt-2 rounded-lg border border-amber-200 bg-white/80 px-2 py-2 text-[11px] text-amber-800">
                                                            {rescueDraftError}
                                                        </div>
                                                    )}

                                                    {isRolloverRescue && rescueDraft && rescueDraft.subtasks.length > 0 && (
                                                        <div className="mt-2 rounded-lg border border-white bg-white/80 p-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-[11px] font-semibold text-gray-800">Rescue draft</p>
                                                                <span className="text-[10px] text-gray-500">
                                                                    {selectedRescueCount}/{rescueDraft.subtasks.length} selected · ~{rescueDraft.totalEstimate}m
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap items-center gap-1">
                                                                <button
                                                                    onClick={() => targetTask && setRescueStepSelectionMode(targetTask.id, 'all')}
                                                                    className="px-2 py-0.5 text-[10px] rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                                                                    type="button"
                                                                >
                                                                    Select all
                                                                </button>
                                                                <button
                                                                    onClick={() => targetTask && setRescueStepSelectionMode(targetTask.id, 'first-only')}
                                                                    className="px-2 py-0.5 text-[10px] rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                                                                    type="button"
                                                                >
                                                                    First step only
                                                                </button>
                                                            </div>
                                                            <ul className="mt-1 space-y-1">
                                                                {rescueDraft.subtasks.map((subtask, index) => {
                                                                    const isEditingTitle = editingStep?.taskId === targetTask?.id && editingStep?.index === index && editingStep?.field === 'title';
                                                                    const isEditingDuration = editingStep?.taskId === targetTask?.id && editingStep?.index === index && editingStep?.field === 'duration';

                                                                    return (
                                                                        <li key={`${subtask.title}-${index}`} className="text-[11px] text-gray-700 flex items-start gap-1.5">
                                                                            {targetTask && (
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={rescueSelections ? rescueSelections[index] !== false : true}
                                                                                    onChange={() => toggleRescueStep(targetTask.id, index)}
                                                                                    className="mt-[2px] rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                                                />
                                                                            )}
                                                                            <span className="mt-[1px] text-gray-400">{index + 1}.</span>
                                                                            <span className="min-w-0 flex-1 flex items-center gap-1 flex-wrap">
                                                                                {isEditingTitle ? (
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editingValue}
                                                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                                                        onBlur={saveEditingStep}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter') saveEditingStep();
                                                                                            if (e.key === 'Escape') cancelEditingStep();
                                                                                        }}
                                                                                        autoFocus
                                                                                        className="flex-1 min-w-[120px] px-1 py-0.5 text-[11px] border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                                    />
                                                                                ) : (
                                                                                    <span
                                                                                        onClick={() => targetTask && startEditingStep(targetTask.id, index, 'title', subtask.title)}
                                                                                        className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 px-0.5 rounded transition-colors"
                                                                                        title="Click to edit title"
                                                                                    >
                                                                                        {subtask.title}
                                                                                    </span>
                                                                                )}
                                                                                {isEditingDuration ? (
                                                                                    <input
                                                                                        type="number"
                                                                                        min="1"
                                                                                        value={editingValue}
                                                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                                                        onBlur={saveEditingStep}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter') saveEditingStep();
                                                                                            if (e.key === 'Escape') cancelEditingStep();
                                                                                        }}
                                                                                        autoFocus
                                                                                        className="w-12 px-1 py-0.5 text-[11px] border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                                    />
                                                                                ) : (
                                                                                    <span
                                                                                        onClick={() => targetTask && startEditingStep(targetTask.id, index, 'duration', String(subtask.estimatedMinutes))}
                                                                                        className="text-gray-500 cursor-pointer hover:bg-blue-50 hover:text-blue-700 px-0.5 rounded transition-colors"
                                                                                        title="Click to edit duration"
                                                                                    >
                                                                                        ({subtask.estimatedMinutes}m)
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                            {selectedRescueCount === 0 && (
                                                                <p className="mt-1 text-[10px] text-amber-700">
                                                                    Select at least one step to apply this rescue draft.
                                                                </p>
                                                            )}
                                                            {rescueDraft.tips[0] && (
                                                                <p className="mt-1 text-[10px] text-violet-700">
                                                                    Tip: {rescueDraft.tips[0]}
                                                                </p>
                                                            )}
                                                            {rescueDraft.fallback && (
                                                                <p className="mt-1 text-[10px] text-amber-700">
                                                                    Using smart fallback breakdown (AI unavailable)
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (isRolloverRescue && targetTask && !rescueDraft) {
                                                            void handleGenerateRescueDraft(targetTask);
                                                            return;
                                                        }
                                                        void handleAccept(suggestion);
                                                    }}
                                                    disabled={primaryActionDisabled || (isRolloverRescue && !!rescueDraft && selectedRescueCount === 0)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                                                >
                                                    <Check size={12} />
                                                    {primaryActionLabel}
                                                </button>

                                                {isRolloverRescue && targetTask && (
                                                    <button
                                                        onClick={() => void handleGenerateRescueDraft(targetTask)}
                                                        disabled={isBusy || rescueDraftLoading}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-700 disabled:opacity-50"
                                                    >
                                                        <RefreshCw size={12} className={rescueDraftLoading ? 'animate-spin' : ''} />
                                                        {rescueDraft ? 'Regenerate draft' : 'Retry draft'}
                                                    </button>
                                                )}

                                                {canStartFocus && (
                                                    <button
                                                        onClick={() => void handleStartFocusTask(suggestion)}
                                                        disabled={isBusy}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 disabled:opacity-50"
                                                    >
                                                        <MoveRight size={12} />
                                                        Start now
                                                    </button>
                                                )}

                                                {suggestion.id && (
                                                    <>
                                                        <button
                                                            onClick={() => snoozeSuggestion(suggestion.id, 60 * 60 * 1000)}
                                                            disabled={isBusy}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                                                            title="Snooze for 1 hour"
                                                        >
                                                            <Clock size={12} />
                                                            Later
                                                        </button>
                                                        <button
                                                            onClick={() => void handleDismiss(suggestion.id)}
                                                            disabled={isBusy}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                                                        >
                                                            <X size={12} />
                                                            Dismiss
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
