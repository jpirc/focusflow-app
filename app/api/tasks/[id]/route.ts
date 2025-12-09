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
    timeBlock: z.enum(['anytime', 'morning', 'afternoon', 'evening']).optional(),
    estimatedMinutes: z.number().optional(),
    actualMinutes: z.number().nullable().optional(),
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

        const updated = await prisma.task.update({
            where: { id: params.id },
            data: data!,
        });

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

        return successResponse({ success: true });
    } catch (error) {
        console.error('Failed to delete task:', error);
        return errorResponse('Internal Server Error', 500);
    }
}
