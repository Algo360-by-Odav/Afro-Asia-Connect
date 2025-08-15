const prisma = require('../prismaClient');

const sampleServices = [
  {
    serviceName: 'Web Development & Design',
    serviceCategory: 'Technology',
    description: 'Full-stack web development services including modern React, Node.js, and database design. We create responsive, scalable web applications for businesses of all sizes.',
    price: 150.00, // Per hour
    duration: 120, // 2 hours minimum
    location: 'Remote/On-site',
    tags: ['React', 'Node.js', 'Database', 'Responsive Design'],
    requirements: 'Project requirements document, design mockups (if available)',
    deliverables: 'Fully functional web application, source code, documentation',
    isActive: true,
    userId: 1, // Assuming user ID 1 exists
  },
  {
    serviceName: 'Digital Marketing Strategy',
    serviceCategory: 'Marketing',
    description: 'Comprehensive digital marketing solutions including SEO, social media management, content creation, and paid advertising campaigns to grow your online presence.',
    price: 120.00,
    duration: 90,
    location: 'Remote',
    tags: ['SEO', 'Social Media', 'Content Marketing', 'PPC'],
    requirements: 'Business goals, target audience information, current marketing materials',
    deliverables: 'Marketing strategy document, campaign setup, performance reports',
    isActive: true,
    userId: 2,
  },
  {
    serviceName: 'Business Consulting',
    serviceCategory: 'Consulting',
    description: 'Strategic business consulting services to help optimize operations, improve efficiency, and drive growth. Specializing in startup guidance and process improvement.',
    price: 200.00,
    duration: 60,
    location: 'Remote/On-site',
    tags: ['Strategy', 'Operations', 'Process Improvement', 'Startup'],
    requirements: 'Business overview, current challenges, financial statements',
    deliverables: 'Consultation report, action plan, follow-up recommendations',
    isActive: true,
    userId: 3,
  },
  {
    serviceName: 'Graphic Design & Branding',
    serviceCategory: 'Design',
    description: 'Professional graphic design services including logo design, brand identity, marketing materials, and visual content creation for digital and print media.',
    price: 100.00,
    duration: 180,
    location: 'Remote',
    tags: ['Logo Design', 'Branding', 'Print Design', 'Digital Graphics'],
    requirements: 'Brand brief, style preferences, target audience details',
    deliverables: 'Design files, brand guidelines, multiple format exports',
    isActive: true,
    userId: 4,
  },
  {
    serviceName: 'Mobile App Development',
    serviceCategory: 'Technology',
    description: 'Native and cross-platform mobile app development for iOS and Android. From concept to deployment, we build user-friendly mobile solutions.',
    price: 180.00,
    duration: 240,
    location: 'Remote/On-site',
    tags: ['iOS', 'Android', 'React Native', 'Flutter'],
    requirements: 'App concept, feature requirements, design mockups',
    deliverables: 'Mobile application, source code, app store deployment',
    isActive: true,
    userId: 5,
  },
  {
    serviceName: 'Content Writing & Copywriting',
    serviceCategory: 'Marketing',
    description: 'Professional content creation services including blog posts, website copy, product descriptions, and marketing materials that engage and convert.',
    price: 75.00,
    isActive: true,
    userId: 6,
  },
  {
    serviceName: 'Financial Planning & Analysis',
    serviceCategory: 'Finance',
    description: 'Comprehensive financial planning services including investment advice, retirement planning, tax optimization, and business financial analysis.',
    price: 200.00,
    isActive: true,
    userId: 7,
  },
  {
    serviceName: 'Legal Document Preparation',
    serviceCategory: 'Legal',
    description: 'Professional legal document preparation including contracts, agreements, business formation documents, and compliance documentation.',
    price: 300.00,
    isActive: true,
    userId: 8,
  },
  {
    serviceName: 'Photography & Videography',
    serviceCategory: 'Design',
    description: 'Professional photography and videography services for events, products, corporate content, and marketing materials. High-quality visual storytelling.',
    price: 500.00,
    isActive: true,
    userId: 9,
  },
  {
    serviceName: 'Data Analytics & Insights',
    serviceCategory: 'Technology',
    description: 'Advanced data analytics services including business intelligence, data visualization, predictive modeling, and actionable insights for data-driven decisions.',
    price: 1800.00,
    isActive: true,
    userId: 10,
  },
  {
    serviceName: 'Project Management',
    serviceCategory: 'Consulting',
    description: 'Professional project management services using Agile and traditional methodologies. Ensuring projects are delivered on time, within budget, and to specification.',
    price: 120.00,
    isActive: true,
    userId: 11,
  },
  {
    serviceName: 'Cloud Infrastructure Setup',
    serviceCategory: 'Technology',
    description: 'Cloud infrastructure design and implementation using AWS, Azure, or Google Cloud. Scalable, secure, and cost-effective cloud solutions.',
    price: 3000.00,
    isActive: true,
    userId: 12,
  },
  {
    serviceName: 'Social Media Management',
    serviceCategory: 'Marketing',
    description: 'Complete social media management including content creation, posting schedules, community engagement, and performance analytics across all platforms.',
    price: 600.00,
    isActive: true,
    userId: 13,
  },
  {
    serviceName: 'UX/UI Design',
    serviceCategory: 'Design',
    description: 'User experience and interface design services creating intuitive, beautiful, and functional digital experiences that users love and businesses benefit from.',
    price: 1500.00,
    isActive: true,
    userId: 14,
  },
  {
    serviceName: 'Cybersecurity Consulting',
    serviceCategory: 'Technology',
    description: 'Comprehensive cybersecurity services including security audits, vulnerability assessments, security policy development, and incident response planning.',
    price: 2200.00,
    isActive: true,
    userId: 15,
  }
];

async function seedServices() {
  try {
    console.log('🌱 Starting to seed services...');
    
    // Check if services already exist
    const existingServices = await prisma.service.count();
    if (existingServices > 0) {
      console.log(`📊 Found ${existingServices} existing services. Skipping seed.`);
      console.log('💡 To re-seed, delete existing services first.');
      return;
    }

    // Create services
    const createdServices = [];
    for (const service of sampleServices) {
      try {
        const created = await prisma.service.create({
          data: service
        });
        createdServices.push(created);
        console.log(`✅ Created service: ${service.serviceName}`);
      } catch (error) {
        console.log(`⚠️  Skipping ${service.serviceName} (user may not exist): ${error.message}`);
      }
    }

    console.log(`🎉 Successfully seeded ${createdServices.length} services!`);
    console.log('📋 Services by category:');
    
    const categories = {};
    createdServices.forEach(service => {
      const category = sampleServices.find(s => s.serviceName === service.serviceName)?.serviceCategory;
      if (category) {
        categories[category] = (categories[category] || 0) + 1;
      }
    });
    
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} services`);
    });

  } catch (error) {
    console.error('❌ Error seeding services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seedServices();
}

module.exports = { seedServices, sampleServices };
