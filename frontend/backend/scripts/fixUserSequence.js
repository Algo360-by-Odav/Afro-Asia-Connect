const prisma = require('../prismaClient');

async function fixUserSequence() {
  try {
    console.log('🔧 Checking and fixing user ID sequence...');
    
    // Get the maximum user ID
    const maxIdResult = await prisma.user.aggregate({
      _max: { id: true }
    });
    
    const maxId = maxIdResult._max.id || 0;
    const userCount = await prisma.user.count();
    
    console.log(`📊 Current stats:`);
    console.log(`   - Max user ID: ${maxId}`);
    console.log(`   - Total users: ${userCount}`);
    
    // Fix the sequence by setting it to the next available ID
    const nextId = maxId + 1;
    
    // Use raw SQL to reset the sequence
    await prisma.$executeRaw`SELECT setval('users_id_seq', ${nextId}, false);`;
    
    console.log(`✅ Fixed user sequence - next ID will be: ${nextId}`);
    console.log('🎉 User registration should now work correctly!');
    
  } catch (error) {
    console.error('❌ Error fixing user sequence:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserSequence();
