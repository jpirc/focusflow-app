/**
 * Suggestion Engine
 * Generates intelligent suggestions based on learned patterns
 */

import { prisma } from '@/lib/prisma';
import { Task, TimeBlock, Priority } from '@/types';
import { 
    Suggestion, 
    SuggestionType, 
    SuggestionAction, 
    SuggestionStatus,
    UserInsight,
} from './types';
import { getInsights, getInsight } from './patterns';

const SUGGESTION_EXPIRY_HOURS = 24;

/**
 * Generate suggestions for a user based on their tasks and patterns
 */
export async function generateSuggestions(
    userId: string, 
    tasks: Task[]
): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const insights = await getInsights(userId);
    
    // Get user's feature preferences
    const features = await prisma.userFeature.findUnique({
        where: { userId },
    });
    
    if (features && !features.smartSuggestions) {
        return []; // User has disabled suggestions
    }
    
    const frequency = features?.suggestionFrequency || 'balanced';
    
    // Generate different types of suggestions based on frequency
    if (frequency !== 'minimal') {
        // Time block suggestions
        const timeBlockSuggestions = await generateTimeBlockSuggestions(userId, tasks, insights);
        suggestions.push(...timeBlockSuggestions);
        
        // Overload warnings
        const overloadSuggestions = generateOverloadSuggestions(userId, tasks);
        suggestions.push(...overloadSuggestions);
    }
    
    if (frequency === 'proactive') {
        // Stale task suggestions
        const staleSuggestions = generateStaleSuggestions(userId, tasks);
        suggestions.push(...staleSuggestions);
        
        // Daily focus recommendation
        const focusSuggestion = await generateDailyFocus(userId, tasks, insights);
        if (focusSuggestion) suggestions.push(focusSuggestion);
    }
    
    // Always generate: dependency ready notifications
    const dependencySuggestions = generateDependencyReadySuggestions(userId, tasks);
    suggestions.push(...dependencySuggestions);
    
    // Save suggestions to database
    for (const suggestion of suggestions) {
        await saveSuggestion(suggestion);
    }
    
    return suggestions;
}

/**
 * Suggest better time blocks for tasks based on patterns
 */
async function generateTimeBlockSuggestions(
    userId: string,
    tasks: Task[],
    insights: UserInsight[]
): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Get project-specific timing insights
    const projectTimings = insights.filter(i => i.insightType === 'project_timing');
    
    for (const task of tasks) {
        // Only suggest for today's tasks that are pending
        if (task.date !== today || task.status !== 'pending') continue;
        if (task.timeBlock === 'anytime') continue; // Don't suggest for anytime tasks
        
        // Check if this task's project has a preferred time
        const projectInsight = projectTimings.find(
            i => i.category === task.projectId
        );
        
        if (projectInsight && projectInsight.pattern.preferredTimeBlock) {
            const preferred = projectInsight.pattern.preferredTimeBlock;
            
            if (preferred !== task.timeBlock && projectInsight.confidence > 0.6) {
                suggestions.push({
                    userId,
                    taskId: task.id,
                    type: 'time_block',
                    title: `Move "${task.title}" to ${preferred}?`,
                    description: `You typically complete ${getProjectName(task.projectId)} tasks in the ${preferred}`,
                    action: { type: 'move_time_block', targetTimeBlock: preferred },
                    reasoning: `${Math.round(projectInsight.confidence * 100)}% of similar tasks completed in ${preferred}`,
                    confidence: projectInsight.confidence,
                    source: 'pattern',
                    status: 'pending',
                    expiresAt: new Date(Date.now() + SUGGESTION_EXPIRY_HOURS * 60 * 60 * 1000),
                });
            }
        }
    }
    
    return suggestions;
}

/**
 * Warn about overloaded time blocks
 */
