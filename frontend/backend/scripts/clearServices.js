const prisma = require('../prismaClient');

async function clearServices() {
  try {
    console.log('🗑️ Clearing existing services...');
    
    const result = await prisma.service.deleteMany();
    console.log(`✅ Deleted ${result.count} existing services`);
    
    console.log('📋 Now you can run seedServices.js to create all services');
    
  } catch (error) {
    console.error('❌ Error clearing services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearServices();
