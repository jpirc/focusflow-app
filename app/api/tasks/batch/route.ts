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

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    status: z.enum(['pending', 'in-progress', 'completed', 'skipped', 'carried-over']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    energyLevel: z.enum(['low', 'medium', 'high']).optional(),
    date: z.string().nullable().optional(),
    timeBlock: z.enum(['inbox', 'anytime', 'morning', 'afternoon', 'evening']).nullable().optional(),
    scheduledHour: z.number().min(0).max(23).nullable().optional(),
    scheduledMinute: z.number().min(0).max(59).nullable().optional(),
    estimatedMinutes: z.number().optional(),
    actualMinutes: z.number().nullable().optional(),
    startedAt: z.string().nullable().optional(),
    completed: z.boolean().optional(),
    isTopPriority: z.boolean().optional(),
    topPriorityDate: z.string().nullable().optional(),
    order: z.number().optional(),
});

const batchUpdateSchema = z.object({
    updates: z.array(z.object({
        id: z.string(),
        data: updateTaskSchema,
    })),
});

export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, batchUpdateSchema);
    if (error) return error;

    try {
        // Update all tasks in a transaction
        const results = await prisma.$transaction(
            data!.updates.map(({ id, data: updateData }) =>
                prisma.task.update({
                    where: {
                        id,
                        userId: session.user.id, // Ensure user owns the task
                    },
                    data: updateData as any, // Zod validation ensures this is correct
                })
            )
        );

        return successResponse({ tasks: results });
    } catch (error) {
        console.error('Failed to batch update tasks:', error);
        return errorResponse('Internal Server Error', 500);
    }
}
