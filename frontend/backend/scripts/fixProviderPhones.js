const prisma = require('../prismaClient');

async function fixProviderPhones() {
  try {
    console.log('📱 Checking and fixing provider phone numbers...');
    
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
        phone: true
      }
    });

    console.log(`Found ${providers.length} service providers`);

    const invalidPhones = [];
    const validPhoneRegex = /^\+[1-9]\d{1,14}$/; // E.164 format

    // Check each provider's phone number
    for (const provider of providers) {
      console.log(`\n👤 Provider ${provider.id}: ${provider.firstName} ${provider.lastName}`);
      console.log(`📞 Current phone: ${provider.phone || 'None'}`);
      
      if (!provider.phone || !validPhoneRegex.test(provider.phone) || provider.phone.includes('X')) {
        invalidPhones.push(provider);
        console.log('❌ Invalid phone number detected');
      } else {
        console.log('✅ Phone number is valid');
      }
    }

    if (invalidPhones.length === 0) {
      console.log('\n🎉 All provider phone numbers are valid!');
      return;
    }

    console.log(`\n🔧 Found ${invalidPhones.length} providers with invalid phone numbers. Fixing...`);

    // Fix invalid phone numbers
    for (let i = 0; i < invalidPhones.length; i++) {
      const provider = invalidPhones[i];
      // Generate a valid test phone number (US format)
      const newPhone = `+1555010${String(provider.id).padStart(4, '0')}`;
      
      await prisma.user.update({
        where: { id: provider.id },
        data: { phone: newPhone }
      });

      console.log(`✅ Updated provider ${provider.id} (${provider.firstName} ${provider.lastName}): ${provider.phone} → ${newPhone}`);
    }

    console.log('\n🎉 All provider phone numbers have been fixed!');
    console.log('📝 Note: These are test phone numbers. Update with real numbers in production.');

  } catch (error) {
    console.error('❌ Error fixing provider phones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProviderPhones();
