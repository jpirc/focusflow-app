/**
 * Suggestion Response API
 * PATCH /api/intelligence/suggestions/[id] - Respond to a suggestion
 */

import { NextRequest } from 'next/server';
import { 
    getAuthSession, 
    successResponse, 
    unauthorizedResponse, 
    errorResponse,
    validateRequest,
} from '@/lib/api/route_utils';
import { z } from 'zod';
import { intelligence } from '@/lib/intelligence';

const responseSchema = z.object({
    accepted: z.boolean(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * PATCH - Respond to a suggestion (accept or dismiss)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();
    
    const { id } = await params;
    const { data, error } = await validateRequest(req, responseSchema);
    if (error) return error;
    if (!data) return errorResponse('Invalid request body');
    
    try {
        await intelligence.respondToSuggestion(id, data.accepted);
        return successResponse({ success: true });
    } catch (error) {
        console.error('Failed to respond to suggestion:', error);
        return errorResponse('Failed to respond to suggestion');
    }
}
