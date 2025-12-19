/**
 * Intelligence API - Get suggestions and insights
 * GET /api/intelligence/suggestions - Get active suggestions
 * POST /api/intelligence/suggestions - Generate new suggestions
 * GET /api/intelligence/insights - Get learned insights
 */

import { NextRequest } from 'next/server';
import { 
    getAuthSession, 
    successResponse, 
    unauthorizedResponse, 
    errorResponse,
} from '@/lib/api/route_utils';
import { prisma } from '@/lib/prisma';
import { intelligence } from '@/lib/intelligence';

/**
 * GET - Fetch suggestions for the current user
 */
export async function GET(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'suggestions' or 'insights'
    
    try {
        if (type === 'insights') {
            const insights = await intelligence.getInsights(session.user.id);
            return successResponse(insights);
        }
        
        // Default: get suggestions
        const status = searchParams.get('status') as 'pending' | 'accepted' | 'dismissed' | undefined;
        const suggestions = await intelligence.getSuggestions(session.user.id, status);
        return successResponse(suggestions);
    } catch (error) {
        console.error('Failed to fetch intelligence data:', error);
        return errorResponse('Failed to fetch intelligence data');
    }
}

/**
 * POST - Generate new suggestions based on current tasks
 */
export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();
    
    try {
        // Fetch user's current tasks
        const tasks = await prisma.task.findMany({
            where: {
                userId: session.user.id,
                parentTaskId: null, // Only parent tasks
            },
            include: {
                subtasks: true,
                dependencies: true,
            },
        });
        
        // First, analyze patterns (updates insights in DB)
        await intelligence.analyzePatterns(session.user.id);
        
        // Map database tasks to Task type for intelligence service
        const mappedTasks = tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            projectId: t.projectId,
            parentTaskId: t.parentTaskId,
            date: t.date || undefined,
            timeBlock: t.timeBlock as 'morning' | 'afternoon' | 'evening' | 'anytime',
            status: t.status as 'pending' | 'in-progress' | 'completed' | 'skipped' | 'carried-over',
            priority: t.priority as 'low' | 'medium' | 'high' | 'urgent',
            energyLevel: t.energyLevel as 'low' | 'medium' | 'high',
            estimatedMinutes: t.estimatedMinutes,
            actualMinutes: t.actualMinutes,
            rolloverCount: t.rolloverCount,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
            subtasks: t.subtasks.map(s => ({
                id: s.id,
                title: s.title,
                completed: s.completed,
                estimatedMinutes: s.estimatedMinutes,
            })),
            dependencies: t.dependencies,
        }));
        
        // Then generate suggestions based on patterns and tasks
        const suggestions = await intelligence.generateSuggestions(
            session.user.id,
            mappedTasks as any // Safe cast - we've mapped all required fields
        );
        
        return successResponse(suggestions, 201);
    } catch (error) {
        console.error('Failed to generate suggestions:', error);
        return errorResponse('Failed to generate suggestions');
    }
}
