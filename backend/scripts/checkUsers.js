const prisma = require('../prismaClient');

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  ID: ${user.id} - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });
    
    // Check which user IDs are missing for services (1-14)
    const existingIds = users.map(u => u.id);
    const neededIds = Array.from({length: 14}, (_, i) => i + 1);
    const missingIds = neededIds.filter(id => !existingIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log(`\n⚠️  Missing user IDs needed for services: ${missingIds.join(', ')}`);
    } else {
      console.log('\n✅ All needed user IDs (1-14) exist!');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
