import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
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

      const { planId } = await request.json();

      if (!planId) {
        return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
      }

      // For now, just return success since we don't have payment processing set up
      // In a real implementation, this would integrate with Stripe or another payment processor
      return NextResponse.json({
        success: true,
        message: 'Subscription created successfully',
        subscription: {
          id: `sub_${Date.now()}`,
          planId,
          userId,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      });

    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
