import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/tasks/rollover
 * Rolls tasks forward through time blocks and days:
 * - Within same day: morning → afternoon → evening
 * - End of day: move incomplete tasks to next day's first available block
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // IMPORTANT: Use .getFullYear(), .getMonth(), .getDate() instead of .toISOString()
    // This uses the server's LOCAL timezone (not UTC) to match what the frontend sends.
    // Make sure your server's timezone (TZ environment variable) matches your local timezone,
    // or dates will be off by a day depending on time of day.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
    
    const currentHour = now.getHours();

    const rolledOverTasks: Array<{ id: string; title: string; originalDate: string | null }> = [];

    // 1. Roll over tasks from yesterday to today (into anytime bucket for replanning)
    const yesterdayTasks = await prisma.task.findMany({
      where: {
        userId,
        date: yesterdayStr,
        status: { notIn: ['completed'] },
      },
      select: { id: true, title: true, date: true, timeBlock: true },
    });

    for (const task of yesterdayTasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          date: today,
          timeBlock: 'anytime', // Reset to anytime for replanning
          rolloverCount: { increment: 1 },
        },
      });
      rolledOverTasks.push({ id: task.id, title: task.title, originalDate: task.date });
    }

    // 2. Roll tasks forward through time blocks within today
    const todayTasks = await prisma.task.findMany({
      where: {
        userId,
        date: today,
        status: { notIn: ['completed'] },
        timeBlock: { not: 'anytime' }, // Don't roll over anytime tasks
      },
      select: { id: true, title: true, date: true, timeBlock: true },
    });

    for (const task of todayTasks) {
      let newTimeBlock = task.timeBlock;
      
      // Morning (6-12) → Afternoon if it's past noon
      if (task.timeBlock === 'morning' && currentHour >= 12) {
        newTimeBlock = 'afternoon';
      }
      // Afternoon (12-17) → Evening if it's past 5pm
      else if (task.timeBlock === 'afternoon' && currentHour >= 17) {
        newTimeBlock = 'evening';
      }
      // Evening tasks stay in evening until end of day (handled by yesterday rollover)

      if (newTimeBlock !== task.timeBlock) {
        await prisma.task.update({
          where: { id: task.id },
          data: { timeBlock: newTimeBlock },
        });
        rolledOverTasks.push({ id: task.id, title: task.title, originalDate: task.date });
      }
    }

    if (rolledOverTasks.length === 0) {
      return NextResponse.json({
        message: 'No tasks to roll over',
        count: 0,
        tasks: [],
      });
    }

    if (rolledOverTasks.length === 0) {
      return NextResponse.json({
        message: 'No tasks to roll over',
        count: 0,
        tasks: [],
      });
    }

    return NextResponse.json({
      message: `Rolled over ${rolledOverTasks.length} task${rolledOverTasks.length === 1 ? '' : 's'}`,
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
