import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTodayInTimezone } from '@/lib/utils/timezone';

/**
 * POST /api/tasks/rollover
 * Moves incomplete past-dated tasks back into Inbox for re-planning.
 * Inbox invariant: only unscheduled/unplanned tasks live in inbox.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user's timezone setting
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTimezone = user?.timezone || 'America/Chicago';
    
    // Use timezone-aware "today" boundary for past-date detection
    const today = getTodayInTimezone(userTimezone);
    // Find incomplete parent tasks that were scheduled/planned before today
    const pastTasks = await prisma.task.findMany({
      where: {
        userId,
        date: { lt: today },
        status: { notIn: ['completed', 'skipped'] },
        parentTaskId: null,
      },
      select: { id: true, title: true, date: true },
    });

    if (pastTasks.length === 0) {
      return NextResponse.json({
        message: 'No tasks to move back to inbox',
        count: 0,
        tasks: [],
      });
    }

    const taskIds = pastTasks.map(task => task.id);

    await prisma.$transaction([
      prisma.task.updateMany({
        where: {
          id: { in: taskIds },
        },
        data: {
          date: null,
          timeBlock: 'inbox',
          scheduledHour: null,
          scheduledMinute: null,
          startTime: null,
          isFloating: false,
          status: 'pending',
          startedAt: null,
          completed: false,
          completedAt: null,
          isTopPriority: false,
          topPriorityDate: null,
          rolloverCount: { increment: 1 },
        },
      }),
      prisma.task.updateMany({
        where: {
          parentTaskId: { in: taskIds },
          status: { notIn: ['completed', 'skipped'] },
        },
        data: {
          date: null,
          timeBlock: 'inbox',
          scheduledHour: null,
          scheduledMinute: null,
          startTime: null,
          isFloating: false,
          status: 'pending',
          startedAt: null,
        },
      }),
    ]);

    const rolledOverTasks = pastTasks.map(task => ({
      id: task.id,
      title: task.title,
      originalDate: task.date,
    }));

    return NextResponse.json({
      message: `Moved ${rolledOverTasks.length} task${rolledOverTasks.length === 1 ? '' : 's'} back to inbox`,
      count: rolledOverTasks.length,
      tasks: rolledOverTasks,
    });
  } catch (error: any) {
    console.error('Rollover error:', error);
    return NextResponse.json(
      { error: 'Failed to roll over tasks', details: error.message },
      { status: 500 }
    );
  }
}
