const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleBusinessListings = [
  {
    businessName: "Kenya Coffee Exporters Ltd",
    businessCategory: "Agriculture",
    description: "Premium coffee beans sourced directly from Kenyan highlands. Specializing in Arabica varieties with sustainable farming practices and direct trade partnerships.",
    countryOfOrigin: "Kenya",
    targetMarkets: ["Asia", "Europe", "North America"],
    contactEmail: "export@kenyacoffee.co.ke",
    contactPhone: "+254-20-1234567",
    websiteUrl: "https://kenyacoffee.co.ke",
    logoImageUrl: "/images/listings/kenya-coffee-logo.jpg",
    languagesSpoken: ["English", "Swahili"],
    isActive: true,
    isVerified: true
  },
  {
    businessName: "Cairo Textile Mills",
    businessCategory: "Manufacturing",
    description: "Leading textile manufacturer specializing in cotton fabrics and garments for export. State-of-the-art facilities with international quality certifications.",
    countryOfOrigin: "Egypt",
    targetMarkets: ["Asia", "Europe"],
    contactEmail: "sales@cairotextile.eg",
    contactPhone: "+20-2-12345678",
    websiteUrl: "https://cairotextile.eg",
    logoImageUrl: "/images/listings/cairo-textile-logo.jpg",
    languagesSpoken: ["Arabic", "English"],
    isActive: true,
    isVerified: true
  },
  {
    businessName: "Bangalore Tech Solutions",
    businessCategory: "Technology",
    description: "Software development and IT services company with expertise in fintech and e-commerce solutions. Serving clients across Africa and Asia.",
    countryOfOrigin: "India",
    targetMarkets: ["Africa", "Asia", "Middle East"],
    contactEmail: "contact@bangaloretech.in",
    contactPhone: "+91-80-12345678",
    websiteUrl: "https://bangaloretech.in",
    logoImageUrl: "/images/listings/bangalore-tech-logo.jpg",
    languagesSpoken: ["English", "Hindi"],
    isActive: true,
    isVerified: true
  },
  {
    businessName: "Lagos Steel Works",
    businessCategory: "Manufacturing",
    description: "Steel processing and fabrication company serving construction and infrastructure projects across West Africa with modern equipment.",
    countryOfOrigin: "Nigeria",
    targetMarkets: ["Africa"],
    contactEmail: "info@lagossteel.ng",
    contactPhone: "+234-1-2345678",
    websiteUrl: "https://lagossteel.ng",
    logoImageUrl: "/images/listings/lagos-steel-logo.jpg",
    languagesSpoken: ["English"],
    isActive: true,
    isVerified: false
  },
  {
    businessName: "Trans-Sahara Logistics",
    businessCategory: "Services",
    description: "Cross-border logistics and freight forwarding services connecting North Africa with Sub-Saharan markets. Reliable and efficient delivery.",
    countryOfOrigin: "Morocco",
    targetMarkets: ["Africa", "Europe"],
    contactEmail: "ops@transsahara.ma",
    contactPhone: "+212-522-123456",
    websiteUrl: "https://transsahara.ma",
    logoImageUrl: "/images/listings/trans-sahara-logo.jpg",
    languagesSpoken: ["Arabic", "French", "English"],
    isActive: true,
    isVerified: true
  },
  {
    businessName: "Ethiopian Sesame Collective",
    businessCategory: "Agriculture",
    description: "Cooperative of sesame farmers providing high-quality sesame seeds for international markets with full traceability and organic certification.",
    countryOfOrigin: "Ethiopia",
    targetMarkets: ["Asia", "Europe"],
    contactEmail: "export@ethsesame.et",
    contactPhone: "+251-11-123456",
    websiteUrl: "https://ethsesame.et",
    logoImageUrl: "/images/listings/ethiopian-sesame-logo.jpg",
    languagesSpoken: ["Amharic", "English"],
    isActive: true,
    isVerified: true
  },
  {
    businessName: "Cape Town Digital Hub",
    businessCategory: "Technology",
    description: "Digital transformation consultancy helping African businesses modernize their operations with cutting-edge technology solutions.",
    countryOfOrigin: "South Africa",
    targetMarkets: ["Africa"],
    contactEmail: "hello@ctdigital.za",
    contactPhone: "+27-21-123456",
    websiteUrl: "https://ctdigital.za",
    logoImageUrl: "/images/listings/cape-town-digital-logo.jpg",
    languagesSpoken: ["English", "Afrikaans"],
    isActive: true,
    isVerified: true
  },
  {
    businessName: "Dubai Trade Finance",
    businessCategory: "Services",
    description: "Trade financing and letters of credit services for Africa-Asia trade corridor. Comprehensive financial solutions for international trade.",
    countryOfOrigin: "UAE",
    targetMarkets: ["Africa", "Asia"],
    contactEmail: "finance@dubaitrade.ae",
    contactPhone: "+971-4-1234567",
    websiteUrl: "https://dubaitrade.ae",
    logoImageUrl: "/images/listings/dubai-trade-logo.jpg",
    languagesSpoken: ["Arabic", "English"],
    isActive: true,
    isVerified: true
  }
];

async function seedBusinessListings() {
  console.log('🌱 Starting business listings seeding...');
  
  try {
    // Check if listings already exist
    const existingCount = await prisma.businessListing.count();
    if (existingCount >= 5) {
      console.log(`✓ Database already has ${existingCount} business listings. Skipping seeding.`);
      return;
    }

    // Get the first user to associate listings with
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      console.log('❌ No users found. Please create users first.');
      return;
    }

    console.log(`📝 Creating ${sampleBusinessListings.length} business listings...`);
    
    for (const listing of sampleBusinessListings) {
      try {
        const created = await prisma.businessListing.create({
          data: {
            ...listing,
            userId: firstUser.id,
            targetMarkets: listing.targetMarkets,
            languagesSpoken: listing.languagesSpoken
          }
        });
        console.log(`✓ Created: ${created.businessName} (${created.businessCategory})`);
      } catch (error) {
        console.error(`❌ Failed to create ${listing.businessName}:`, error.message);
      }
    }

    const finalCount = await prisma.businessListing.count();
    console.log(`🎉 Successfully seeded business listings! Total: ${finalCount}`);
    
    // Show category breakdown
    const categories = await prisma.businessListing.groupBy({
      by: ['businessCategory'],
      _count: { businessCategory: true }
    });
    
    console.log('\nCategory breakdown:');
    categories.forEach(cat => {
      console.log(`  ${cat.businessCategory}: ${cat._count.businessCategory} listings`);
    });

  } catch (error) {
    console.error('❌ Error seeding business listings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedBusinessListings();
}

module.exports = { seedBusinessListings };
