/**
 * Pattern Analyzer
 * Analyzes task events to discover user behavior patterns
 */

import { prisma, Prisma } from '@/lib/prisma';
import { TimeBlock } from '@/types';
import { 
    UserInsight, 
    InsightType, 
    Pattern,
} from './types';
import { 
    getCompletionsByTimeBlock, 
    getCompletionsByHour, 
    getCompletionsByProject,
    getEventsForUser,
} from './events';

const MIN_SAMPLE_SIZE = 5;  // Minimum events to form a pattern
const CONFIDENCE_THRESHOLD = 0.6;  // Minimum confidence to save insight
const PATTERN_EXPIRY_DAYS = 30;  // Patterns expire if not reinforced

/**
 * Analyze all patterns for a user and update insights
 */
export async function analyzePatterns(userId: string): Promise<UserInsight[]> {
    const insights: UserInsight[] = [];
    
    // Analyze time block preferences
    const timeBlockInsight = await analyzeTimeBlockPreference(userId);
    if (timeBlockInsight) insights.push(timeBlockInsight);
    
    // Analyze peak productivity hours
    const peakHoursInsight = await analyzePeakHours(userId);
    if (peakHoursInsight) insights.push(peakHoursInsight);
    
    // Analyze project-specific timing preferences
    const projectInsights = await analyzeProjectTiming(userId);
    insights.push(...projectInsights);
    
    // Analyze estimation accuracy
    const estimationInsight = await analyzeEstimationAccuracy(userId);
    if (estimationInsight) insights.push(estimationInsight);
    
    // Analyze velocity
    const velocityInsight = await analyzeVelocity(userId);
    if (velocityInsight) insights.push(velocityInsight);
    
    // Save all insights
    for (const insight of insights) {
        await saveInsight(insight);
    }
    
    return insights;
}

/**
 * Analyze which time blocks the user is most productive in
 */
async function analyzeTimeBlockPreference(userId: string): Promise<UserInsight | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completions = await getCompletionsByTimeBlock(userId, thirtyDaysAgo);
    
    const total = Object.values(completions).reduce((a, b) => a + b, 0);
    if (total < MIN_SAMPLE_SIZE) return null;
    
    // Find the dominant time block
    let maxCount = 0;
    let preferredBlock: TimeBlock = 'anytime';
    
    for (const [block, count] of Object.entries(completions)) {
        if (count > maxCount && block !== 'anytime') {
            maxCount = count;
            preferredBlock = block as TimeBlock;
        }
    }
    
    const confidence = maxCount / total;
    if (confidence < CONFIDENCE_THRESHOLD) return null;
    
    return {
        userId,
        insightType: 'time_preference',
        category: 'general',
        pattern: {
            preferredTimeBlock: preferredBlock,
            completionRate: confidence,
        },
        confidence,
        sampleSize: total,
        isActive: true,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + PATTERN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    };
}

/**
 * Analyze peak productivity hours
 */
async function analyzePeakHours(userId: string): Promise<UserInsight | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completionsByHour = await getCompletionsByHour(userId, thirtyDaysAgo);
    
    const total = Object.values(completionsByHour).reduce((a, b) => a + b, 0);
    if (total < MIN_SAMPLE_SIZE) return null;
    
    // Find hours with above-average completions
    const avgPerHour = total / 24;
    const peakHours: number[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
        if (completionsByHour[hour] > avgPerHour * 1.5) {
            peakHours.push(hour);
        }
    }
    
    if (peakHours.length === 0) return null;
    
    // Calculate confidence based on how concentrated the peaks are
    const peakTotal = peakHours.reduce((sum, h) => sum + completionsByHour[h], 0);
    const confidence = peakTotal / total;
    
    return {
        userId,
        insightType: 'productivity_window',
        category: 'general',
        pattern: {
            preferredHours: peakHours,
            completionRate: confidence,
        },
        confidence,
        sampleSize: total,
        isActive: true,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + PATTERN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    };
}

/**
 * Analyze project-specific timing preferences
 */
