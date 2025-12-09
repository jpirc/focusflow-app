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

const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    icon: z.string().optional(),
    sortOrder: z.number().optional(),
    isArchived: z.boolean().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        const project = await prisma.project.findUnique({
            where: { id: params.id },
        });

        if (!project) return errorResponse('Project not found', 404);
        if (project.userId !== session.user.id) return unauthorizedResponse();

        return successResponse(project);
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

    const { data, error } = await validateRequest(req, updateProjectSchema);
    if (error) return error;

    try {
        // Verify ownership
        const existing = await prisma.project.findUnique({
            where: { id: params.id },
        });

        if (!existing) return errorResponse('Project not found', 404);
        if (existing.userId !== session.user.id) return unauthorizedResponse();

        const updated = await prisma.project.update({
            where: { id: params.id },
            data: data!,
        });

        return successResponse(updated);
    } catch (error) {
        console.error('Failed to update project:', error);
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
        const existing = await prisma.project.findUnique({
            where: { id: params.id },
        });

        if (!existing) return errorResponse('Project not found', 404);
        if (existing.userId !== session.user.id) return unauthorizedResponse();

        await prisma.project.delete({
            where: { id: params.id },
        });

        return successResponse({ success: true });
    } catch (error) {
        console.error('Failed to delete project:', error);
        return errorResponse('Internal Server Error', 500);
    }
}
