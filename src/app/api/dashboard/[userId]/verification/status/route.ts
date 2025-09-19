import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      const tokenUserId = decoded.userId;
      const { userId } = params;

      // Verify the user is accessing their own data
      if (tokenUserId !== userId) {
        return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
      }

      // Return default verification status
      const verificationStatus = {
        isVerified: false,
        documentsSubmitted: 0,
        documentsRequired: 3,
        status: 'pending',
        lastUpdated: new Date().toISOString(),
        requiredDocuments: [
          { type: 'identity', name: 'Government ID', submitted: false },
          { type: 'business', name: 'Business License', submitted: false },
          { type: 'address', name: 'Proof of Address', submitted: false }
        ]
      };

      return NextResponse.json({
        success: true,
        verification: verificationStatus
      });

    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Error fetching verification status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
