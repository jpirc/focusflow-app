/**
 * Start Pomodoro Session API
 * POST: Create a new pomodoro session record
 */

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

const startSessionSchema = z.object({
    taskId: z.string().optional(),
    duration: z.number().min(1).max(120), // minutes
});

/**
 * POST /api/pomodoro/start
 * Create a new pomodoro session
 */
export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, startSessionSchema);
    if (error || !data) {
        return error || errorResponse('Invalid request data', 400);
    }

    try {
        // Get current session number (how many pomodoros today?)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySessions = await prisma.pomodoroSession.count({
            where: {
                userId: session.user.id,
                startedAt: {
                    gte: today,
                },
                completed: true,
            },
        });

        // Session number cycles 1-4
        const sessionNumber = (todaySessions % 4) + 1;

        // Create the session
        const pomodoroSession = await prisma.pomodoroSession.create({
            data: {
                userId: session.user.id,
                taskId: data.taskId,
                startedAt: new Date(),
                plannedDuration: data.duration,
                sessionNumber,
                timeOfDay: new Date().getHours(),
            },
        });

        // Update task status to in-progress if task is specified
        if (data.taskId) {
            await prisma.task.update({
                where: { id: data.taskId },
                data: {
                    status: 'in-progress',
                    startedAt: new Date(),
                },
            });

            // Track event
            await prisma.taskEvent.create({
                data: {
                    userId: session.user.id,
                    taskId: data.taskId,
                    eventType: 'pomodoro_started',
                    metadata: {
                        duration: data.duration,
                        sessionNumber,
                    },
                },
            });
        }

        return successResponse({
            sessionId: pomodoroSession.id,
            startedAt: pomodoroSession.startedAt.toISOString(),
            duration: data.duration,
            sessionNumber,
        }, 201);
    } catch (error) {
        console.error('Error starting pomodoro session:', error);
        return errorResponse('Failed to start session', 500);
    }
}
