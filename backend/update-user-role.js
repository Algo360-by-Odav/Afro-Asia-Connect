const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserToSeller() {
  try {
    console.log('🔧 Updating user role to seller...\n');
    
    // Get the first user (or you can specify an email)
    const users = await prisma.user.findMany({
      take: 1,
      orderBy: { id: 'asc' }
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const user = users[0];
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Current role: ${user.role || 'null'}, user_type: ${user.user_type || 'null'}`);
    
    // Update user to be a seller
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
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