async function analyzeProjectTiming(userId: string): Promise<UserInsight[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const projectCompletions = await getCompletionsByProject(userId, thirtyDaysAgo);
    
    // Group by project
    const byProject: Record<string, Record<string, number>> = {};
    for (const { projectId, timeBlock, count } of projectCompletions) {
        if (!byProject[projectId]) {
            byProject[projectId] = { morning: 0, afternoon: 0, evening: 0, anytime: 0 };
        }
        byProject[projectId][timeBlock] = count;
    }
    
    const insights: UserInsight[] = [];
    
    for (const [projectId, blocks] of Object.entries(byProject)) {
        const total = Object.values(blocks).reduce((a, b) => a + b, 0);
        if (total < MIN_SAMPLE_SIZE) continue;
        
        // Find dominant time block for this project
        let maxCount = 0;
        let preferredBlock: TimeBlock = 'anytime';
        
        for (const [block, count] of Object.entries(blocks)) {
            if (count > maxCount && block !== 'anytime') {
                maxCount = count;
                preferredBlock = block as TimeBlock;
            }
        }
        
        const confidence = maxCount / total;
        if (confidence < CONFIDENCE_THRESHOLD) continue;
        
        insights.push({
            userId,
            insightType: 'project_timing',
            category: projectId,
            pattern: {
                preferredTimeBlock: preferredBlock,
                projectId,
                completionRate: confidence,
            },
            confidence,
            sampleSize: total,
            isActive: true,
            lastUpdated: new Date(),
            expiresAt: new Date(Date.now() + PATTERN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        });
    }
    
    return insights;
}

/**
 * Analyze estimation accuracy (estimated vs actual time)
 */
async function analyzeEstimationAccuracy(userId: string): Promise<UserInsight | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await getEventsForUser(userId, {
        eventTypes: ['task_completed'],
        since: thirtyDaysAgo,
    });
    
    const withTiming = events.filter(e => 
        e.metadata?.estimatedMinutes && 
        e.metadata?.actualMinutes
    );
    
    if (withTiming.length < MIN_SAMPLE_SIZE) return null;
    
    let totalEstimated = 0;
    let totalActual = 0;
    
    for (const event of withTiming) {
        totalEstimated += event.metadata!.estimatedMinutes as number;
        totalActual += event.metadata!.actualMinutes as number;
    }
    
    const accuracy = totalActual / totalEstimated; // >1 = underestimate, <1 = overestimate
    
    // Confidence based on sample size (caps at 0.9)
    const confidence = Math.min(0.9, withTiming.length / 20);
    
    return {
        userId,
        insightType: 'estimation_accuracy',
        category: 'general',
        pattern: {
            estimationAccuracy: accuracy,
            avgCompletionTimeMinutes: totalActual / withTiming.length,
        },
        confidence,
        sampleSize: withTiming.length,
        isActive: true,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + PATTERN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    };
}

/**
 * Analyze task completion velocity
 */
async function analyzeVelocity(userId: string): Promise<UserInsight | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await getEventsForUser(userId, {
        eventTypes: ['task_completed'],
        since: thirtyDaysAgo,
    });
    
    if (events.length < MIN_SAMPLE_SIZE) return null;
    
    // Group by date
    const byDate: Record<string, number> = {};
    for (const event of events) {
        const date = event.createdAt?.toISOString().split('T')[0];
        if (date) {
            byDate[date] = (byDate[date] || 0) + 1;
        }
    }
    
    const activeDays = Object.keys(byDate).length;
    const avgTasksPerDay = events.length / activeDays;
    
    // Confidence based on consistency
    const dailyCounts = Object.values(byDate);
    const variance = calculateVariance(dailyCounts);
    const confidence = Math.min(0.9, 1 / (1 + variance / avgTasksPerDay));
    
    return {
        userId,
        insightType: 'completion_velocity',
        category: 'general',
        pattern: {
            avgTasksPerDay,
            completionRate: events.length / 30, // Approximate daily rate
        },
        confidence,
        sampleSize: events.length,
        isActive: true,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + PATTERN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    };
}

/**
 * Calculate variance of a number array
 */
function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Save or update an insight
 */
async function saveInsight(insight: UserInsight): Promise<void> {
    try {
        await prisma.userInsight.upsert({
            where: {
                userId_insightType_category: {
                    userId: insight.userId,
                    insightType: insight.insightType,
                    category: insight.category || 'general',
                },
            },
            update: {
                pattern: insight.pattern as Prisma.InputJsonValue,
                confidence: insight.confidence,
                sampleSize: insight.sampleSize,
                isActive: insight.isActive,
                lastUpdated: insight.lastUpdated,
                expiresAt: insight.expiresAt,
            },
            create: {
                userId: insight.userId,
                insightType: insight.insightType,
                category: insight.category || 'general',
                pattern: insight.pattern as Prisma.InputJsonValue,
                confidence: insight.confidence,
                sampleSize: insight.sampleSize,
                isActive: insight.isActive,
                lastUpdated: insight.lastUpdated,
                expiresAt: insight.expiresAt,
            },
        });
    } catch (error) {
        console.error('Failed to save insight:', error);
    }
}

/**
 * Get all active insights for a user
 */
export async function getInsights(userId: string): Promise<UserInsight[]> {
    const insights = await prisma.userInsight.findMany({
        where: {
            userId,
            isActive: true,
            OR: [
                { expiresAt: null },
                { expiresAt: { gte: new Date() } },
            ],
        },
    });
    
    return insights.map(i => ({
        id: i.id,
        userId: i.userId,
        insightType: i.insightType as InsightType,
        category: i.category || undefined,
        pattern: i.pattern as Pattern,
        confidence: i.confidence,
        sampleSize: i.sampleSize,
        isActive: i.isActive,
        lastUpdated: i.lastUpdated,
        expiresAt: i.expiresAt,
    }));
}

/**
 * Get a specific insight
 */
export async function getInsight(
    userId: string, 
    insightType: InsightType, 
    category?: string
): Promise<UserInsight | null> {
    const insight = await prisma.userInsight.findUnique({
        where: {
            userId_insightType_category: {
                userId,
                insightType,
                category: category || 'general',
            },
        },
    });
    
    if (!insight || !insight.isActive) return null;
    if (insight.expiresAt && insight.expiresAt < new Date()) return null;
    
    return {
        id: insight.id,
        userId: insight.userId,
        insightType: insight.insightType as InsightType,
        category: insight.category || undefined,
        pattern: insight.pattern as Pattern,
        confidence: insight.confidence,
        sampleSize: insight.sampleSize,
        isActive: insight.isActive,
        lastUpdated: insight.lastUpdated,
        expiresAt: insight.expiresAt,
    };
}
