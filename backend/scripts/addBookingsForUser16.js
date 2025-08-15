const prisma = require('../prismaClient');

async function addBookingsForUser16() {
  try {
    console.log('📅 Adding bookings for user 16 analytics...');
    
    // Get the service for user 16
    const service = await prisma.service.findFirst({
      where: { userId: 16 }
    });

    if (!service) {
      console.log('❌ No service found for user 16');
      return;
    }

    console.log(`📋 Found service: ${service.serviceName} (ID: ${service.id})`);

    // Check if bookings already exist
    const existingBookings = await prisma.booking.findMany({
      where: { serviceId: service.id }
    });

    if (existingBookings.length > 0) {
      console.log(`✅ User already has ${existingBookings.length} bookings`);
      return;
    }

    // Create sample bookings
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

    console.log('\n🎉 Bookings created successfully!');
    console.log('   📅 3 bookings (2 completed, 1 pending)');
    console.log('   💰 $5,000 in revenue');
    console.log('\n🔄 Now refresh the analytics page to see the data!');

  } catch (error) {
    console.error('❌ Error adding bookings for user 16:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBookingsForUser16();
