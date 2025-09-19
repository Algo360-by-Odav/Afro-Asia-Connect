import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return empty array since we don't have premium news in the database yet
    // This prevents the 404 error and allows the UI to show "No news available"
    return NextResponse.json({
      success: true,
      news: [],
      total: 0,
      page: 1,
      totalPages: 0
    });

  } catch (error) {
    console.error('Error fetching premium news:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
