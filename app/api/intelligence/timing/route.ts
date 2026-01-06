/**
 * Task Timing Insights API
 * 
 * Analyzes actual vs estimated time to help users calibrate planning
 */

import { NextRequest } from 'next/server';
import { getAuthSession, unauthorizedResponse, successResponse } from '@/lib/api/route_utils';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) {
        return unauthorizedResponse();
    }

    try {
        // Get completed tasks with timing data from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const tasks = await prisma.task.findMany({
            where: {
                userId: session.user.id,
                status: 'completed',
                completedAt: {
                    gte: thirtyDaysAgo,
                },
                estimatedMinutes: {
                    gt: 0,
                },
                actualMinutes: {
                    gt: 0,
                },
            },
            select: {
                id: true,
                title: true,
                estimatedMinutes: true,
                actualMinutes: true,
                priority: true,
                energyLevel: true,
                projectId: true,
                completedAt: true,
            },
            orderBy: {
                completedAt: 'desc',
            },
        });

        if (tasks.length === 0) {
            return successResponse({
                hasData: false,
                message: 'Complete some tasks with time estimates to see insights',
            });
        }

        // Calculate accuracy metrics
        const accuracyData = tasks.map(task => {
            const estimated = task.estimatedMinutes;
            const actual = task.actualMinutes!;
            const difference = actual - estimated;
            const percentageOff = ((difference / estimated) * 100);
            
            return {
                taskId: task.id,
                title: task.title,
                estimated,
                actual,
                difference,
                percentageOff,
                isAccurate: Math.abs(percentageOff) <= 20, // Within 20% is "accurate"
                priority: task.priority,
                energyLevel: task.energyLevel,
                projectId: task.projectId,
            };
        });

        // Overall statistics
        const totalTasks = tasks.length;
        const accurateTasks = accuracyData.filter(t => t.isAccurate).length;
        const accuracyRate = (accurateTasks / totalTasks) * 100;

        const avgEstimated = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / totalTasks;
        const avgActual = tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0) / totalTasks;
        const avgDifference = avgActual - avgEstimated;
        const avgPercentageOff = (avgDifference / avgEstimated) * 100;

        // Categorize estimation tendency
        const overestimated = accuracyData.filter(t => t.difference < -5).length;
        const underestimated = accuracyData.filter(t => t.difference > 5).length;
        const onTime = totalTasks - overestimated - underestimated;

        // Pattern by priority
        const byPriority = ['low', 'medium', 'high', 'urgent'].map(priority => {
            const priorityTasks = accuracyData.filter(t => t.priority === priority);
            if (priorityTasks.length === 0) return null;

            const avgDiff = priorityTasks.reduce((sum, t) => sum + t.percentageOff, 0) / priorityTasks.length;
            return {
                priority,
                count: priorityTasks.length,
                avgPercentageOff: avgDiff,
                tendency: avgDiff > 20 ? 'underestimate' : avgDiff < -20 ? 'overestimate' : 'accurate',
            };
        }).filter(Boolean);

        // Pattern by energy level
        const byEnergy = ['low', 'medium', 'high'].map(energy => {
            const energyTasks = accuracyData.filter(t => t.energyLevel === energy);
            if (energyTasks.length === 0) return null;

            const avgDiff = energyTasks.reduce((sum, t) => sum + t.percentageOff, 0) / energyTasks.length;
            return {
                energyLevel: energy,
                count: energyTasks.length,
                avgPercentageOff: avgDiff,
                tendency: avgDiff > 20 ? 'underestimate' : avgDiff < -20 ? 'overestimate' : 'accurate',
            };
        }).filter(Boolean);

        // Recent trend (last 7 days vs previous)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentTasks = accuracyData.filter(t => {
            const completedAt = tasks.find(task => task.id === t.taskId)?.completedAt;
            return completedAt && new Date(completedAt) >= sevenDaysAgo;
        });

        const recentAccuracy = recentTasks.length > 0
            ? (recentTasks.filter(t => t.isAccurate).length / recentTasks.length) * 100
            : null;

        // Generate insights
        const insights: string[] = [];

        if (avgPercentageOff > 30) {
            insights.push(`You tend to underestimate by ${Math.round(avgPercentageOff)}%. Try adding buffer time.`);
        } else if (avgPercentageOff < -30) {
            insights.push(`You tend to overestimate by ${Math.round(Math.abs(avgPercentageOff))}%. You might be faster than you think!`);
        } else {
            insights.push(`Your estimates are generally accurate (±${Math.round(Math.abs(avgPercentageOff))}%).`);
        }

        if (accuracyRate >= 70) {
            insights.push(`${Math.round(accuracyRate)}% of your estimates are within 20% - great planning!`);
        } else if (accuracyRate >= 50) {
            insights.push(`${Math.round(accuracyRate)}% accuracy. You're improving - keep tracking!`);
        } else {
            insights.push(`Only ${Math.round(accuracyRate)}% accurate. Focus on one task type to calibrate better.`);
        }

        // Pattern-specific insights
        const worstPriority = byPriority.reduce((worst, current) => {
            if (!current || !worst) return current || worst;
            return Math.abs(current.avgPercentageOff) > Math.abs(worst.avgPercentageOff) ? current : worst;
        }, null as any);

        if (worstPriority && Math.abs(worstPriority.avgPercentageOff) > 30) {
            insights.push(`${worstPriority.priority} priority tasks are hardest to estimate (${Math.round(Math.abs(worstPriority.avgPercentageOff))}% off).`);
        }

        if (recentAccuracy !== null && accuracyRate > 0) {
            const trend = recentAccuracy - accuracyRate;
            if (trend > 10) {
                insights.push(`📈 You're improving! Recent estimates are ${Math.round(trend)}% more accurate.`);
            } else if (trend < -10) {
                insights.push(`Recent estimates are less accurate. Take a moment to reflect before estimating.`);
            }
        }

        return successResponse({
            hasData: true,
            summary: {
                totalTasks,
                accuracyRate: Math.round(accuracyRate),
                avgEstimated: Math.round(avgEstimated),
                avgActual: Math.round(avgActual),
                avgDifference: Math.round(avgDifference),
                avgPercentageOff: Math.round(avgPercentageOff),
                tendency: avgPercentageOff > 20 ? 'underestimate' : avgPercentageOff < -20 ? 'overestimate' : 'accurate',
            },
            breakdown: {
                overestimated,
                underestimated,
                onTime,
            },
            patterns: {
                byPriority,
                byEnergy,
            },
            recentTrend: recentAccuracy !== null ? {
                last7Days: Math.round(recentAccuracy),
                overall: Math.round(accuracyRate),
                change: Math.round(recentAccuracy - accuracyRate),
            } : null,
            insights,
            recentTasks: accuracyData.slice(0, 5).map(t => ({
                title: t.title,
                estimated: t.estimated,
                actual: t.actual,
                difference: Math.round(t.difference),
                percentageOff: Math.round(t.percentageOff),
            })),
        });

    } catch (error) {
        console.error('Timing insights error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch timing insights' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
