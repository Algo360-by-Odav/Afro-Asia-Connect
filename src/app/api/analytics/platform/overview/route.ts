import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { success: false, msg: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
    }

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get new users in the specified period
    const { count: newUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateThreshold.toISOString());

    // Get total companies
    const { count: totalCompanies } = await supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact', head: true });

    // Get total trade listings
    const { count: totalListings } = await supabaseAdmin
      .from('trade_listings')
      .select('*', { count: 'exact', head: true });

    // Get active trade listings
    const { count: activeListings } = await supabaseAdmin
      .from('trade_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total trade requests
    const { count: totalRequests } = await supabaseAdmin
      .from('trade_requests')
      .select('*', { count: 'exact', head: true });

    const analyticsData = {
      users: {
        totalUsers: totalUsers || 0,
        newUsers: newUsers || 0
      },
      companies: {
        totalCompanies: totalCompanies || 0
      },
      listings: {
        totalListings: totalListings || 0,
        activeListings: activeListings || 0
      },
      requests: {
        totalRequests: totalRequests || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error fetching analytics' },
      { status: 500 }
    );
  }
}
