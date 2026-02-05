/**
 * One-time script to fix notification settings defaults
 * Run with: npx tsx scripts/fix-notification-defaults.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating notification settings defaults...');

  const result = await prisma.userNotificationSettings.updateMany({
    where: {
      pomodoroEnabled: false,
    },
    data: {
      pomodoroEnabled: true,
    },
  });

  console.log(`✅ Updated ${result.count} user(s) notification settings`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
