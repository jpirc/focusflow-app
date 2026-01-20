const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [] });

async function migrateTasks() {
  console.log('Starting task migration...\n');
  
  try {
    // 1. Move all 'anytime' tasks to 'inbox'
    console.log('1. Migrating anytime tasks to inbox...');
    const anytimeResult = await prisma.task.updateMany({
      where: {
        timeBlock: 'anytime'
      },
      data: {
        timeBlock: 'inbox'
      }
    });
    console.log(`   ✓ Migrated ${anytimeResult.count} anytime tasks to inbox`);
    
    // 2. Fix tasks with scheduledHour but missing scheduledMinute
    console.log('\n2. Adding default scheduledMinute to tasks...');
    const missingMinuteResult = await prisma.task.updateMany({
      where: {
        scheduledHour: { not: null },
        scheduledMinute: null
      },
      data: {
        scheduledMinute: 0
      }
    });
    console.log(`   ✓ Fixed ${missingMinuteResult.count} tasks with missing scheduledMinute`);
    
    // 3. Clear scheduled time from inbox tasks
    console.log('\n3. Clearing scheduled times from inbox tasks...');
    const inboxResult = await prisma.task.updateMany({
      where: {
        timeBlock: 'inbox',
        OR: [
          { scheduledHour: { not: null } },
          { scheduledMinute: { not: null } }
        ]
      },
      data: {
        scheduledHour: null,
        scheduledMinute: null
      }
    });
    console.log(`   ✓ Cleared scheduled times from ${inboxResult.count} inbox tasks`);
    
    // 4. Summary statistics
    console.log('\n📊 Summary:');
    const totalTasks = await prisma.task.count();
    const inboxTasks = await prisma.task.count({ where: { timeBlock: 'inbox' } });
    const morningTasks = await prisma.task.count({ where: { timeBlock: 'morning' } });
    const afternoonTasks = await prisma.task.count({ where: { timeBlock: 'afternoon' } });
    const eveningTasks = await prisma.task.count({ where: { timeBlock: 'evening' } });
    const scheduledTasks = await prisma.task.count({ 
      where: { scheduledHour: { not: null } } 
    });
    
    console.log(`   Total tasks: ${totalTasks}`);
    console.log(`   - Inbox: ${inboxTasks}`);
    console.log(`   - Morning: ${morningTasks}`);
    console.log(`   - Afternoon: ${afternoonTasks}`);
    console.log(`   - Evening: ${eveningTasks}`);
    console.log(`   - Scheduled on timeline: ${scheduledTasks}`);
    
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateTasks();
