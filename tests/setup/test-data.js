// Test data setup and utilities
const bcrypt = require('bcrypt');

const testUsers = {
  admin: {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@afroasiaconnect.com',
    password: 'AdminPassword123!',
    role: 'ADMIN',
    isAdmin: true,
    isVerified: true
  },
  serviceProvider: {
    firstName: 'John',
    lastName: 'Provider',
    email: 'provider@example.com',
    password: 'Password123!',
    role: 'SERVICE_PROVIDER',
    isVerified: true
  },
  customer: {
    firstName: 'Jane',
    lastName: 'Customer',
    email: 'customer@example.com',
    password: 'Password123!',
    role: 'CUSTOMER',
    isVerified: true
  }
};

const testServices = [
  {
    serviceName: 'Web Development Consultation',
    serviceCategory: 'Technology',
    description: 'Professional web development consultation and planning',
    price: 150,
    duration: 60,
    isActive: true
  },
  {
    serviceName: 'Business Strategy Session',
    serviceCategory: 'Business',
    description: 'Strategic business planning and consultation',
    price: 200,
    duration: 90,
    isActive: true
  },
  {
    serviceName: 'Digital Marketing Audit',
    serviceCategory: 'Marketing',
    description: 'Comprehensive digital marketing analysis',
    price: 100,
    duration: 45,
    isActive: true
  }
];

const testBookings = [
  {
    date: new Date(Date.now() + 86400000), // Tomorrow
    time: '10:00',
    status: 'PENDING',
    totalPrice: 150,
    customerName: 'Jane Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '+1234567890'
  },
  {
    date: new Date(Date.now() + 172800000), // Day after tomorrow
    time: '14:00',
    status: 'CONFIRMED',
    totalPrice: 200,
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1234567891'
  }
];

const testVerificationRequests = [
  {
    businessName: 'Tech Solutions Inc',
    businessType: 'Technology',
    businessRegistrationNumber: 'REG123456',
    taxId: 'TAX789012',
    businessAddress: '123 Tech Street, Silicon Valley',
    businessPhone: '+1555123456',
    businessEmail: 'info@techsolutions.com',
    status: 'PENDING',
    documents: ['business_license.pdf', 'tax_certificate.pdf']
  }
];

async function seedTestData(prisma) {
  try {
    console.log('Seeding test data...');

    // Create test users
    for (const [key, userData] of Object.entries(testUsers)) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          ...userData,
          password: hashedPassword
        }
      });
      console.log(`Created test user: ${userData.email}`);
    }

    // Get provider user for services
    const provider = await prisma.user.findUnique({
      where: { email: testUsers.serviceProvider.email }
    });

    // Create test services
    for (const serviceData of testServices) {
      await prisma.service.create({
        data: {
          ...serviceData,
          userId: provider.id
        }
      });
    }
    console.log('Created test services');

    // Get customer user for bookings
    const customer = await prisma.user.findUnique({
      where: { email: testUsers.customer.email }
    });

    // Get first service for bookings
    const service = await prisma.service.findFirst({
      where: { userId: provider.id }
    });

    // Create test bookings
    for (const bookingData of testBookings) {
      await prisma.booking.create({
        data: {
          ...bookingData,
          serviceId: service.id,
          customerId: customer.id,
          providerId: provider.id
        }
      });
    }
    console.log('Created test bookings');

    // Create test verification requests
    for (const verificationData of testVerificationRequests) {
      await prisma.verificationRequest.create({
        data: {
          ...verificationData,
          userId: provider.id
        }
      });
    }
    console.log('Created test verification requests');

    console.log('Test data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}

async function cleanupTestData(prisma) {
  try {
    console.log('Cleaning up test data...');

    // Delete in reverse order of dependencies
    await prisma.booking.deleteMany({});
    await prisma.verificationRequest.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: Object.values(testUsers).map(u => u.email)
        }
      }
    });

    console.log('Test data cleanup completed');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

module.exports = {
  testUsers,
  testServices,
  testBookings,
  testVerificationRequests,
  seedTestData,
  cleanupTestData
};
