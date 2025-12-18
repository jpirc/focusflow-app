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

const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    projectId: z.string().optional(),
    parentTaskId: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.null()).optional(),
    timeBlock: z.enum(['anytime', 'morning', 'afternoon', 'evening']).optional().or(z.null()).optional(),
    estimatedMinutes: z.number().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    energyLevel: z.enum(['low', 'medium', 'high']).optional(),
    icon: z.string().optional(),
    aiGenerated: z.boolean().optional(),
    completed: z.boolean().optional(),
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
                { priority: 'desc' },
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

    const { data, error } = await validateRequest(req, createTaskSchema);
    if (error) return error;

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

        const task = await prisma.task.create({
            data: taskData,
        });

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
