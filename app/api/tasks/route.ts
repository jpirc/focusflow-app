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
import { trackTaskCreated } from '@/lib/intelligence';

const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    projectId: z.string().optional(),
    parentTaskId: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    timeBlock: z.enum(['anytime', 'morning', 'afternoon', 'evening']).nullable().optional(),
    estimatedMinutes: z.number().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    energyLevel: z.enum(['low', 'medium', 'high']).optional(),
    icon: z.string().optional(),
    aiGenerated: z.boolean().optional(),
    completed: z.boolean().optional(),
    status: z.enum(['pending', 'in-progress', 'completed', 'skipped', 'carried-over']).optional(),
    order: z.number().optional(),
});

export async function GET(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const projectId = searchParams.get('project');
    const status = searchParams.get('status');
    const inbox = searchParams.get('inbox') === 'true';

    try {
        // Fetch only parent-level tasks (not subtasks)
        const where: any = {
            userId: session.user.id,
            parentTaskId: null, // Only get parent tasks
        };

        if (date) where.date = date;
        if (projectId) where.projectId = projectId;
        if (status) where.status = status;
        if (inbox) where.date = null;

        const parentTasks = await prisma.task.findMany({
            where,
            orderBy: [
                { order: 'asc' },
                { createdAt: 'desc' },
            ],
            include: {
                project: {
                    select: { name: true, color: true, icon: true },
                },
            },
        });

        // Fetch subtasks and dependencies for all tasks in parallel
        const completeTasks = await Promise.all(
            parentTasks.map(async (task) => {
                const [subtasks, dependencies] = await Promise.all([
                    prisma.task.findMany({
                        where: { parentTaskId: task.id },
                        orderBy: { createdAt: 'asc' },
                    }),
                    prisma.taskDependency.findMany({
                        where: { taskId: task.id },
                        include: {
                            dependsOn: {
                                select: { id: true, title: true, completed: true, status: true },
                            },
                        },
                    }),
                ]);

                return {
                    ...task,
                    subtasks: subtasks || [],
                    dependencies: dependencies || [],
                    dependsOn: [], // For compatibility
                    dependents: [],
                };
            })
        );

        return successResponse(completeTasks);
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return errorResponse('Internal Server Error', 500);
    }
}

export async function POST(req: NextRequest) {

    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    // Log the raw request body for debugging
    let rawBody = null;
    try {
        rawBody = await req.json();
        console.log('TASK CREATE RAW BODY:', JSON.stringify(rawBody));
    } catch (e) {
        console.log('TASK CREATE: Failed to parse JSON body');
    }

    // Re-parse the request for validation (since req.json() can only be called once)
    const req2 = new Request(req.url, { method: req.method, headers: req.headers, body: rawBody ? JSON.stringify(rawBody) : undefined });
    const { data, error } = await validateRequest(req2, createTaskSchema);
    if (error) {
        // Log the Zod error details for debugging
        console.log('TASK CREATE ZOD ERROR:', JSON.stringify(error));
        return error;
    }

    try {
        // Build data object with only defined values
        const taskData: any = {
            title: data!.title,
            user: {
                connect: { id: session.user.id }
            }
        };

        // Only include optional fields if they are defined and not null
        if (data!.description !== undefined) taskData.description = data!.description;
        
        // Use Prisma's nested connect syntax for relations
        if (data!.projectId) {
            taskData.project = { connect: { id: data!.projectId } };
        }
        if (data!.parentTaskId) {
            taskData.parentTask = { connect: { id: data!.parentTaskId } };
        }
        
        if (data!.date !== undefined && data!.date !== null) taskData.date = data!.date;
        if (data!.timeBlock !== undefined && data!.timeBlock !== null) taskData.timeBlock = data!.timeBlock;
        if (data!.estimatedMinutes !== undefined) taskData.estimatedMinutes = data!.estimatedMinutes;
        if (data!.priority !== undefined) taskData.priority = data!.priority;
        if (data!.energyLevel !== undefined) taskData.energyLevel = data!.energyLevel;
        if (data!.icon !== undefined) taskData.icon = data!.icon;
        if (data!.aiGenerated !== undefined) taskData.aiGenerated = data!.aiGenerated;
        if (data!.completed !== undefined) taskData.completed = data!.completed;
        if (data!.status !== undefined) taskData.status = data!.status;
        if (data!.order !== undefined) taskData.order = data!.order;

        const task = await prisma.task.create({
            data: taskData,
        });

        // Track event for learning (async, non-blocking)
        trackTaskCreated(session.user.id, {
            id: task.id,
            title: task.title,
            date: task.date || undefined,
            timeBlock: task.timeBlock as 'morning' | 'afternoon' | 'evening' | 'anytime',
            projectId: task.projectId,
            priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
            energyLevel: task.energyLevel as 'low' | 'medium' | 'high',
            estimatedMinutes: task.estimatedMinutes,
            status: task.status as any,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
        } as any).catch(console.error);

        // Return task with all required fields
        const completeTask = {
            ...task,
            subtasks: [],
            dependsOn: [],
            dependents: [],
        };

        return successResponse(completeTask, 201);
    } catch (error) {
        console.error('Failed to create task:', error);
        return errorResponse('Internal Server Error', 500);
    }
}
