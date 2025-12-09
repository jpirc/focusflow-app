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

const addDependencySchema = z.object({
    dependsOnId: z.string().min(1, 'Dependency task ID is required'),
});

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, addDependencySchema);
    if (error) return error;

    try {
        // Verify task exists and belongs to user
        const task = await prisma.task.findUnique({
            where: { id: params.id },
        });

        if (!task) return errorResponse('Task not found', 404);
        if (task.userId !== session.user.id) return unauthorizedResponse();

        // Verify dependency task exists and belongs to user
        const dependsOnTask = await prisma.task.findUnique({
            where: { id: data!.dependsOnId },
        });

        if (!dependsOnTask) return errorResponse('Dependency task not found', 404);
        if (dependsOnTask.userId !== session.user.id) return unauthorizedResponse();

        // Prevent self-dependency
        if (task.id === dependsOnTask.id) {
            return errorResponse('A task cannot depend on itself', 400);
        }

        // Check for circular dependencies
        const hasCircular = await checkCircularDependency(
            data!.dependsOnId,
            params.id
        );
        if (hasCircular) {
            return errorResponse('Circular dependency detected', 400);
        }

        // Create dependency
        const dependency = await prisma.taskDependency.create({
            data: {
                taskId: params.id,
                dependsOnId: data!.dependsOnId,
            },
            include: {
                dependsOn: {
                    select: { id: true, title: true, completed: true, status: true },
                },
            },
        });

        return successResponse(dependency, 201);
    } catch (error: any) {
        console.error('Failed to add dependency:', error);
        if (error?.code === 'P2002') {
            return errorResponse('Dependency already exists', 409);
        }
        return errorResponse('Internal Server Error', 500);
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        // Verify task belongs to user
        const task = await prisma.task.findUnique({
            where: { id: params.id },
        });

        if (!task) return errorResponse('Task not found', 404);
        if (task.userId !== session.user.id) return unauthorizedResponse();

        // Get all dependencies for this task
        const dependencies = await prisma.taskDependency.findMany({
            where: { taskId: params.id },
            include: {
                dependsOn: {
                    select: { id: true, title: true, completed: true, status: true },
                },
            },
        });

        return successResponse(dependencies);
    } catch (error) {
        console.error('Failed to fetch dependencies:', error);
        return errorResponse('Internal Server Error', 500);
    }
}

// Helper function to check for circular dependencies
async function checkCircularDependency(
    startTaskId: string,
    targetTaskId: string,
    visited: Set<string> = new Set()
): Promise<boolean> {
    if (startTaskId === targetTaskId) return true;
    if (visited.has(startTaskId)) return false;

    visited.add(startTaskId);

    const dependencies = await prisma.taskDependency.findMany({
        where: { taskId: startTaskId },
        select: { dependsOnId: true },
    });

    for (const dep of dependencies) {
        if (await checkCircularDependency(dep.dependsOnId, targetTaskId, visited)) {
            return true;
        }
    }

    return false;
}
