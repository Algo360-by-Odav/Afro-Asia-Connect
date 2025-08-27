const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserRole() {
  try {
    console.log('🔍 Checking user roles in database...\n');
    
    // Get all users and their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        user_type: true,
        isAdmin: true
      }
    });
    
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role || 'null'}, User_Type: ${user.user_type || 'null'}, Admin: ${user.isAdmin}`);
    });
    
    // Check if we have any sellers
    const sellers = users.filter(u => u.role === 'seller' || u.user_type === 'seller');
    console.log(`\n📊 Found ${sellers.length} seller(s)`);
    
    if (sellers.length === 0) {
      console.log('\n⚠️  No sellers found! Creating a test seller...');
      
      // Create a test seller user
      const testSeller = await prisma.user.create({
        data: {
          email: 'testseller@afroasiaconnect.com',
          firstName: 'Test',
          lastName: 'Seller',
          role: 'seller',
          user_type: 'seller',
          isAdmin: false,
          password: '$2b$10$dummy.hash.for.testing' // This would normally be properly hashed
        }
      });
      
      console.log(`✅ Created test seller: ${testSeller.email} (ID: ${testSeller.id})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUserRole();
