const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log('🔧 Fixing admin user password...');

    const adminEmail = 'admin@afroasiaconnect.com';
    const newPassword = 'Admin123!';
    
    // Hash the password properly
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔒 Generated new password hash');
    
    // Update the admin user password
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { 
        password: hashedPassword,
        isAdmin: true,
        role: 'ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Updated admin user password successfully');
    
    // Verify the password works
    const testPassword = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`🔐 Password verification test: ${testPassword ? '✅ Success' : '❌ Failed'}`);
    
    console.log('\n🎉 Admin password fixed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@afroasiaconnect.com');
    console.log('🔑 Password: Admin123!');
    console.log('🌐 Login URL: http://localhost:3000/auth');
    console.log('📊 Admin Panel: http://localhost:3000/admin/analytics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
