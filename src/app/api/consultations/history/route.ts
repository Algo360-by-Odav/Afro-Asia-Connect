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

    // Sample consultation history
    const history = [
      {
        id: '1',
        providerId: providerId || userId,
        clientId: 'client-1',
        serviceTitle: 'Business Strategy Consultation',
        clientName: 'John Smith',
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        duration: 60,
        price: 150,
        status: 'completed',
        rating: 5,
        feedback: 'Excellent consultation, very insightful advice!'
      },
      {
        id: '2',
        providerId: providerId || userId,
        clientId: 'client-2',
        serviceTitle: 'Market Research Analysis',
        clientName: 'Sarah Johnson',
        scheduledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
        duration: 90,
        price: 200,
        status: 'completed',
        rating: 4,
        feedback: 'Good analysis, helped us understand the market better.'
      },
      {
        id: '3',
        providerId: providerId || userId,
        clientId: 'client-3',
        serviceTitle: 'Trade Documentation Support',
        clientName: 'Michael Chen',
        scheduledAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
        duration: 45,
        price: 100,
        status: 'completed',
        rating: 5,
        feedback: 'Very helpful with documentation requirements.'
      }
    ];

    return NextResponse.json({ history });

  } catch (error) {
    console.error('Error fetching consultation history:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
