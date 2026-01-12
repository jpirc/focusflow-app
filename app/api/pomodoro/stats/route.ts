/**
 * Pomodoro Statistics API
 * GET: Fetch pomodoro statistics for a given period
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    getAuthSession,
    successResponse,
    unauthorizedResponse,
    errorResponse,
} from '@/lib/api/route_utils';

/**
 * GET /api/pomodoro/stats?period=today|week|month
 * Fetch pomodoro statistics
 */
export async function GET(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today';

    try {
        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'today':
            default:
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        // Fetch sessions
        const sessions = await prisma.pomodoroSession.findMany({
            where: {
                userId: session.user.id,
                startedAt: {
                    gte: startDate,
                },
            },
            orderBy: {
                startedAt: 'asc',
            },
        });

        // Calculate statistics
        const completed = sessions.filter(s => s.completed).length;
        const abandoned = sessions.filter(s => s.abandoned).length;
        const totalMinutes = sessions
            .filter(s => s.completed)
            .reduce((sum, s) => sum + (s.actualDuration || s.plannedDuration), 0);

        // Calculate current streak (consecutive completed pomodoros today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todaySessions = sessions.filter(s => s.startedAt >= todayStart);
        
        let currentStreak = 0;
        for (let i = todaySessions.length - 1; i >= 0; i--) {
            if (todaySessions[i].completed) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Time of day breakdown
        const timeOfDayBreakdown = sessions.reduce((acc, session) => {
            if (session.completed && session.timeOfDay !== null) {
                const hour = session.timeOfDay;
                let timeBlock: string;
                
                if (hour >= 5 && hour < 12) timeBlock = 'morning';
                else if (hour >= 12 && hour < 17) timeBlock = 'afternoon';
                else if (hour >= 17 && hour < 22) timeBlock = 'evening';
                else timeBlock = 'night';
                
                acc[timeBlock] = (acc[timeBlock] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        // Best performing time
        let bestTime = 'morning';
        let maxCount = 0;
        Object.entries(timeOfDayBreakdown).forEach(([time, count]) => {
            if (count > maxCount) {
                maxCount = count;
                bestTime = time;
            }
        });

        // Average duration
        const completedSessions = sessions.filter(s => s.completed);
        const averageDuration = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.actualDuration || s.plannedDuration), 0) / completedSessions.length)
            : 0;

        return successResponse({
            completed,
            abandoned,
            totalMinutes,
            currentStreak,
            completionRate: completed + abandoned > 0 
                ? Math.round((completed / (completed + abandoned)) * 100) 
                : 0,
            averageDuration,
            bestTime,
            timeOfDayBreakdown,
            totalSessions: sessions.length,
        });
    } catch (error) {
        console.error('Error fetching pomodoro stats:', error);
        return errorResponse('Failed to fetch statistics', 500);
    }
}
