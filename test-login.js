const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin(email, password) {
  console.log(`\nTesting login for: ${email}`);
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return false;
    }

    console.log('✓ User found:', user.email);

    if (!user.passwordHash) {
      console.log('❌ User has no password hash (OAuth only account?)');
      return false;
    }

    console.log('✓ Password hash exists');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (isValid) {
      console.log('✅ Password is correct - login should work!');
      return true;
    } else {
      console.log('❌ Password is incorrect');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node test-login.js <email> <password>');
  process.exit(1);
}

testLogin(email, password);
