/**
 * Event Tracker
 * Records all task-related events for learning and analytics
 */

import { prisma, Prisma } from '@/lib/prisma';
import { Task } from '@/types';
import { TaskEvent, TaskEventType } from './types';

// Get current time context
function getTimeContext(): { hourOfDay: number; dayOfWeek: number } {
    const now = new Date();
    return {
        hourOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
    };
}

/**
 * Track a task event in the database
 */
export async function trackEvent(event: TaskEvent): Promise<void> {
    const timeContext = getTimeContext();
    
    try {
        await prisma.taskEvent.create({
            data: {
                userId: event.userId,
                taskId: event.taskId || null,
                eventType: event.eventType,
                hourOfDay: event.hourOfDay ?? timeContext.hourOfDay,
                dayOfWeek: event.dayOfWeek ?? timeContext.dayOfWeek,
                timeBlock: event.timeBlock || null,
                projectId: event.projectId || null,
                priority: event.priority || null,
                energyLevel: event.energyLevel || null,
                previousValue: event.previousValue 
                    ? (event.previousValue as Prisma.InputJsonValue) 
                    : Prisma.JsonNull,
                newValue: event.newValue 
                    ? (event.newValue as Prisma.InputJsonValue) 
                    : Prisma.JsonNull,
                metadata: event.metadata 
                    ? (event.metadata as Prisma.InputJsonValue) 
                    : Prisma.JsonNull,
            },
        });
    } catch (error) {
        // Don't let tracking errors break the main flow
        console.error('Failed to track event:', error);
    }
}

/**
 * Track task creation
 */
export async function trackTaskCreated(userId: string, task: Task): Promise<void> {
    await trackEvent({
        userId,
        taskId: task.id,
        eventType: 'task_created',
        timeBlock: task.timeBlock,
        projectId: task.projectId,
        priority: task.priority,
        energyLevel: task.energyLevel,
        newValue: {
            title: task.title,
            date: task.date,
            timeBlock: task.timeBlock,
            estimatedMinutes: task.estimatedMinutes,
        },
    });
}

/**
 * Track task completion
 */
export async function trackTaskCompleted(userId: string, task: Task): Promise<void> {
    await trackEvent({
        userId,
        taskId: task.id,
        eventType: 'task_completed',
        timeBlock: task.timeBlock,
        projectId: task.projectId,
        priority: task.priority,
        energyLevel: task.energyLevel,
        metadata: {
            estimatedMinutes: task.estimatedMinutes,
            actualMinutes: task.actualMinutes,
            rolloverCount: task.rolloverCount,
            hadSubtasks: (task.subtasks?.length ?? 0) > 0,
            subtaskCount: task.subtasks?.length ?? 0,
        },
    });
}

/**
 * Track task started (in-progress)
 */
export async function trackTaskStarted(userId: string, task: Task): Promise<void> {
    await trackEvent({
        userId,
        taskId: task.id,
        eventType: 'task_started',
        timeBlock: task.timeBlock,
        projectId: task.projectId,
        priority: task.priority,
        energyLevel: task.energyLevel,
    });
}

/**
 * Track task moved (date or time block change)
 */
export async function trackTaskMoved(
    userId: string,
    task: Task,
    previousDate: string | null | undefined,
    previousTimeBlock: string | undefined
): Promise<void> {
    await trackEvent({
        userId,
        taskId: task.id,
        eventType: 'task_moved',
        timeBlock: task.timeBlock,
        projectId: task.projectId,
        priority: task.priority,
        energyLevel: task.energyLevel,
        previousValue: {
            date: previousDate,
            timeBlock: previousTimeBlock,
        },
        newValue: {
            date: task.date,
            timeBlock: task.timeBlock,
        },
    });
}

/**
 * Track task update (general updates)
 */
export async function trackTaskUpdated(
    userId: string,
    task: Task,
    changes: Record<string, { from: unknown; to: unknown }>
): Promise<void> {
    const previousValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};
    
    for (const [key, { from, to }] of Object.entries(changes)) {
        previousValue[key] = from;
        newValue[key] = to;
    }
    
    await trackEvent({
        userId,
        taskId: task.id,
        eventType: 'task_updated',
        timeBlock: task.timeBlock,
        projectId: task.projectId,
        priority: task.priority,
        energyLevel: task.energyLevel,
        previousValue,
        newValue,
    });
}

