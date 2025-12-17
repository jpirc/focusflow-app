const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });
    
    console.log('Total users:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email}: has password = ${!!user.passwordHash}`);
    });
    
    if (users.length === 0) {
      console.log('\nNo users found. You need to register first at /register');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
