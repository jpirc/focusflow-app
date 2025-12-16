import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/tasks/rollover
 * Automatically moves incomplete tasks from past dates to today's "anytime" slot
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Find all incomplete tasks with dates before today
    const tasksToRollover = await prisma.task.findMany({
      where: {
        userId,
        date: {
          not: null,
          lt: today, // Less than today
        },
        status: {
          notIn: ['completed'], // Don't roll over completed tasks
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
      },
    });

    if (tasksToRollover.length === 0) {
      return NextResponse.json({
        message: 'No tasks to roll over',
        count: 0,
        tasks: [],
      });
    }

    // Update all tasks to today's date in "anytime" slot
    const updateResult = await prisma.task.updateMany({
      where: {
        id: {
          in: tasksToRollover.map((t) => t.id),
        },
      },
      data: {
        date: today,
        timeBlock: 'anytime',
        rolloverCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      message: `Rolled over ${tasksToRollover.length} task${tasksToRollover.length === 1 ? '' : 's'} to today`,
      count: tasksToRollover.length,
      tasks: tasksToRollover.map((t) => ({
        id: t.id,
        title: t.title,
        originalDate: t.date,
      })),
    });
  } catch (error: any) {
    console.error('Rollover error:', error);
    return NextResponse.json(
      { error: 'Failed to roll over tasks', details: error.message },
      { status: 500 }
    );
  }
}