function generateOverloadSuggestions(userId: string, tasks: Task[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Count tasks per time block for today
    const blockCounts: Record<string, number> = {
        morning: 0,
        afternoon: 0,
        evening: 0,
    };
    
    const todayTasks = tasks.filter(t => 
        t.date === today && 
        t.status !== 'completed' &&
        t.timeBlock !== 'anytime'
    );
    
    for (const task of todayTasks) {
        if (task.timeBlock in blockCounts) {
            blockCounts[task.timeBlock]++;
        }
    }
    
    // Warn if any block has more than 5 tasks
    for (const [block, count] of Object.entries(blockCounts)) {
        if (count > 5) {
            suggestions.push({
                userId,
                taskId: null,
                type: 'overload_warning',
                title: `${count} tasks in ${block}`,
                description: `Consider moving some tasks to balance your day`,
                action: { type: 'dismiss' },
                reasoning: `Heavy workload may reduce focus and completion rate`,
                confidence: 0.8,
                source: 'rule',
                status: 'pending',
                expiresAt: new Date(Date.now() + SUGGESTION_EXPIRY_HOURS * 60 * 60 * 1000),
            });
        }
    }
    
    return suggestions;
}

/**
 * Suggest action for stale tasks
 */
function generateStaleSuggestions(userId: string, tasks: Task[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    for (const task of tasks) {
        if (task.status === 'completed') continue;
        
        const createdAt = new Date(task.createdAt);
        const isStale = createdAt < sevenDaysAgo;
        const hasRolledOver = (task.rolloverCount ?? 0) >= 3;
        
        if (isStale || hasRolledOver) {
            const age = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
            
            suggestions.push({
                userId,
                taskId: task.id,
                type: 'stale_task',
                title: `"${task.title}" is ${age} days old`,
                description: hasRolledOver 
                    ? `Rolled over ${task.rolloverCount} times. Break it down or archive?`
                    : `Consider completing, breaking down, or archiving`,
                action: { type: 'breakdown' },
                reasoning: `Tasks that sit too long often need to be rethought`,
                confidence: 0.7,
                source: 'rule',
                status: 'pending',
                expiresAt: new Date(Date.now() + SUGGESTION_EXPIRY_HOURS * 60 * 60 * 1000),
            });
        }
    }
    
    return suggestions;
}

/**
 * Notify when blocking dependencies are completed
 */
function generateDependencyReadySuggestions(userId: string, tasks: Task[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const completedIds = new Set(
        tasks.filter(t => t.status === 'completed').map(t => t.id)
    );
    
    for (const task of tasks) {
        if (task.status !== 'pending') continue;
        if (!task.dependencies?.length) continue;
        
        // Check if all dependencies are now completed
        const allDepsCompleted = task.dependencies.every(
            dep => completedIds.has(dep.dependsOnId)
        );
        
        if (allDepsCompleted && task.dependencies.length > 0) {
            suggestions.push({
                userId,
                taskId: task.id,
                type: 'dependency_ready',
                title: `"${task.title}" is ready to start`,
                description: `All blocking tasks are now completed`,
                action: { type: 'focus', taskIds: [task.id] },
                reasoning: `Dependencies cleared`,
                confidence: 1.0,
                source: 'rule',
                status: 'pending',
                expiresAt: new Date(Date.now() + SUGGESTION_EXPIRY_HOURS * 60 * 60 * 1000),
            });
        }
    }
    
    return suggestions;
}

/**
 * Generate daily focus recommendation
 */
async function generateDailyFocus(
    userId: string,
    tasks: Task[],
    insights: UserInsight[]
): Promise<Suggestion | null> {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // Get current time block
    let currentBlock: TimeBlock;
    if (hour < 12) currentBlock = 'morning';
    else if (hour < 17) currentBlock = 'afternoon';
    else currentBlock = 'evening';
    
    // Find pending tasks for current time block
    const relevantTasks = tasks.filter(t =>
        t.date === today &&
        t.status === 'pending' &&
        (t.timeBlock === currentBlock || t.timeBlock === 'anytime')
    );
    
    if (relevantTasks.length === 0) return null;
    
    // Sort by priority
    const priorityOrder: Record<Priority, number> = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3,
    };
    
    const sorted = [...relevantTasks].sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    
    const topTasks = sorted.slice(0, 3);
    
    return {
        userId,
        taskId: topTasks[0].id,
        type: 'focus_recommendation',
        title: `Focus on: ${topTasks[0].title}`,
        description: topTasks.length > 1 
            ? `Also consider: ${topTasks.slice(1).map(t => t.title).join(', ')}`
            : undefined,
        action: { type: 'focus', taskIds: topTasks.map(t => t.id) },
        reasoning: `Based on priority and your ${currentBlock} schedule`,
        confidence: 0.7,
        source: 'rule',
        status: 'pending',
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hour expiry
    };
}

/**
 * Suggest optimal time block for a new task
 */
export async function suggestTimeBlock(
    task: Task,
    userId: string
): Promise<TimeBlock | null> {
    // Check for project-specific preference
    if (task.projectId) {
        const projectInsight = await getInsight(userId, 'project_timing', task.projectId);
        if (projectInsight && projectInsight.confidence > 0.6) {
            return projectInsight.pattern.preferredTimeBlock || null;
        }
    }
    
    // Check for general time preference
    const generalInsight = await getInsight(userId, 'time_preference', 'general');
    if (generalInsight && generalInsight.confidence > 0.6) {
        return generalInsight.pattern.preferredTimeBlock || null;
    }
    
    return null;
}

/**
 * Suggest priority for a new task based on patterns
 */
export async function suggestPriority(
    task: Task,
    userId: string
): Promise<Priority | null> {
    // For now, use simple rules
    // TODO: Enhance with ML-based priority prediction
    
    // Check for urgency keywords
    const urgencyKeywords = ['urgent', 'asap', 'critical', 'emergency', 'deadline'];
    const title = task.title.toLowerCase();
    
    for (const keyword of urgencyKeywords) {
        if (title.includes(keyword)) {
            return 'urgent';
        }
    }
    
    return null;
}

/**
 * Get recommended tasks to focus on
 */
export async function getDailyFocus(
    userId: string,
    tasks: Task[]
): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get pending tasks for today
    const todayTasks = tasks.filter(t =>
        t.date === today &&
        t.status === 'pending'
    );
    
    // Sort by priority, then by rollover count (higher = more urgent)
    const priorityOrder: Record<Priority, number> = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3,
    };
    
    return todayTasks
        .sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return (b.rolloverCount ?? 0) - (a.rolloverCount ?? 0);
        })
        .slice(0, 5);
}

