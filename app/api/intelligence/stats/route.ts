/**
 * Analytics Stats API - Quick stats for dashboard
 * GET /api/intelligence/stats - Get completion stats
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
    getAuthSession, 
    successResponse, 
    unauthorizedResponse, 
    errorResponse,
} from '@/lib/api/route_utils';

export async function GET(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get various completion counts
        const [
            completedToday,
            completedThisWeek,
            completedThisMonth,
            totalEvents,
            tasksByTimeBlock,
            recentCompletions,
        ] = await Promise.all([
            // Completed today
            prisma.task.count({
                where: {
                    userId: session.user.id,
                    status: 'completed',
                    completedAt: {
                        gte: new Date(today + 'T00:00:00'),
                    },
                },
            }),
            // Completed this week
            prisma.task.count({
                where: {
                    userId: session.user.id,
                    status: 'completed',
                    completedAt: {
                        gte: startOfWeek,
                    },
                },
            }),
            // Completed this month
            prisma.task.count({
                where: {
                    userId: session.user.id,
                    status: 'completed',
                    completedAt: {
                        gte: startOfMonth,
                    },
                },
            }),
            // Total tracked events
            prisma.taskEvent.count({
                where: {
                    userId: session.user.id,
                },
            }),
            // Tasks by time block (for visualization)
            prisma.taskEvent.groupBy({
                by: ['timeBlock'],
                where: {
                    userId: session.user.id,
                    eventType: 'task_completed',
                    timeBlock: { not: null },
                },
                _count: { id: true },
            }),
            // Recent completions for streak calculation
            prisma.taskEvent.findMany({
                where: {
                    userId: session.user.id,
                    eventType: 'task_completed',
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
                select: {
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        // Calculate streak
        const completionDates = new Set(
            recentCompletions.map(e => e.createdAt.toISOString().split('T')[0])
        );
        let streak = 0;
        const checkDate = new Date(today);
        while (completionDates.has(checkDate.toISOString().split('T')[0])) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Format time block data
        const timeBlockData: Record<string, number> = {
            morning: 0,
            afternoon: 0,
            evening: 0,
            anytime: 0,
        };
        for (const item of tasksByTimeBlock) {
            if (item.timeBlock) {
                timeBlockData[item.timeBlock] = item._count.id;
            }
        }

        return successResponse({
            completedToday,
            completedThisWeek,
            completedThisMonth,
            totalEvents,
            streak,
            timeBlockData,
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return errorResponse('Failed to fetch stats');
    }
}
