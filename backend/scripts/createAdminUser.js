const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user for AfroAsiaConnect...');

    // Admin user credentials
    const adminEmail = 'admin@afroasiaconnect.com';
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      // Update existing user to be admin
      const updatedUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          isAdmin: true,
          role: 'ADMIN',
          firstName: 'System',
          lastName: 'Administrator',
          isActive: true
        }
      });
      console.log('✅ Updated existing user to admin:', updatedUser.email);
    } else {
      // Create new admin user
      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          firstName: 'System',
          lastName: 'Administrator',
          isAdmin: true,
          isActive: true
        }
      });
      console.log('✅ Created new admin user:', adminUser.email);
    }

    // Also check if there's an existing user you want to make admin
    const currentUserEmail = 'henryoye@gmail.com'; // From your navbar
    const existingUser = await prisma.user.findUnique({
      where: { email: currentUserEmail }
    });

    if (existingUser && !existingUser.isAdmin) {
      const updatedUser = await prisma.user.update({
        where: { email: currentUserEmail },
        data: {
          isAdmin: true,
          role: 'ADMIN'
        }
      });
      console.log('✅ Updated existing user to admin:', updatedUser.email);
    }

    console.log('\n🎉 Admin setup complete!');
    console.log('\n📋 Admin Access Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Admin Panel URL: http://localhost:3000/admin/analytics');
    console.log('📧 Admin Email: admin@afroasiaconnect.com');
    console.log('🔑 Admin Password: Admin123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 Steps to access:');
    console.log('1. Go to: http://localhost:3000/auth');
    console.log('2. Login with admin credentials above');
    console.log('3. Navigate to: http://localhost:3000/admin/analytics');
    console.log('\n💡 Your existing account (henryoye@gmail.com) has also been granted admin access!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
