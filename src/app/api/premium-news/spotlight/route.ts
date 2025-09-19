import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return empty array since we don't have spotlight news in the database yet
    // This prevents the 404 error and allows the UI to show "No spotlight news available"
    return NextResponse.json({
      success: true,
      spotlight: [],
      total: 0
    });

  } catch (error) {
    console.error('Error fetching spotlight news:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
