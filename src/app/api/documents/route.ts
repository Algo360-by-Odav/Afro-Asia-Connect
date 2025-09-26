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
    const ownerId = searchParams.get('ownerId');
    const category = searchParams.get('category');

    // Verify user can access this data
    if (ownerId && ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // Sample documents data
    const allDocuments = [
      {
        id: '1',
        ownerId: ownerId || userId,
        name: 'Business Registration Certificate',
        category: 'GENERAL_BUSINESS',
        type: 'PDF',
        size: 2048000,
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/documents/business-registration.pdf'
      },
      {
        id: '2',
        ownerId: ownerId || userId,
        name: 'Tax Clearance Certificate',
        category: 'GENERAL_BUSINESS',
        type: 'PDF',
        size: 1536000,
        uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/documents/tax-certificate.pdf'
      },
      {
        id: '3',
        ownerId: ownerId || userId,
        name: 'Export License',
        category: 'TRADE',
        type: 'PDF',
        size: 3072000,
        uploadedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved',
        expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/documents/export-license.pdf'
      },
      {
        id: '4',
        ownerId: ownerId || userId,
        name: 'Import Permit',
        category: 'TRADE',
        type: 'PDF',
        size: 2560000,
        uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/documents/import-permit.pdf'
      },
      {
        id: '5',
        ownerId: ownerId || userId,
        name: 'ISO 9001 Certificate',
        category: 'COMPLIANCE',
        type: 'PDF',
        size: 1024000,
        uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved',
        expiryDate: new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/documents/iso-certificate.pdf'
      },
      {
        id: '6',
        ownerId: ownerId || userId,
        name: 'Quality Assurance Certificate',
        category: 'COMPLIANCE',
        type: 'PDF',
        size: 1792000,
        uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/documents/quality-certificate.pdf'
      }
    ];

    // Filter by category if specified
    const filteredDocuments = category 
      ? allDocuments.filter(doc => doc.category === category)
      : allDocuments;

    return NextResponse.json({ 
      documents: filteredDocuments,
      total: filteredDocuments.length,
      categories: ['GENERAL_BUSINESS', 'TRADE', 'COMPLIANCE']
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
