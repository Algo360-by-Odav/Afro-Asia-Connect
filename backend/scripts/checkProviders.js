const prisma = require('../prismaClient');

async function checkProviders() {
  try {
    console.log('👥 Checking service providers in database...');
    
    // Get all service providers
    const providers = await prisma.user.findMany({
      where: {
        role: 'SERVICE_PROVIDER'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        services: {
          select: {
            id: true,
            serviceName: true
          }
        }
      }
    });

    console.log(`\n📊 Found ${providers.length} service providers:`);
    
    if (providers.length === 0) {
      console.log('❌ No service providers found! This is why analytics is failing.');
      console.log('💡 You need to create service providers or change user roles.');
      return;
    }

    providers.forEach((provider, index) => {
      console.log(`\n${index + 1}. ${provider.firstName} ${provider.lastName} (ID: ${provider.id})`);
      console.log(`   📧 Email: ${provider.email}`);
      console.log(`   🔑 Role: ${provider.role}`);
      console.log(`   ✅ Active: ${provider.isActive}`);
      console.log(`   🛠️  Services: ${provider.services.length}`);
      
      if (provider.services.length > 0) {
        provider.services.forEach(service => {
          console.log(`      - ${service.serviceName} (ID: ${service.id})`);
        });
      } else {
        console.log('      ⚠️  No services created yet');
      }
    });

    // Check if there are any bookings for these providers
    console.log('\n📅 Checking bookings...');
    for (const provider of providers) {
      if (provider.services.length > 0) {
        const serviceIds = provider.services.map(s => s.id);
        const bookingCount = await prisma.booking.count({
          where: {
            serviceId: { in: serviceIds }
          }
        });
        console.log(`   ${provider.firstName}: ${bookingCount} bookings`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking providers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProviders();
