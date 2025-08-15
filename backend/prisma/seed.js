/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // -------- Create service_provider user --------
  const passwordHash = await bcrypt.hash('Passw0rd!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'info@globaltradelogistics.com' },
    update: {},
    create: {
      email: 'info@globaltradelogistics.com',
      password: passwordHash,
      firstName: 'GlobalTrade',
      lastName: 'Logistics',
      role: 'SERVICE_PROVIDER',
    },
  });

    // -------- Create company --------
  let company = await prisma.company.findFirst({
    where: { name: 'GlobalTrade Logistics Ltd.' },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'GlobalTrade Logistics Ltd.',
        location: 'Kuala Lumpur, Malaysia',
        description: 'Simplifying Cross-Continental Trade from Africa to Asia',
        verified: true,
        trustScore: 90,
        yearFounded: 2013,
        website: 'https://www.globaltradelogistics.com',
        whatsapp: '+60 12-345 6789',
        linkedin: 'https://linkedin.com/company/globaltradelogistics',
        owners: {
          connect: { id: user.id },
        },
      },
    });
  }

  // -------- Create service --------
  const service = await prisma.service.create({
    data: {
      serviceName: 'International Shipping',
      serviceCategory: 'Logistics',
      description: 'Ocean freight for containers and bulk cargo from West Africa to Southeast Asia.',
      price: 1200,
      isActive: true,
      userId: user.id,
    },
  });

  // -------- Create products --------
  await prisma.product.createMany({
    data: [
      {
        title: 'Inland Transport',
        description: 'Trucking and warehousing across Malaysia, Nigeria, and Ghana.',
        images: [],
        companyId: company.id,
      },
      {
        title: 'Customs Clearance',
        description: 'Expert handling of export-import regulations in both continents.',
        images: [],
        companyId: company.id,
      },
    ],
    skipDuplicates: true,
  });

  // -------- Create review --------
  await prisma.review.create({
    data: {
      text: 'We exported sesame seeds from Kano to Vietnam, and GlobalTrade handled everything smoothly — from port handling to customs. Highly reliable!',
      rating: 5,
      companyId: company.id,
      reviewerId: user.id,
    },
  });

  console.log(`Seed completed. Service ID: ${service.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
