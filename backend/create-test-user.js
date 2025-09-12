const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'testseller123@gmail.com' }
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('testseller123', salt);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'testseller123@gmail.com',
        password: hashedPassword,
        role: 'SUPPLIER',
        firstName: 'Test',
        lastName: 'Seller',
        isActive: true,
        isVerified: true
      }
    });

    console.log('Test user created successfully:');
    console.log('Email:', user.email);
    console.log('ID:', user.id);
    console.log('Role:', user.role);
    console.log('Password: testseller123');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
