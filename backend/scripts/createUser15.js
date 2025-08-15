const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');

async function createUser15() {
  try {
    console.log('👤 Creating user 15 for Cybersecurity Consulting...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        id: 15,
        firstName: 'Alex',
        lastName: 'Security',
        email: 'alex.security@afroasia.test',
        role: 'SERVICE_PROVIDER',
        phone: '+1234567815',
        password: hashedPassword,
        isActive: true,
        smsPreferences: {
          smsEnabled: true,
          bookingConfirmations: true,
          bookingReminders: true,
          statusUpdates: true,
          paymentConfirmations: true,
          twoFactorAuth: false
        }
      }
    });
    
    console.log(`✅ Created user 15: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log('📋 Now you can create the Cybersecurity Consulting service');
    
  } catch (error) {
    console.error('❌ Error creating user 15:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser15();
