const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUser16Password() {
  try {
    console.log('🔐 Resetting User 16 password...');
    
    // Hash the new password
    const newPassword = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user 16's password
    const updatedUser = await prisma.user.update({
      where: { id: 16 },
      data: { 
        password: hashedPassword,
        // Also update the name while we're at it
        firstName: 'Test',
        lastName: 'Provider'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    console.log('✅ Password reset successful!');
    console.log('👤 User:', updatedUser.firstName, updatedUser.lastName);
    console.log('📧 Email:', updatedUser.email);
    console.log('🔑 Role:', updatedUser.role);
    console.log('🔐 New Password:', newPassword);
    
    // Test the new password
    const user = await prisma.user.findUnique({
      where: { id: 16 },
      select: { password: true }
    });
    
    const passwordTest = await bcrypt.compare(newPassword, user.password);
    console.log('🧪 Password test:', passwordTest ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('🚨 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUser16Password();
