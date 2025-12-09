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

const createProjectSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color code'),
    icon: z.string().optional(),
    sortOrder: z.number().optional(),
});

export async function GET(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        const projects = await prisma.project.findMany({
            where: { userId: session.user.id },
            orderBy: { sortOrder: 'asc' },
        });
        return successResponse(projects);
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        return errorResponse('Internal Server Error', 500);
    }
}

export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, createProjectSchema);
    if (error) return error;

    try {
        const project = await prisma.project.create({
            data: {
                ...data!,
                userId: session.user.id,
            },
        });
        return successResponse(project, 201);
    } catch (error) {
        console.error('Failed to create project:', error);
        return errorResponse('Internal Server Error', 500);
    }
}
