const prisma = require('../prismaClient');

async function createServiceForUser16() {
  try {
    console.log('🛠️  Creating service for user 16 (vercel59314@modirosa.com)...');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: 16 },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      console.log('❌ User 16 not found');
      return;
    }

    console.log(`👤 User: ${user.firstName || 'Unknown'} ${user.lastName || 'User'} (${user.email})`);

    // Check if they already have services
    const existingServices = await prisma.service.findMany({
      where: { userId: 16 }
    });

    if (existingServices.length > 0) {
      console.log('✅ User already has services:', existingServices.map(s => s.serviceName));
      return;
    }

    // Create a service for this user
    const service = await prisma.service.create({
      data: {
        serviceName: 'Digital Transformation Consulting',
        serviceCategory: 'Technology',
        description: 'Comprehensive digital transformation services to modernize your business operations and technology infrastructure.',
        userId: 16,
        price: 2500.00,
        duration: 120, // 2 hours
        isActive: true,
        location: 'Remote/On-site',
        tags: ['digital-transformation', 'consulting', 'technology', 'modernization'],
        images: [],
        requirements: 'Business assessment, current technology stack overview',
        deliverables: 'Digital transformation roadmap, technology recommendations, implementation plan'
      }
    });

    console.log('✅ Service created successfully!');
    console.log(`📋 Service: ${service.serviceName} (ID: ${service.id})`);
    console.log(`💰 Price: $${service.price}`);
    console.log(`⏱️  Duration: ${service.duration} minutes`);

    // Create some sample bookings for analytics data
    console.log('\n📅 Creating sample bookings for analytics...');
    
    const bookings = [
      {
        customerName: 'Alice Johnson',
        customerEmail: 'alice.johnson@example.com',
        customerPhone: '+1234567890',
        bookingDate: new Date('2025-01-15'),
        bookingTime: '09:00',
        status: 'COMPLETED',
        totalAmount: 2500.00,
        paymentStatus: 'COMPLETED',
        specialRequests: 'Focus on e-commerce platform integration'
      },
      {
        customerName: 'Bob Smith',
        customerEmail: 'bob.smith@example.com',
        customerPhone: '+1234567891',
        bookingDate: new Date('2025-01-20'),
        bookingTime: '14:00',
        status: 'COMPLETED',
        totalAmount: 2500.00,
        paymentStatus: 'COMPLETED',
        specialRequests: 'Legacy system modernization'
      },
      {
        customerName: 'Carol Davis',
        customerEmail: 'carol.davis@example.com',
        customerPhone: '+1234567892',
        bookingDate: new Date('2025-01-25'),
        bookingTime: '11:00',
        status: 'PENDING',
        totalAmount: 2500.00,
        paymentStatus: 'PENDING',
        specialRequests: 'Cloud migration strategy'
      }
    ];

    for (let i = 0; i < bookings.length; i++) {
      const booking = await prisma.booking.create({
        data: {
          ...bookings[i],
          serviceId: service.id,
          providerId: 16, // User 16 is the provider
          customerId: null, // Guest bookings
          duration: service.duration,
          reminderSent24h: false,
          reminderSent1h: false,
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) // Spread over last few days
        }
      });

      // Create payments for completed bookings
      if (bookings[i].status === 'COMPLETED') {
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: bookings[i].totalAmount,
            currency: 'USD',
            status: 'COMPLETED',
            paymentMethod: 'STRIPE',
            stripePaymentIntentId: `pi_test_${Date.now()}_${i}`,
            paidAt: new Date(booking.createdAt.getTime() + 60 * 60 * 1000) // 1 hour after booking
          }
        });
      }

      console.log(`   ✅ Booking ${i + 1}: ${bookings[i].customerName} - ${bookings[i].status}`);
    }

    console.log('\n🎉 Setup complete! User 16 now has:');
    console.log('   📋 1 service (Digital Transformation Consulting)');
    console.log('   📅 3 bookings (2 completed, 1 pending)');
    console.log('   💰 $5,000 in revenue');
    console.log('\n🔄 Now refresh the analytics page to see the data!');

  } catch (error) {
    console.error('❌ Error creating service for user 16:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createServiceForUser16();
