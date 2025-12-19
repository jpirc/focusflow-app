const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get a user to test with
  const user = await prisma.user.findFirst();
  if (!user) { console.log('No users found'); return; }
  
  console.log('Testing for user:', user.id);
  
  // Check what the stats API would return
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const completedToday = await prisma.task.count({
    where: {
      userId: user.id,
      status: 'completed',
      completedAt: { gte: new Date(today + 'T00:00:00') },
    },
  });
  console.log('Completed today:', completedToday);
  
  const completedThisWeek = await prisma.task.count({
    where: {
      userId: user.id,
      status: 'completed',
      completedAt: { gte: startOfWeek },
    },
  });
  console.log('Completed this week:', completedThisWeek);
  
  // Time block data from events
  const timeBlockData = await prisma.taskEvent.groupBy({
    by: ['timeBlock'],
    where: {
      userId: user.id,
      eventType: 'task_completed',
      timeBlock: { not: null },
    },
    _count: { id: true },
  });
  console.log('Time block completions:');
  timeBlockData.forEach(t => console.log('  ', t.timeBlock, ':', t._count.id));
  
  // Check insights content
  const insights = await prisma.userInsight.findMany({
    where: { userId: user.id },
    select: { insightType: true, pattern: true, confidence: true },
  });
  console.log('\nInsights:');
  insights.forEach(i => console.log('  ', i.insightType, '-', JSON.stringify(i.pattern).slice(0,60)));
  
  // Check suggestions content  
  const suggestions = await prisma.suggestion.findMany({
    where: { userId: user.id, status: 'pending' },
    select: { type: true, title: true },
  });
  console.log('\nPending Suggestions:');
  suggestions.forEach(s => console.log('  ', s.type, '-', s.title));
  
  await prisma.$disconnect();
}

main();
