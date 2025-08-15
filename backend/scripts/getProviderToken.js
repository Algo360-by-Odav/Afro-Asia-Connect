const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../prismaClient');

async function getProviderToken() {
  try {
    console.log('🔑 Getting login token for service provider...');
    
    // Get a provider with bookings (Robert Brown has 3 bookings)
    const provider = await prisma.user.findUnique({
      where: { id: 10 }, // Robert Brown
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        password: true
      }
    });

    if (!provider) {
      console.log('❌ Provider not found');
      return;
    }

    console.log(`👤 Provider: ${provider.firstName} ${provider.lastName} (${provider.email})`);
    console.log(`🔑 Role: ${provider.role}`);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: provider.id, 
        email: provider.email, 
        role: provider.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('\n🎫 JWT Token:');
    console.log(token);
    
    console.log('\n📋 To use this token:');
    console.log('1. Open browser developer tools (F12)');
    console.log('2. Go to Application/Storage > Local Storage > http://localhost:3000');
    console.log('3. Set key: "token" with the value above');
    console.log('4. Refresh the analytics page');
    
    console.log('\n🔐 Or login with:');
    console.log(`Email: ${provider.email}`);
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Error getting provider token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getProviderToken();
