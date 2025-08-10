const prisma = require('../prismaClient');

async function checkBookingStructure() {
  try {
    console.log('🔍 Checking existing booking structure...');
    
    const booking = await prisma.booking.findFirst();
    
    if (booking) {
      console.log('📋 Booking structure:');
      console.log(JSON.stringify(booking, null, 2));
    } else {
      console.log('❌ No bookings found in database');
    }

  } catch (error) {
    console.error('❌ Error checking booking structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookingStructure();
