const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser16() {
  try {
    console.log('🔍 Checking User 16 details...');
    
    const user = await prisma.user.findUnique({
      where: { id: 16 },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        password: true // We need this to check password
      }
    });
    
    if (user) {
      console.log('✅ User 16 found:');
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.firstName, user.lastName);
      console.log('🔑 Role:', user.role);
      console.log('✅ Active:', user.isActive);
      console.log('🔒 Has Password:', user.password ? 'Yes' : 'No');
      
      // Test password
      if (user.password) {
        const passwordTest = await bcrypt.compare('password123', user.password);
        console.log('🔐 Password "password123" matches:', passwordTest);
        
        if (!passwordTest) {
          // Try other common passwords
          const commonPasswords = ['123456', 'password', 'admin123', 'user123'];
          for (const pwd of commonPasswords) {
            const test = await bcrypt.compare(pwd, user.password);
            if (test) {
              console.log(`🔐 Password "${pwd}" matches: ${test}`);
              break;
            }
          }
        }
      }
      
      // Check services
      const services = await prisma.service.findMany({
        where: { userId: 16 },
        select: {
          id: true,
          serviceName: true,
          price: true
        }
      });
      
      console.log('\n🛠️ Services:', services.length);
      services.forEach(service => {
        console.log(`   - ${service.serviceName} (ID: ${service.id}) - $${service.price}`);
      });
      
      // Check bookings
      const bookings = await prisma.booking.findMany({
        where: {
          service: {
            userId: 16
          }
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true
        }
      });
      
      console.log('\n📅 Bookings:', bookings.length);
      bookings.forEach(booking => {
        console.log(`   - Booking ${booking.id}: ${booking.status} - $${booking.totalAmount}`);
      });
      
    } else {
      console.log('❌ User 16 not found');
      
      // Check if there are any users with similar email
      const similarUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: 'modirosa'
          }
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });
      
      console.log('\n🔍 Users with "modirosa" in email:', similarUsers.length);
      similarUsers.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('🚨 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser16();
