const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function verifyAdminUser() {
  try {
    console.log('🔍 Verifying admin user...');

    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@afroasiaconnect.com' },
      select: {
        id: true,
        email: true,
        role: true,
        isAdmin: true,
        isActive: true,
        firstName: true,
        lastName: true,
        password: true
      }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🆔 ID: ${adminUser.id}`);
    console.log(`👤 Role: ${adminUser.role}`);
    console.log(`🔑 Is Admin: ${adminUser.isAdmin}`);
    console.log(`✅ Is Active: ${adminUser.isActive}`);
    console.log(`👤 Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`🔒 Password Hash: ${adminUser.password ? 'Present' : 'Missing'}`);

    // Test password verification
    const testPassword = 'Admin123!';
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
    console.log(`🔐 Password Test (Admin123!): ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!adminUser.isAdmin) {
      console.log('⚠️  User exists but isAdmin is false. Updating...');
      await prisma.user.update({
        where: { email: 'admin@afroasiaconnect.com' },
        data: { isAdmin: true, role: 'ADMIN' }
      });
      console.log('✅ Updated user to admin status');
    }

    if (!adminUser.isActive) {
      console.log('⚠️  User exists but is inactive. Activating...');
      await prisma.user.update({
        where: { email: 'admin@afroasiaconnect.com' },
        data: { isActive: true }
      });
      console.log('✅ Activated user account');
    }

  } catch (error) {
    console.error('❌ Error verifying admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminUser();
