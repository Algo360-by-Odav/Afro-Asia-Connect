const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createServiceProvider() {
  try {
    // Create a service provider user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const serviceProvider = await prisma.user.create({
      data: {
        email: 'provider@afroasia.test',
        password: hashedPassword,
        role: 'SERVICE_PROVIDER',
        firstName: 'John',
        lastName: 'Provider',
        isActive: true,
        isAdmin: false
      }
    });

    console.log('✅ Service provider created:', serviceProvider);

    // Create a sample service
    const service = await prisma.service.create({
      data: {
        serviceName: 'Web Development',
        description: 'Professional web development services including frontend and backend development.',
        category: 'Technology',
        price: 50.00,
        duration: 120, // 2 hours
        location: 'Remote',
        tags: ['web', 'development', 'react', 'nodejs'],
        requirements: ['Project requirements', 'Design mockups (if available)'],
        deliverables: ['Fully functional website', 'Source code', 'Documentation'],
        userId: serviceProvider.id,
        isActive: true
      }
    });

    console.log('✅ Sample service created:', service);

    // Create working hours for the provider
    const workingHours = await prisma.workingHours.create({
      data: {
        userId: serviceProvider.id,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true
      }
    });

    console.log('✅ Working hours created:', workingHours);

    console.log('\n🎉 Service provider setup complete!');
    console.log('📧 Email: provider@afroasia.test');
    console.log('🔑 Password: password123');
    console.log('🆔 Service ID:', service.id);

  } catch (error) {
    console.error('❌ Error creating service provider:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createServiceProvider();
