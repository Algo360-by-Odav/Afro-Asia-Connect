import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get basic metrics from database
    const [
      { count: totalUsers },
      { count: totalCompanies },
      { count: totalListings },
      { count: totalRequests }
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('companies').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('trade_listings').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('trade_requests').select('*', { count: 'exact', head: true })
    ]);

    const metrics = {
      totalUsers: totalUsers || 0,
      totalCompanies: totalCompanies || 0,
      totalListings: totalListings || 0,
      totalRequests: totalRequests || 0,
      activeUsers: 0, // TODO: Implement active users logic
      revenue: 0, // TODO: Implement revenue calculation
      growth: {
        users: 0,
        companies: 0,
        listings: 0
      }
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
