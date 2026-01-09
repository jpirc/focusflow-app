/**
 * Complete Pomodoro Session API
 * POST: Save completed or abandoned pomodoro session
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

const completeSessionSchema = z.object({
    sessionId: z.string().optional(),
    taskId: z.string().optional(),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime().optional(),
    plannedDuration: z.number(), // minutes
    actualDuration: z.number().optional(), // minutes
    completed: z.boolean(),
    abandoned: z.boolean(),
    pausedDuration: z.number().default(0), // seconds
    breakTaken: z.boolean().default(false),
    breakType: z.enum(['short', 'long']).optional(),
    breakDuration: z.number().optional(), // minutes
    sessionNumber: z.number().min(1).max(10),
    timeOfDay: z.number().min(0).max(23),
});

/**
 * POST /api/pomodoro/complete
 * Save a completed or abandoned pomodoro session
 */
export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, completeSessionSchema);
    if (error || !data) {
        return error || errorResponse('Invalid request data', 400);
    }

    try {
        let pomodoroSession;

        if (data.sessionId) {
            // Update existing session
            pomodoroSession = await prisma.pomodoroSession.update({
                where: { id: data.sessionId },
                data: {
                    endedAt: data.endedAt ? new Date(data.endedAt) : new Date(),
                    actualDuration: data.actualDuration || data.plannedDuration,
                    completed: data.completed,
                    abandoned: data.abandoned,
                    pausedDuration: data.pausedDuration,
                    breakTaken: data.breakTaken,
                    breakType: data.breakType,
                    breakDuration: data.breakDuration,
                },
            });
        } else {
            // Create new session (in case start wasn't called)
            pomodoroSession = await prisma.pomodoroSession.create({
                data: {
                    userId: session.user.id,
                    taskId: data.taskId,
                    startedAt: new Date(data.startedAt),
                    endedAt: data.endedAt ? new Date(data.endedAt) : new Date(),
                    plannedDuration: data.plannedDuration,
                    actualDuration: data.actualDuration || data.plannedDuration,
                    completed: data.completed,
                    abandoned: data.abandoned,
                    pausedDuration: data.pausedDuration,
                    breakTaken: data.breakTaken,
                    breakType: data.breakType,
                    breakDuration: data.breakDuration,
                    sessionNumber: data.sessionNumber,
                    timeOfDay: data.timeOfDay,
                },
            });
        }

        // Update task with actual minutes if task is specified
        if (data.taskId && data.completed) {
            const task = await prisma.task.findUnique({
                where: { id: data.taskId },
                select: { actualMinutes: true },
            });

            const currentActualMinutes = task?.actualMinutes || 0;
            const newActualMinutes = currentActualMinutes + (data.actualDuration || data.plannedDuration);

            await prisma.task.update({
                where: { id: data.taskId },
                data: {
                    actualMinutes: newActualMinutes,
                },
            });

            // Track event
            await prisma.taskEvent.create({
                data: {
                    userId: session.user.id,
                    taskId: data.taskId,
                    eventType: data.completed ? 'pomodoro_completed' : 'pomodoro_abandoned',
                    metadata: {
                        plannedDuration: data.plannedDuration,
                        actualDuration: data.actualDuration,
                        sessionNumber: data.sessionNumber,
                        pausedDuration: data.pausedDuration,
                    },
                },
            });
        }

        return successResponse({
            sessionId: pomodoroSession.id,
            message: data.completed ? 'Pomodoro completed!' : 'Session saved',
        });
    } catch (error) {
        console.error('Error saving pomodoro session:', error);
        return errorResponse('Failed to save session', 500);
    }
}
