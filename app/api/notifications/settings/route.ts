/**
 * Notification Settings API
 * GET: Fetch user's notification settings (creates defaults if none exist)
 * POST: Update user's notification settings
 * PUT: Update user's notification settings (alias for POST)
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
    browserEnabled: z.boolean().optional(),
    pomodoroEnabled: z.boolean().optional(),
    rolloverEnabled: z.boolean().optional(),
    dependencyEnabled: z.boolean().optional(),
    taskAgeWarningsEnabled: z.boolean().optional(),
    dailySummaryEnabled: z.boolean().optional(),
    scheduledReminderEnabled: z.boolean().optional(),
    reminderMinutesBefore: z.number().min(0).max(60).optional(),
    dailySummaryTime: z.string().nullable().optional(),
});

/**
 * GET /api/notifications/settings
 * Fetch user's notification settings, create defaults if none exist
 */
export async function GET(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        let settings = await prisma.userNotificationSettings.findUnique({
            where: { userId: session.user.id },
        });

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.userNotificationSettings.create({
                data: {
                    userId: session.user.id,
                    browserEnabled: false,
                    pomodoroEnabled: true,
                    rolloverEnabled: true,
                    dependencyEnabled: true,
                    taskAgeWarningsEnabled: false,
                    dailySummaryEnabled: false,
                    scheduledReminderEnabled: true,
                    reminderMinutesBefore: 0,
                    dailySummaryTime: null,
                },
            });
        }

        return successResponse(settings);
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        return errorResponse('Failed to fetch notification settings', 500);
    }
}

/**
 * POST /api/notifications/settings
 * Update user's notification settings
 */
export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, settingsSchema);
    if (error || !data) {
        return error || errorResponse('Invalid request data', 400);
    }

    try {
        const settings = await prisma.userNotificationSettings.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                ...data,
            },
            update: data,
        });

        return successResponse(settings);
    } catch (error) {
        console.error('Error updating notification settings:', error);
        return errorResponse('Failed to update notification settings', 500);
    }
}

/**
 * PUT /api/notifications/settings
 * Update user's notification settings (alias for POST)
 */
export async function PUT(req: NextRequest) {
    return POST(req);
}
