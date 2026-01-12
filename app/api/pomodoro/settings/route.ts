/**
 * Pomodoro Settings API
 * GET: Fetch user's pomodoro settings (creates defaults if none exist)
 * POST: Update user's pomodoro settings
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

const settingsSchema = z.object({
    workDuration: z.number().min(1).max(120).optional(),
    shortBreakDuration: z.number().min(1).max(60).optional(),
    longBreakDuration: z.number().min(1).max(60).optional(),
    pomodorosUntilLongBreak: z.number().min(1).max(10).optional(),
    autoStartBreaks: z.boolean().optional(),
    autoStartPomodoros: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
    soundVolume: z.number().min(0).max(1).optional(),
    desktopNotifications: z.boolean().optional(),
    ambientSound: z.string().nullable().optional(),
    ambientVolume: z.number().min(0).max(1).optional(),
});

/**
 * GET /api/pomodoro/settings
 * Fetch user's settings, create defaults if none exist
 */
export async function GET(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        let settings = await prisma.userPomodoroSettings.findUnique({
            where: { userId: session.user.id },
        });

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.userPomodoroSettings.create({
                data: {
                    userId: session.user.id,
                    workDuration: 25,
                    shortBreakDuration: 5,
                    longBreakDuration: 15,
                    pomodorosUntilLongBreak: 4,
                    autoStartBreaks: true,
                    autoStartPomodoros: false,
                    soundEnabled: true,
                    soundVolume: 0.5,
                    desktopNotifications: true,
                    ambientSound: null,
                    ambientVolume: 0.3,
                },
            });
        }

        return successResponse(settings);
    } catch (error) {
        console.error('Error fetching pomodoro settings:', error);
        return errorResponse('Failed to fetch settings', 500);
    }
}

/**
 * POST /api/pomodoro/settings
 * Update user's settings
 */
export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, settingsSchema);
    if (error || !data) {
        return error || errorResponse('Invalid request data', 400);
    }

    try {
        const settings = await prisma.userPomodoroSettings.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                ...data,
            },
            update: data,
        });

        return successResponse(settings);
    } catch (error) {
        console.error('Error updating pomodoro settings:', error);
        return errorResponse('Failed to update settings', 500);
    }
}