/**
 * Track task deletion
 */
export async function trackTaskDeleted(userId: string, taskId: string, task?: Partial<Task>): Promise<void> {
    await trackEvent({
        userId,
        taskId,
        eventType: 'task_deleted',
        timeBlock: task?.timeBlock,
        projectId: task?.projectId,
        priority: task?.priority,
        energyLevel: task?.energyLevel,
        previousValue: task ? {
            title: task.title,
            status: task.status,
            date: task.date,
        } : undefined,
    });
}

/**
 * Track session start (user opened the app)
 */
export async function trackSessionStart(userId: string): Promise<void> {
    await trackEvent({
        userId,
        taskId: null,
        eventType: 'session_start',
    });
}

/**
 * Get events for analysis
 */
export async function getEventsForUser(
    userId: string,
    options?: {
        eventTypes?: TaskEventType[];
        since?: Date;
        limit?: number;
    }
): Promise<TaskEvent[]> {
    const where: Record<string, unknown> = { userId };
    
    if (options?.eventTypes?.length) {
        where.eventType = { in: options.eventTypes };
    }
    
    if (options?.since) {
        where.createdAt = { gte: options.since };
    }
    
    const events = await prisma.taskEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 1000,
    });
    
    return events.map(e => ({
        id: e.id,
        userId: e.userId,
        taskId: e.taskId,
        eventType: e.eventType as TaskEventType,
        hourOfDay: e.hourOfDay ?? undefined,
        dayOfWeek: e.dayOfWeek ?? undefined,
        timeBlock: e.timeBlock as Task['timeBlock'] | undefined,
        projectId: e.projectId,
        priority: e.priority as Task['priority'] | undefined,
        energyLevel: e.energyLevel as Task['energyLevel'] | undefined,
        previousValue: e.previousValue as Record<string, unknown> | undefined,
        newValue: e.newValue as Record<string, unknown> | undefined,
        metadata: e.metadata as Record<string, unknown> | undefined,
        createdAt: e.createdAt,
    }));
}

/**
 * Get completion events grouped by time block for pattern analysis
 */
export async function getCompletionsByTimeBlock(
    userId: string,
    since?: Date
): Promise<Record<string, number>> {
    const events = await prisma.taskEvent.groupBy({
        by: ['timeBlock'],
        where: {
            userId,
            eventType: 'task_completed',
            timeBlock: { not: null },
            ...(since && { createdAt: { gte: since } }),
        },
        _count: { id: true },
    });
    
    const result: Record<string, number> = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        anytime: 0,
    };
    
    for (const e of events) {
        if (e.timeBlock) {
            result[e.timeBlock] = e._count.id;
        }
    }
    
    return result;
}

/**
 * Get completion events grouped by hour for peak productivity analysis
 */
export async function getCompletionsByHour(
    userId: string,
    since?: Date
): Promise<Record<number, number>> {
    const events = await prisma.taskEvent.groupBy({
        by: ['hourOfDay'],
        where: {
            userId,
            eventType: 'task_completed',
            hourOfDay: { not: null },
            ...(since && { createdAt: { gte: since } }),
        },
        _count: { id: true },
    });
    
    const result: Record<number, number> = {};
    for (let i = 0; i < 24; i++) result[i] = 0;
    
    for (const e of events) {
        if (e.hourOfDay !== null) {
            result[e.hourOfDay] = e._count.id;
        }
    }
    
    return result;
}

/**
 * Get completion events grouped by project for project preference analysis
 */
export async function getCompletionsByProject(
    userId: string,
    since?: Date
): Promise<Array<{ projectId: string; timeBlock: string; count: number }>> {
    const events = await prisma.taskEvent.groupBy({
        by: ['projectId', 'timeBlock'],
        where: {
            userId,
            eventType: 'task_completed',
            projectId: { not: null },
            timeBlock: { not: null },
            ...(since && { createdAt: { gte: since } }),
        },
        _count: { id: true },
    });
    
    return events
        .filter(e => e.projectId && e.timeBlock)
        .map(e => ({
            projectId: e.projectId!,
            timeBlock: e.timeBlock!,
            count: e._count.id,
        }));
}
