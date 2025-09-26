import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    // Sample consultations data
    const consultations = [
      {
        id: '1',
        providerId: providerId || userId,
        clientId: 'client-1',
        serviceId: '1',
        title: 'Business Strategy Consultation',
        description: 'Discuss market entry strategies for Asian markets',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        price: 150,
        createdAt: new Date().toISOString(),
        client: {
          name: 'John Smith',
          email: 'john@example.com',
          company: 'Smith Trading Co.'
        }
      },
      {
        id: '2',
        providerId: providerId || userId,
        clientId: 'client-2',
        serviceId: '2',
        title: 'Market Research Review',
        description: 'Review completed market analysis report',
        status: 'completed',
        scheduledAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        duration: 90,
        price: 200,
        createdAt: new Date().toISOString(),
        client: {
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          company: 'Global Ventures Ltd.'
        }
      }
    ];

    return NextResponse.json({ consultations });

  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
