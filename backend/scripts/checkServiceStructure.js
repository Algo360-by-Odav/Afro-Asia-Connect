const prisma = require('../prismaClient');

async function checkServiceStructure() {
  try {
    console.log('🔍 Checking existing service structure...');
    
    const service = await prisma.service.findFirst();
    
    if (service) {
      console.log('📋 Service structure:');
      console.log(JSON.stringify(service, null, 2));
    } else {
      console.log('❌ No services found in database');
    }

  } catch (error) {
    console.error('❌ Error checking service structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiceStructure();
