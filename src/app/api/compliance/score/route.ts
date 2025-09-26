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
    const requestedUserId = searchParams.get('userId');

    // Verify user can access this data
    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // Sample compliance score data
    const complianceScore = {
      userId: requestedUserId || userId,
      overallScore: 75,
      maxScore: 100,
      percentage: 75,
      lastUpdated: new Date().toISOString(),
      categories: {
        GENERAL_BUSINESS: {
          name: 'General Business',
          score: 80,
          maxScore: 100,
          requiredDocuments: 5,
          uploadedDocuments: 4,
          documents: [
            { name: 'Business Registration', status: 'uploaded', required: true },
            { name: 'Tax Certificate', status: 'uploaded', required: true },
            { name: 'Business License', status: 'uploaded', required: true },
            { name: 'Insurance Certificate', status: 'uploaded', required: true },
            { name: 'Financial Statements', status: 'missing', required: true }
          ]
        },
        TRADE: {
          name: 'Trade & Export',
          score: 70,
          maxScore: 100,
          requiredDocuments: 4,
          uploadedDocuments: 3,
          documents: [
            { name: 'Export License', status: 'uploaded', required: true },
            { name: 'Import Permit', status: 'uploaded', required: true },
            { name: 'Customs Declaration', status: 'uploaded', required: true },
            { name: 'Certificate of Origin', status: 'missing', required: true }
          ]
        },
        COMPLIANCE: {
          name: 'Regulatory Compliance',
          score: 75,
          maxScore: 100,
          requiredDocuments: 3,
          uploadedDocuments: 2,
          documents: [
            { name: 'ISO Certification', status: 'uploaded', required: false },
            { name: 'Quality Assurance Certificate', status: 'uploaded', required: true },
            { name: 'Environmental Compliance', status: 'missing', required: true }
          ]
        }
      },
      recommendations: [
        'Upload missing Financial Statements to improve General Business score',
        'Obtain Certificate of Origin to complete Trade documentation',
        'Consider getting Environmental Compliance certificate'
      ],
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    return NextResponse.json(complianceScore);

  } catch (error) {
    console.error('Error fetching compliance score:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
