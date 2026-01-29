import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTodayInTimezone, getCurrentHourInTimezone, formatDateInTimezone } from '@/lib/utils/timezone';

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
    
    // Get user's timezone setting
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTimezone = user?.timezone || 'America/Chicago';
    
    // Use timezone-aware date calculations
    const today = getTodayInTimezone(userTimezone);
    
    // Calculate dates
    const todayDate = new Date();
    const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Don't do any rollover on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({
        message: 'No rollover on weekends',
        count: 0,
        tasks: [],
      });
    }
    
    const currentHour = getCurrentHourInTimezone(userTimezone);

    const rolledOverTasks: Array<{ id: string; title: string; originalDate: string | null }> = [];

    // Special handling for Friday: roll incomplete tasks to Monday (but only after 10pm)
    if (dayOfWeek === 5 && currentHour >= 22) { // Friday after 10pm (22:00)
      // Calculate Monday (3 days forward)
      const mondayDate = new Date(todayDate);
      mondayDate.setDate(mondayDate.getDate() + 3);
      const mondayStr = formatDateInTimezone(mondayDate, userTimezone);
      
      // Roll Friday's incomplete tasks to Monday
      const fridayTasks = await prisma.task.findMany({
        where: {
          userId,
          date: today,
          status: { notIn: ['completed'] },
        },
        select: { id: true, title: true, date: true, timeBlock: true },
      });

      for (const task of fridayTasks) {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            date: mondayStr,
            timeBlock: 'anytime', // Put in anytime bucket to be rescheduled
            scheduledHour: null, // Clear specific time, let user reschedule
            scheduledMinute: null,
            rolloverCount: { increment: 1 },
            status: 'pending', // Reset to pending from in-progress if needed
          },
        });
        rolledOverTasks.push({ id: task.id, title: task.title, originalDate: task.date });
      }
    } else if (dayOfWeek !== 5) { // Not Friday - handle normal weekday rollover
      // For Monday-Thursday: roll previous days' tasks to today
      if (dayOfWeek === 1) { // Monday - roll Friday, Saturday, Sunday to today
        // Get Friday's date
        const fridayDate = new Date(todayDate);
        fridayDate.setDate(fridayDate.getDate() - 3);
        const fridayStr = formatDateInTimezone(fridayDate, userTimezone);
        
        // Get Saturday's date
        const saturdayDate = new Date(todayDate);
        saturdayDate.setDate(saturdayDate.getDate() - 2);
        const saturdayStr = formatDateInTimezone(saturdayDate, userTimezone);
        
        // Get Sunday's date
        const sundayDate = new Date(todayDate);
        sundayDate.setDate(sundayDate.getDate() - 1);
        const sundayStr = formatDateInTimezone(sundayDate, userTimezone);
        
        // Roll all weekend tasks to Monday
        const weekendTasks = await prisma.task.findMany({
          where: {
            userId,
            date: { in: [fridayStr, saturdayStr, sundayStr] },
            status: { notIn: ['completed'] },
          },
          select: { id: true, title: true, date: true, timeBlock: true },
        });

        for (const task of weekendTasks) {
          await prisma.task.update({
            where: { id: task.id },
            data: {
              date: today,
              timeBlock: 'anytime', // Put in anytime bucket to be rescheduled
              scheduledHour: null, // Clear specific time, let user reschedule
              scheduledMinute: null,
              rolloverCount: { increment: 1 },
              status: 'pending', // Reset to pending from in-progress if needed
            },
          });
          rolledOverTasks.push({ id: task.id, title: task.title, originalDate: task.date });
        }
      } else {
        // Tuesday-Thursday: roll yesterday's tasks to today
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = formatDateInTimezone(yesterdayDate, userTimezone);
        
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
              timeBlock: 'anytime', // Put in anytime bucket to be rescheduled
              scheduledHour: null, // Clear specific time, let user reschedule
              scheduledMinute: null,
              rolloverCount: { increment: 1 },
              status: 'pending', // Reset to pending from in-progress if needed
            },
          });
          rolledOverTasks.push({ id: task.id, title: task.title, originalDate: task.date });
        }
      }
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
