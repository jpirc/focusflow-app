/**
 * Intelligence Feature Settings API
 * GET: Fetch user's intelligence feature settings (creates defaults if none exist)
 * PATCH/POST: Update intelligence feature settings
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
    getAuthSession,
    successResponse,
    unauthorizedResponse,
    validateRequest,
    errorResponse,
} from '@/lib/api/route_utils';

const featureSettingsSchema = z.object({
    smartSuggestions: z.boolean().optional(),
    aiBreakdown: z.boolean().optional(),
    autoScheduling: z.boolean().optional(),
    learningEnabled: z.boolean().optional(),
    suggestionFrequency: z.enum(['minimal', 'balanced', 'proactive']).optional(),
    privacyLevel: z.enum(['full', 'limited', 'none']).optional(),
});

async function getOrCreateUserFeature(userId: string) {
    let features = await prisma.userFeature.findUnique({
        where: { userId },
    });

    if (!features) {
        features = await prisma.userFeature.create({
            data: {
                userId,
                smartSuggestions: true,
                aiBreakdown: true,
                autoScheduling: false,
                learningEnabled: true,
                suggestionFrequency: 'balanced',
                privacyLevel: 'full',
            },
        });
    }

    return features;
}

export async function GET(_req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        const features = await getOrCreateUserFeature(session.user.id);
        return successResponse(features);
    } catch (error) {
        console.error('Failed to fetch intelligence feature settings:', error);
        return errorResponse('Failed to fetch intelligence feature settings', 500);
    }
}

async function upsertFeatures(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, featureSettingsSchema);
    if (error || !data) {
        return error || errorResponse('Invalid request data', 400);
    }

    try {
        const features = await prisma.userFeature.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                ...data,
            },
            update: data,
        });

        return successResponse(features);
    } catch (e) {
        console.error('Failed to update intelligence feature settings:', e);
        return errorResponse('Failed to update intelligence feature settings', 500);
    }
}

export async function PATCH(req: NextRequest) {
    return upsertFeatures(req);
}

export async function POST(req: NextRequest) {
    return upsertFeatures(req);
}