// Helper to get project name (would be passed from context in real use)
function getProjectName(projectId?: string | null): string {
    return projectId ? 'this project\'s' : 'these';
}

/**
 * Save a suggestion to the database
 */
async function saveSuggestion(suggestion: Suggestion): Promise<void> {
    try {
        await prisma.suggestion.create({
            data: {
                userId: suggestion.userId,
                taskId: suggestion.taskId || null,
                type: suggestion.type,
                title: suggestion.title,
                description: suggestion.description || null,
                action: suggestion.action as object,
                reasoning: suggestion.reasoning || null,
                confidence: suggestion.confidence,
                source: suggestion.source,
                status: suggestion.status,
                expiresAt: suggestion.expiresAt || null,
            },
        });
    } catch (error) {
        console.error('Failed to save suggestion:', error);
    }
}

/**
 * Get suggestions for a user
 */
export async function getSuggestions(
    userId: string,
    status?: SuggestionStatus
): Promise<Suggestion[]> {
    const where: Record<string, unknown> = {
        userId,
        OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
        ],
    };
    
    if (status) {
        where.status = status;
    }
    
    const suggestions = await prisma.suggestion.findMany({
        where,
        orderBy: [
            { confidence: 'desc' },
            { createdAt: 'desc' },
        ],
    });
    
    return suggestions.map(s => ({
        id: s.id,
        userId: s.userId,
        taskId: s.taskId,
        type: s.type as SuggestionType,
        title: s.title,
        description: s.description || undefined,
        action: s.action as SuggestionAction,
        reasoning: s.reasoning || undefined,
        confidence: s.confidence,
        source: s.source as 'rule' | 'pattern' | 'ai',
        status: s.status as SuggestionStatus,
        respondedAt: s.respondedAt,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
    }));
}

/**
 * Respond to a suggestion (accept or dismiss)
 */
export async function respondToSuggestion(
    suggestionId: string,
    accepted: boolean
): Promise<void> {
    await prisma.suggestion.update({
        where: { id: suggestionId },
        data: {
            status: accepted ? 'accepted' : 'dismissed',
            respondedAt: new Date(),
        },
    });
}
