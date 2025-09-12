const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserToSeller() {
  try {
    console.log('🔧 Updating testseller123@gmail.com role to seller...\n');
    
    // Find the specific user by email
    const user = await prisma.user.findUnique({
      where: { email: 'testseller123@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User testseller123@gmail.com not found in database');
      return;
    }
    
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Current role: ${user.role || 'null'}, user_type: ${user.user_type || 'null'}`);
    
    // Update user to be a seller
    const updatedUser = await prisma.user.update({
      where: { email: 'testseller123@gmail.com' },
      data: {
        role: 'seller',
        user_type: 'seller'
      }
    });
    
    console.log(`✅ Updated user ${updatedUser.email} to seller role`);
    console.log(`New role: ${updatedUser.role}, user_type: ${updatedUser.user_type}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserToSeller();
