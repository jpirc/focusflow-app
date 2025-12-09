import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    getAuthSession,
    successResponse,
    unauthorizedResponse,
    errorResponse,
} from '@/lib/api/route_utils';

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; dependencyId: string } }
) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        // Find the dependency
        const dependency = await prisma.taskDependency.findUnique({
            where: {
                id: params.dependencyId,
            },
            include: {
                task: true,
            },
        });

        if (!dependency) return errorResponse('Dependency not found', 404);

        // Verify the task belongs to the user
        if (dependency.task.userId !== session.user.id) {
            return unauthorizedResponse();
        }

        // Verify this dependency belongs to the task
        if (dependency.taskId !== params.id) {
            return errorResponse('Dependency does not belong to this task', 400);
        }

        // Delete the dependency
        await prisma.taskDependency.delete({
            where: { id: params.dependencyId },
        });

        return successResponse({ success: true });
    } catch (error) {
        console.error('Failed to delete dependency:', error);
        return errorResponse('Internal Server Error', 500);
    }
}
