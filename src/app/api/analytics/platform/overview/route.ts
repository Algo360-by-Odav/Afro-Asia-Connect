import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@netlify/neon';

const sql = neon(); // Uses NETLIFY_DATABASE_URL automatically

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
    const [totalUsersResult] = await sql`
      SELECT COUNT(*) as total_users FROM users
    `;

    // Get new users in the specified period
    const [newUsersResult] = await sql`
      SELECT COUNT(*) as new_users 
      FROM users 
      WHERE created_at >= ${dateThreshold.toISOString()}
    `;

    // Get total bookings (assuming you have a bookings table)
    const [totalBookingsResult] = await sql`
      SELECT COUNT(*) as total_bookings 
      FROM bookings
    `.catch(() => [{ total_bookings: 0 }]); // Fallback if table doesn't exist

    // Get revenue data (assuming you have transactions/payments table)
    const [revenueResult] = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE status = 'completed'
    `.catch(() => [{ total_revenue: 0, total_transactions: 0 }]); // Fallback if table doesn't exist

    const analyticsData = {
      users: {
        totalUsers: parseInt(totalUsersResult.total_users),
        newUsers: parseInt(newUsersResult.new_users)
      },
      bookings: {
        totalBookings: parseInt(totalBookingsResult.total_bookings)
      },
      revenue: {
        totalRevenue: parseFloat(revenueResult.total_revenue) || 0,
        totalTransactions: parseInt(revenueResult.total_transactions)
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
