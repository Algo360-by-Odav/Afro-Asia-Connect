const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');

async function main() {
  // Create companies
  const acme = await prisma.company.create({
    data: {
      name: 'Acme Agro Exports',
      industry: 'Agriculture',
      location: 'Kenya',
      verified: true,
      trustScore: 80,
      yearFounded: 2010,
      products: {
        create: [
          {
            title: 'Raw Cashew Nuts',
            description: 'High-quality cashew nuts, origin Kenya',
            price: 1500,
            moq: 1000,
            leadTime: '30 days',
            images: [],
            category: 'Nuts',
          },
        ],
      },
    },
  });

  const bazar = await prisma.company.create({
    data: {
      name: 'Bazar Textiles Co.',
      industry: 'Textiles',
      location: 'India',
      verified: false,
      trustScore: 65,
      yearFounded: 2015,
    },
  });

  // Create subscription plans
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: 'Free',
          price: 0,
          currency: 'USD',
          durationDays: 0,
          features: ['Basic access'],
          description: 'Free forever plan',
        },
        {
          name: 'Pro',
          price: 49,
          currency: 'USD',
          durationDays: 30,
          features: ['All Free features', 'Priority support', 'Advanced analytics'],
          description: 'Monthly subscription',
        },
        {
          name: 'Enterprise',
          price: 499,
          currency: 'USD',
          durationDays: 365,
          features: ['All Pro features', 'Dedicated account manager', 'Custom integrations'],
          description: 'Annual subscription',
        },
      ],
      skipDuplicates: true,
    });

    // Create demo user
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('password123', salt);
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@afroasia.test' },
      update: {},
      create: {
        email: 'demo@afroasia.test',
        password: hashed,
        role: 'SUPPLIER',
        firstName: 'Demo',
        lastName: 'User',
      },
    });

    // Create a business listing for demo user
    let demoListing = await prisma.businessListing.findFirst({ where: { businessName: 'Demo Exports' } });
    if (!demoListing) {
      demoListing = await prisma.businessListing.create({
      data: {
        userId: demoUser.id,
        businessName: 'Demo Exports',
        businessCategory: 'Agriculture',
        description: 'Supplier of quality nuts and grains.',
        countryOfOrigin: 'Ghana',
        targetMarkets: ['Asia', 'Europe'],
        isVerified: true,
      },
    });
    }

    // Create a welcome notification for demo user
    let welcomeNotification = await prisma.notification.findFirst({ where: { userId: demoUser.id, type: 'INFO' } });
    if (!welcomeNotification) {
      welcomeNotification = await prisma.notification.create({
      data: {
        userId: demoUser.id,
        type: 'INFO',
        message: 'Welcome to AfroAsiaConnect! Your account is ready.',
      },
    });
    }

    console.log('Seeded companies:', { acme, bazar });
    console.log('Seeded demo user, listing and notification:', { demoUser, demoListing, welcomeNotification });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
