const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: [] // Disable query logging
});

async function fixOrphanedTasks() {
  console.log('=== ORPHANED TASK CHECKER ===\n');
  
  // Check 1: Tasks with timeBlock 'inbox' but have a date
  console.log('1. Tasks in inbox with dates:');
  const inboxWithDate = await prisma.task.findMany({
    where: {
      timeBlock: 'inbox',
      date: { not: null }
    },
    select: { id: true, title: true, date: true, timeBlock: true, scheduledHour: true }
  });
  console.log(`   Found: ${inboxWithDate.length}`);
  inboxWithDate.forEach(t => console.log(`   - ${t.title} (date: ${t.date})`));
  
  // Check 2: Tasks with scheduledHour but no date
  console.log('\n2. Tasks scheduled on timeline but no date:');
  const scheduledNoDate = await prisma.task.findMany({
    where: {
      scheduledHour: { not: null },
      date: null
    },
    select: { id: true, title: true, date: true, timeBlock: true, scheduledHour: true }
  });
  console.log(`   Found: ${scheduledNoDate.length}`);
  scheduledNoDate.forEach(t => console.log(`   - ${t.title} (hour: ${t.scheduledHour}, block: ${t.timeBlock})`));
  
  // Check 3: Tasks with timeBlock (not inbox) but no date
  console.log('\n3. Tasks in time blocks (morning/afternoon/evening) but no date:');
  const blockNoDate = await prisma.task.findMany({
    where: {
      timeBlock: { in: ['morning', 'afternoon', 'evening', 'anytime'] },
      date: null
    },
    select: { id: true, title: true, date: true, timeBlock: true, scheduledHour: true }
  });
  console.log(`   Found: ${blockNoDate.length}`);
  blockNoDate.forEach(t => console.log(`   - ${t.title} (block: ${t.timeBlock}, scheduledHour: ${t.scheduledHour})`));
  
  // Fix Check 2: Scheduled tasks need inbox treatment
  if (scheduledNoDate.length > 0) {
    console.log('\n>>> Fixing scheduled tasks without dates...');
    const result = await prisma.task.updateMany({
      where: {
        scheduledHour: { not: null },
        date: null
      },
      data: {
        scheduledHour: null,
        scheduledMinute: null,
        timeBlock: 'inbox'
      }
    });
    console.log(`✓ Moved ${result.count} tasks to inbox`);
  }
  
  // Fix Check 3: Time block tasks without dates need inbox
  if (blockNoDate.length > 0) {
    console.log('\n>>> Fixing time block tasks without dates...');
    const result = await prisma.task.updateMany({
      where: {
        timeBlock: { in: ['morning', 'afternoon', 'evening', 'anytime'] },
        date: null
      },
      data: {
        timeBlock: 'inbox'
      }
    });
    console.log(`✓ Moved ${result.count} tasks to inbox`);
  }

  await prisma.$disconnect();
}

fixOrphanedTasks().catch(console.error);
