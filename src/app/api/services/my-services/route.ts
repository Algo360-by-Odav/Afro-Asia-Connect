import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      const userId = decoded.userId;

      // Get pagination parameters
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      // Sample services data for the user
      const sampleServices = [
        {
          id: '1',
          userId: userId,
          title: 'Business Consulting Services',
          description: 'Comprehensive business consulting for African and Asian markets. We help companies expand their operations, optimize processes, and navigate regulatory requirements.',
          category: 'Consulting',
          price: 150,
          duration: 60,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bookings: 12,
          rating: 4.8,
          reviews: 8
        },
        {
          id: '2',
          userId: userId,
          title: 'Market Research & Analysis',
          description: 'In-depth market research and competitive analysis for businesses looking to enter new markets in Africa and Asia.',
          category: 'Research',
          price: 200,
          duration: 90,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bookings: 8,
          rating: 4.9,
          reviews: 6
        },
        {
          id: '3',
          userId: userId,
          title: 'Trade Documentation Support',
          description: 'Expert assistance with import/export documentation, customs clearance, and trade compliance for international business.',
          category: 'Documentation',
          price: 100,
          duration: 45,
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bookings: 15,
          rating: 4.7,
          reviews: 12
        }
      ];

      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedServices = sampleServices.slice(startIndex, endIndex);
      const totalPages = Math.ceil(sampleServices.length / limit);

      return NextResponse.json({
        services: paginatedServices,
        currentPage: page,
        totalPages: totalPages,
        totalServices: sampleServices.length
      });

    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Error fetching user services:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
