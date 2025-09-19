import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return basic categories for now
    const categories = [
      { id: 1, name: 'Technology', slug: 'technology', description: 'Tech services and products' },
      { id: 2, name: 'Business', slug: 'business', description: 'Business services and consulting' },
      { id: 3, name: 'Healthcare', slug: 'healthcare', description: 'Medical and health services' },
      { id: 4, name: 'Education', slug: 'education', description: 'Educational services and training' },
      { id: 5, name: 'Finance', slug: 'finance', description: 'Financial services and consulting' },
      { id: 6, name: 'Marketing', slug: 'marketing', description: 'Marketing and advertising services' },
      { id: 7, name: 'Legal', slug: 'legal', description: 'Legal services and consultation' },
      { id: 8, name: 'Construction', slug: 'construction', description: 'Construction and building services' }
    ];

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
