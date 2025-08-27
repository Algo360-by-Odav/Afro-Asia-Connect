const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleCompanies = [
  // Agro sector
  {
    name: "Kenya Coffee Exporters Ltd",
    industry: "Agro",
    location: "Nairobi, Kenya",
    description: "Premium coffee beans sourced directly from Kenyan highlands. Specializing in Arabica varieties with sustainable farming practices.",
    verified: true,
    trustScore: 95,
    averageRating: 4.8,
    website: "https://kenyacoffee.co.ke",
    whatsapp: "+254-20-1234567"
  },
  {
    name: "Sahel Spice Trading",
    industry: "Spices",
    location: "Bamako, Mali",
    description: "Authentic West African spices and seasonings. Direct trade partnerships with local farmers across the Sahel region.",
    verified: true,
    trustScore: 88,
    averageRating: 4.6,
    website: "https://sahelspice.ml",
    whatsapp: "+223-20-123456"
  },
  {
    name: "Ethiopian Sesame Collective",
    industry: "Agro",
    location: "Addis Ababa, Ethiopia",
    description: "Cooperative of sesame farmers providing high-quality sesame seeds for international markets.",
    verified: true,
    trustScore: 92,
    averageRating: 4.7,
    website: "https://ethsesame.et",
    whatsapp: "+251-11-123456"
  },
  
  // Manufacturing sector
  {
    name: "Cairo Textile Mills",
    industry: "Manufacturing",
    location: "Cairo, Egypt",
    description: "Leading textile manufacturer specializing in cotton fabrics and garments for export to Asian markets.",
    verified: true,
    trustScore: 85,
    averageRating: 4.4,
    website: "https://cairotextile.eg",
    whatsapp: "+20-2-12345678"
  },
  {
    name: "Lagos Steel Works",
    industry: "Manufacturing",
    location: "Lagos, Nigeria",
    description: "Steel processing and fabrication company serving construction and infrastructure projects across West Africa.",
    verified: false,
    trustScore: 78,
    averageRating: 4.2,
    website: "https://lagossteel.ng",
    whatsapp: "+234-1-2345678"
  },
  
  // Technology sector
  {
    name: "Bangalore Tech Solutions",
    industry: "Technology",
    location: "Bangalore, India",
    description: "Software development and IT services company with expertise in fintech and e-commerce solutions.",
    verified: true,
    trustScore: 91,
    averageRating: 4.9,
    website: "https://bangaloretech.in",
    linkedin: "https://linkedin.com/company/bangaloretech"
  },
  {
    name: "Cape Town Digital Hub",
    industry: "Technology",
    location: "Cape Town, South Africa",
    description: "Digital transformation consultancy helping African businesses modernize their operations.",
    verified: true,
    trustScore: 87,
    averageRating: 4.5,
    website: "https://ctdigital.za",
    linkedin: "https://linkedin.com/company/ctdigital"
  },
  
  // Logistics sector
  {
    name: "Trans-Sahara Logistics",
    industry: "Logistics",
    location: "Casablanca, Morocco",
    description: "Cross-border logistics and freight forwarding services connecting North Africa with Sub-Saharan markets.",
    verified: true,
    trustScore: 89,
    averageRating: 4.6,
    website: "https://transsahara.ma",
    whatsapp: "+212-522-123456"
  },
  {
    name: "East Africa Freight Co",
    industry: "Logistics",
    location: "Mombasa, Kenya",
    description: "Port logistics and inland transportation services for the East African corridor.",
    verified: false,
    trustScore: 82,
    averageRating: 4.3,
    website: "https://eafreight.ke",
    whatsapp: "+254-41-123456"
  },
  
  // Mining sector
  {
    name: "Ghana Gold Refiners",
    industry: "Mining",
    location: "Accra, Ghana",
    description: "Gold processing and refining facility with international certification for precious metals trading.",
    verified: true,
    trustScore: 94,
    averageRating: 4.8,
    website: "https://ghgold.gh",
    whatsapp: "+233-30-123456"
  },
  {
    name: "Zambian Copper Corp",
    industry: "Mining",
    location: "Lusaka, Zambia",
    description: "Copper mining and processing company with sustainable extraction practices.",
    verified: true,
    trustScore: 86,
    averageRating: 4.4,
    website: "https://zamcopper.zm",
    whatsapp: "+260-21-123456"
  },
  
  // Services sector
  {
    name: "Dubai Trade Finance",
    industry: "Finance",
    location: "Dubai, UAE",
    description: "Trade financing and letters of credit services for Africa-Asia trade corridor.",
    verified: true,
    trustScore: 96,
    averageRating: 4.9,
    website: "https://dubaitrade.ae",
    linkedin: "https://linkedin.com/company/dubaitrade"
  },
  {
    name: "Singapore Inspection Services",
    industry: "Inspection",
    location: "Singapore",
    description: "Quality control and pre-shipment inspection services for international trade.",
    verified: true,
    trustScore: 93,
    averageRating: 4.7,
    website: "https://sginspect.sg",
    linkedin: "https://linkedin.com/company/sginspect"
  }
];

async function seedCompanies() {
  console.log('🌱 Starting company seeding...');
  
  try {
    // Check if companies already exist
    const existingCount = await prisma.company.count();
    if (existingCount >= 10) {
      console.log(`✅ ${existingCount} companies already exist. Skipping seed.`);
      return;
    }

    // Create companies
    const created = [];
    for (const companyData of sampleCompanies) {
      try {
        const company = await prisma.company.create({
          data: companyData
        });
        created.push(company);
        console.log(`✓ Created: ${company.name} (${company.industry})`);
      } catch (error) {
        console.warn(`⚠️  Skipped ${companyData.name}: ${error.message}`);
      }
    }

    console.log(`🎉 Successfully seeded ${created.length} companies!`);
    console.log('\nIndustry breakdown:');
    const breakdown = created.reduce((acc, c) => {
      acc[c.industry] = (acc[c.industry] || 0) + 1;
      return acc;
    }, {});
    Object.entries(breakdown).forEach(([industry, count]) => {
      console.log(`  ${industry}: ${count} companies`);
    });

  } catch (error) {
    console.error('❌ Error seeding companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedCompanies();
}

module.exports = { seedCompanies, sampleCompanies };
