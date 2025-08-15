const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');

const missingUsers = [
  {
    id: 3,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567893',
    isActive: true
  },
  {
    id: 4,
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567894',
    isActive: true
  },
  {
    id: 5,
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567895',
    isActive: true
  },
  {
    id: 6,
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567896',
    isActive: true
  },
  {
    id: 7,
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567897',
    isActive: true
  },
  {
    id: 8,
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567898',
    isActive: true
  },
  {
    id: 9,
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567899',
    isActive: true
  },
  {
    id: 10,
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'robert.brown@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567800',
    isActive: true
  },
  {
    id: 11,
    firstName: 'Jennifer',
    lastName: 'Davis',
    email: 'jennifer.davis@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567801',
    isActive: true
  },
  {
    id: 12,
    firstName: 'Christopher',
    lastName: 'Miller',
    email: 'christopher.miller@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567802',
    isActive: true
  },
  {
    id: 13,
    firstName: 'Amanda',
    lastName: 'Taylor',
    email: 'amanda.taylor@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567803',
    isActive: true
  },
  {
    id: 14,
    firstName: 'Daniel',
    lastName: 'Moore',
    email: 'daniel.moore@afroasia.test',
    role: 'SERVICE_PROVIDER',
    phone: '+1234567804',
    isActive: true
  }
];

async function createMissingUsers() {
  try {
    console.log('👥 Creating missing service provider users...');
    
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    let createdCount = 0;
    
    for (const userData of missingUsers) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { id: userData.id }
        });
        
        if (existingUser) {
          console.log(`⚠️  User ID ${userData.id} already exists, skipping...`);
          continue;
        }
        
        // Create user
        const user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
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
        
        console.log(`✅ Created user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Error creating user ID ${userData.id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdCount} service provider users!`);
    console.log('📋 Now you can run the seedServices script to create all services.');
    
  } catch (error) {
    console.error('❌ Error in createMissingUsers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingUsers();
