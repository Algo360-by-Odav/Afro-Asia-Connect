import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Sample detailed listings data
    const sampleListings: Record<string, any> = {
      '1': {
        id: 1,
        userId: 1,
        businessName: "African Industrial Solutions",
        businessCategory: "Manufacturing",
        subsector: "Industrial Equipment",
        description: "Leading manufacturer of industrial equipment and machinery across West Africa. We specialize in heavy machinery, production equipment, and industrial automation solutions.",
        companyOverview: "Established in 2010, African Industrial Solutions has become a cornerstone of West African manufacturing. Our state-of-the-art facilities in Lagos produce high-quality industrial equipment that meets international standards. We serve clients across Africa and export to global markets.",
        countryOfOrigin: "Lagos, Nigeria",
        targetMarkets: ["Africa", "Europe", "Middle East"],
        contactEmail: "contact@africanindustrial.com",
        contactPhone: "+234-803-123-4567",
        websiteUrl: "https://africanindustrial.com",
        logoImageUrl: "/images/placeholders/manufacturing-logo.svg",
        galleryImageUrls: [
          "/images/b.jpg",
          "/images/k.jpg",
          "/images/n.jpg"
        ],
        isActive: true,
        createdAt: "2023-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
        languagesSpoken: ["English", "French", "Yoruba"],
        isVerified: true,
        productsInfo: [
          {
            name: "Industrial Press Machine",
            images: ["/images/placeholders/press-machine.jpg"],
            specifications: "Capacity: 500 tons, Power: 75kW, Dimensions: 4m x 2m x 3m",
            moq: "1 unit"
          },
          {
            name: "Conveyor Belt System",
            images: ["/images/placeholders/conveyor.jpg"],
            specifications: "Length: 50m, Width: 1.2m, Speed: 0.5-2.0 m/s",
            moq: "10 meters"
          }
        ]
      },
      '2': {
        id: 2,
        userId: 2,
        businessName: "Singapore Tech Hub",
        businessCategory: "Technology",
        subsector: "Software Development",
        description: "Full-stack development and digital transformation consulting services. We help businesses modernize their operations through cutting-edge technology solutions.",
        companyOverview: "Singapore Tech Hub is a leading technology consulting firm established in 2015. We specialize in digital transformation, cloud migration, and custom software development. Our team of 50+ engineers serves clients across Asia-Pacific.",
        countryOfOrigin: "Singapore",
        targetMarkets: ["Asia", "Australia", "North America"],
        contactEmail: "hello@singaporetech.com",
        contactPhone: "+65-9123-4567",
        websiteUrl: "https://singaporetech.com",
        logoImageUrl: "/images/placeholders/tech-logo.svg",
        galleryImageUrls: [
          "/images/v.jpg",
          "/images/home-background.jpg",
          "/images/auth-background.jpg"
        ],
        isActive: true,
        createdAt: "2023-02-20T10:00:00Z",
        updatedAt: "2024-02-20T10:00:00Z",
        languagesSpoken: ["English", "Mandarin", "Malay"],
        isVerified: true,
        productsInfo: [
          {
            name: "Custom Web Application",
            images: ["/images/placeholders/web-app.jpg"],
            specifications: "React/Next.js, Node.js backend, PostgreSQL database",
            moq: "1 project"
          },
          {
            name: "Mobile App Development",
            images: ["/images/placeholders/mobile-app.jpg"],
            specifications: "React Native, iOS/Android compatible, API integration",
            moq: "1 app"
          }
        ]
      },
      '3': {
        id: 3,
        userId: 3,
        businessName: "Mumbai Finance Group",
        businessCategory: "Finance",
        subsector: "Investment Advisory",
        description: "Comprehensive financial planning and investment advisory services. We provide expert guidance for individuals and businesses looking to optimize their financial strategies.",
        companyOverview: "Mumbai Finance Group has been serving the Indian financial market for over 20 years. Our certified financial advisors help clients navigate complex investment landscapes and achieve their financial goals.",
        countryOfOrigin: "Mumbai, India",
        targetMarkets: ["Asia", "Middle East"],
        contactEmail: "info@mumbaifinance.com",
        contactPhone: "+91-98765-43210",
        websiteUrl: "https://mumbaifinance.com",
        logoImageUrl: "/images/placeholders/finance-logo.svg",
        galleryImageUrls: [
          "/images/b.jpg",
          "/images/v.jpg"
        ],
        isActive: true,
        createdAt: "2023-03-10T10:00:00Z",
        updatedAt: "2024-03-10T10:00:00Z",
        languagesSpoken: ["English", "Hindi", "Marathi"],
        isVerified: true,
        productsInfo: [
          {
            name: "Investment Portfolio Management",
            images: ["/images/placeholders/portfolio.jpg"],
            specifications: "Diversified portfolio, risk assessment, quarterly reviews",
            moq: "₹1,00,000 minimum investment"
          }
        ]
      },
      '4': {
        id: 4,
        userId: 4,
        businessName: "Kenya Agro Exports",
        businessCategory: "Agriculture",
        subsector: "Agricultural Products",
        description: "Premium agricultural products and export logistics services. We connect Kenyan farmers with global markets, ensuring quality and sustainability.",
        companyOverview: "Kenya Agro Exports is a leading agricultural export company established in 2012. We work directly with over 500 farmers across Kenya to export high-quality agricultural products worldwide.",
        countryOfOrigin: "Nairobi, Kenya",
        targetMarkets: ["Europe", "Middle East", "Asia"],
        contactEmail: "exports@kenyaagro.com",
        contactPhone: "+254-712-345-678",
        websiteUrl: "https://kenyaagro.com",
        logoImageUrl: "/images/placeholders/agriculture-logo.svg",
        galleryImageUrls: [
          "/images/k.jpg",
          "/images/n.jpg",
          "/images/home-background.jpg"
        ],
        isActive: true,
        createdAt: "2023-04-05T10:00:00Z",
        updatedAt: "2024-04-05T10:00:00Z",
        languagesSpoken: ["English", "Swahili"],
        isVerified: true,
        productsInfo: [
          {
            name: "Premium Coffee Beans",
            images: ["/images/placeholders/coffee.jpg"],
            specifications: "Arabica variety, AA grade, moisture content <12%",
            moq: "1000 kg"
          },
          {
            name: "Fresh Cut Flowers",
            images: ["/images/placeholders/flowers.jpg"],
            specifications: "Roses, carnations, chrysanthemums, cold chain delivery",
            moq: "500 stems"
          }
        ]
      },
      '5': {
        id: 5,
        userId: 5,
        businessName: "Dubai Construction Co.",
        businessCategory: "Construction",
        subsector: "Infrastructure Development",
        description: "Large-scale construction and infrastructure development projects. We deliver world-class construction solutions across the Middle East and Africa.",
        companyOverview: "Dubai Construction Co. has been a leader in Middle Eastern construction for over 15 years. We have completed projects worth over $2 billion, including skyscrapers, bridges, and industrial facilities.",
        countryOfOrigin: "Dubai, UAE",
        targetMarkets: ["Middle East", "Africa", "Asia"],
        contactEmail: "projects@dubaiconst.com",
        contactPhone: "+971-50-123-4567",
        websiteUrl: "https://dubaiconst.com",
        logoImageUrl: "/images/placeholders/construction-logo.svg",
        galleryImageUrls: [
          "/images/v.jpg",
          "/images/b.jpg",
          "/images/auth-background.jpg"
        ],
        isActive: true,
        createdAt: "2023-05-12T10:00:00Z",
        updatedAt: "2024-05-12T10:00:00Z",
        languagesSpoken: ["English", "Arabic", "Hindi"],
        isVerified: true,
        productsInfo: [
          {
            name: "High-Rise Construction",
            images: ["/images/placeholders/highrise.jpg"],
            specifications: "Steel frame, glass facade, 50+ floors capability",
            moq: "1 project"
          },
          {
            name: "Infrastructure Development",
            images: ["/images/placeholders/infrastructure.jpg"],
            specifications: "Roads, bridges, utilities, project management",
            moq: "1 project"
          }
        ]
      }
    };

    const listing = sampleListings[id];
    
    if (!listing) {
      return NextResponse.json({ 
        error: 'Listing not found',
        msg: 'The requested listing does not exist'
      }, { status: 404 });
    }

    return NextResponse.json(listing);

  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      msg: 'Failed to fetch listing details'
    }, { status: 500 });
  }
}
