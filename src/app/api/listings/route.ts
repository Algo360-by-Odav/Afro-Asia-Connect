import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Authentication is optional for public listings
    const authHeader = request.headers.get('authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
        userId = decoded.userId;
      } catch (jwtError) {
        // Invalid token, but continue as public request
        console.warn('Invalid token provided, continuing as public request');
      }
    }

    // Return sample listings for the Browse Directory
    const sampleListings = [
      {
        id: 1,
        title: "Premium Manufacturing Services",
        company: "African Industrial Solutions",
        category: "Manufacturing",
        location: "Lagos, Nigeria",
        description: "Leading manufacturer of industrial equipment and machinery across West Africa.",
        image: "/images/listings/manufacturing.jpg",
        verified: true,
        rating: 4.8,
        reviews: 156
      },
      {
        id: 2,
        title: "Tech Consulting & Development",
        company: "Singapore Tech Hub",
        category: "Technology",
        location: "Singapore",
        description: "Full-stack development and digital transformation consulting services.",
        image: "/images/listings/tech.jpg",
        verified: true,
        rating: 4.9,
        reviews: 203
      },
      {
        id: 3,
        title: "Financial Advisory Services",
        company: "Mumbai Finance Group",
        category: "Finance",
        location: "Mumbai, India",
        description: "Comprehensive financial planning and investment advisory services.",
        image: "/images/listings/finance.jpg",
        verified: true,
        rating: 4.7,
        reviews: 89
      },
      {
        id: 4,
        title: "Agricultural Export Solutions",
        company: "Kenya Agro Exports",
        category: "Agriculture",
        location: "Nairobi, Kenya",
        description: "Premium agricultural products and export logistics services.",
        image: "/images/listings/agriculture.jpg",
        verified: true,
        rating: 4.6,
        reviews: 124
      },
      {
        id: 5,
        title: "Construction & Infrastructure",
        company: "Dubai Construction Co.",
        category: "Construction",
        location: "Dubai, UAE",
        description: "Large-scale construction and infrastructure development projects.",
        image: "/images/listings/construction.jpg",
        verified: true,
        rating: 4.8,
        reviews: 167
      }
    ];

    return NextResponse.json({
      success: true,
      listings: sampleListings,
      total: sampleListings.length,
      page: 1,
      totalPages: 1
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
