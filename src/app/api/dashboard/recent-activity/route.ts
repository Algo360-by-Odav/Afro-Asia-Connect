import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from auth header or token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // For now, return empty activities 
    // TODO: Implement real recent activity fetching from Supabase
    // For now, return empty array
    const activities: any[] = [];
    
    return NextResponse.json({ 
      success: true, 
      data: activities 
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
