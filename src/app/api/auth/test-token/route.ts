import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    console.log('Test token endpoint called');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found');
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Token received, length:', token.length);
    
    // Check if NEXTAUTH_SECRET exists
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET environment variable not found');
      return NextResponse.json({ 
        error: 'Server configuration error',
        message: 'NEXTAUTH_SECRET not configured'
      }, { status: 500 });
    }
    
    console.log('NEXTAUTH_SECRET exists, length:', process.env.NEXTAUTH_SECRET.length);
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    console.log('Token decoded successfully:', { userId: decoded.userId, email: decoded.email });

    return NextResponse.json({ 
      success: true, 
      message: 'Token is valid',
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tokenExp: decoded.exp,
        tokenIat: decoded.iat
      }
    });

  } catch (error) {
    console.error('Error in test-token:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT Error:', error.message);
      return NextResponse.json({ 
        error: 'Invalid token', 
        details: error.message,
        type: 'JWT_ERROR'
      }, { status: 401 });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Token expired:', error.message);
      return NextResponse.json({ 
        error: 'Token expired', 
        details: error.message,
        type: 'TOKEN_EXPIRED'
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      type: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
