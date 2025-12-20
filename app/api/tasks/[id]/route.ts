import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
    getAuthSession,
    successResponse,
    unauthorizedResponse,
    validateRequest,
    errorResponse,
} from '@/lib/api/route_utils';
import { 
    trackTaskCompleted, 
    trackTaskStarted, 
    trackTaskMoved, 
    trackTaskUpdated,
    trackTaskDeleted,
} from '@/lib/intelligence';

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    status: z.enum(['pending', 'in-progress', 'completed', 'skipped', 'carried-over']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    energyLevel: z.enum(['low', 'medium', 'high']).optional(),
    date: z.string().nullable().optional(),
    timeBlock: z.enum(['anytime', 'morning', 'afternoon', 'evening']).optional(),
    estimatedMinutes: z.number().optional(),
    actualMinutes: z.number().nullable().optional(),
    startedAt: z.string().nullable().optional(),
    completed: z.boolean().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        const task = await prisma.task.findUnique({
            where: {
                id: params.id,
                userId: session.user.id,
            },
            include: {
                subtasks: {
                    orderBy: { createdAt: 'asc' },
                },
                dependencies: {
                    include: {
                        dependsOn: {
                            select: { id: true, title: true, completed: true, status: true },
                        },
                    },
                },
                blocking: {
                    include: {
                        task: {
                            select: { id: true, title: true },
                        },
                    },
                },
            },
        });

        if (!task) return errorResponse('Task not found', 404);
        if (task.userId !== session.user.id) return unauthorizedResponse();

        return successResponse(task);
    } catch (error) {
        return errorResponse('Internal Server Error', 500);
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, updateTaskSchema);
    if (error) return error;

    try {
        const existing = await prisma.task.findUnique({
            where: { id: params.id },
        });

        if (!existing) return errorResponse('Task not found', 404);
        if (existing.userId !== session.user.id) return unauthorizedResponse();

        // Auto-set timestamps when status changes
        const updateData: any = { ...data };
        
        // Set startedAt when task moves to in-progress
        if (data!.status === 'in-progress' && existing.status !== 'in-progress') {
            updateData.startedAt = new Date();
        }
        
        // Set completedAt and calculate actualMinutes when completed
        if (data!.status === 'completed' && existing.status !== 'completed') {
            updateData.completedAt = new Date();
            // Add current session's time to existing accumulated time
            let accumulatedMinutes = existing.actualMinutes || 0;
            if (existing.startedAt) {
                const elapsed = Math.round((Date.now() - new Date(existing.startedAt).getTime()) / 60000);
                accumulatedMinutes += elapsed;
            }
            updateData.actualMinutes = accumulatedMinutes;
        } else if (data!.status && data!.status !== 'completed' && existing.status === 'completed') {
            // Clear completedAt if status changes FROM completed to something else
            updateData.completedAt = null;
        }
        
        // Clear startedAt if going back to pending
        if (data!.status === 'pending' && existing.status !== 'pending') {
            updateData.startedAt = null;
        }

        const updated = await prisma.task.update({
            where: { id: params.id },
            data: updateData,
        });

        // Track events for learning (async, non-blocking)
        const taskForTracking = {
            id: updated.id,
            title: updated.title,
            date: updated.date || undefined,
            timeBlock: updated.timeBlock as 'morning' | 'afternoon' | 'evening' | 'anytime',
            projectId: updated.projectId,
            priority: updated.priority as 'low' | 'medium' | 'high' | 'urgent',
            energyLevel: updated.energyLevel as 'low' | 'medium' | 'high',
            estimatedMinutes: updated.estimatedMinutes,
            actualMinutes: updated.actualMinutes,
            status: updated.status as any,
            rolloverCount: updated.rolloverCount,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        } as any;

        // Track specific status changes
        if (data!.status === 'completed' && existing.status !== 'completed') {
            trackTaskCompleted(session.user.id, taskForTracking).catch(console.error);
        } else if (data!.status === 'in-progress' && existing.status !== 'in-progress') {
            trackTaskStarted(session.user.id, taskForTracking).catch(console.error);
        }

        // Track date/timeBlock changes
        if (data!.date !== undefined || data!.timeBlock !== undefined) {
            if (data!.date !== existing.date || data!.timeBlock !== existing.timeBlock) {
                trackTaskMoved(
                    session.user.id, 
                    taskForTracking, 
                    existing.date, 
                    existing.timeBlock
                ).catch(console.error);
            }
        }

        return successResponse(updated);
    } catch (error) {
        console.error('Failed to update task:', error);
        return errorResponse('Internal Server Error', 500);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        const existing = await prisma.task.findUnique({
            where: { id: params.id },
        });

        if (!existing) return errorResponse('Task not found', 404);
        if (existing.userId !== session.user.id) return unauthorizedResponse();

        await prisma.task.delete({
            where: { id: params.id },
        });

        // Track deletion for analytics (async, non-blocking)
        trackTaskDeleted(session.user.id, params.id, {
            title: existing.title,
            status: existing.status,
            date: existing.date,
            projectId: existing.projectId,
            timeBlock: existing.timeBlock,
            priority: existing.priority,
            energyLevel: existing.energyLevel,
        } as any).catch(console.error);

        return successResponse({ success: true });
    } catch (error) {
        console.error('Failed to delete task:', error);
        return errorResponse('Internal Server Error', 500);
    }
}
