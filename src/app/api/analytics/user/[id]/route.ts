import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    const requestingUserId = decoded.userId;
    const { id: targetUserId } = params;

    // Verify user can access this data
    if (targetUserId !== requestingUserId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const days = searchParams.get('days') || '30';

    // Sample analytics data
    const analyticsData = {
      userId: targetUserId,
      period: period,
      summary: {
        totalViews: 1247,
        totalClicks: 89,
        totalEngagements: 156,
        conversionRate: 7.1,
        averageSessionDuration: 245, // seconds
        bounceRate: 34.2,
        topPages: [
          { page: '/services', views: 423, percentage: 33.9 },
          { page: '/profile', views: 298, percentage: 23.9 },
          { page: '/consultations', views: 187, percentage: 15.0 },
          { page: '/dashboard', views: 156, percentage: 12.5 },
          { page: '/settings', views: 183, percentage: 14.7 }
        ]
      },
      metrics: {
        profileViews: {
          current: 1247,
          previous: 1089,
          change: 14.5,
          trend: 'up'
        },
        serviceInquiries: {
          current: 89,
          previous: 76,
          change: 17.1,
          trend: 'up'
        },
        bookings: {
          current: 23,
          previous: 19,
          change: 21.1,
          trend: 'up'
        },
        revenue: {
          current: 3450,
          previous: 2890,
          change: 19.4,
          trend: 'up',
          currency: 'USD'
        }
      },
      chartData: {
        dailyViews: Array.from({ length: parseInt(days) }, (_, i) => ({
          date: new Date(Date.now() - (parseInt(days) - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 50) + 20,
          clicks: Math.floor(Math.random() * 10) + 2,
          engagements: Math.floor(Math.random() * 15) + 3
        })),
        deviceBreakdown: [
          { device: 'Desktop', percentage: 45.2, count: 564 },
          { device: 'Mobile', percentage: 38.7, count: 483 },
          { device: 'Tablet', percentage: 16.1, count: 200 }
        ],
        trafficSources: [
          { source: 'Direct', percentage: 32.1, count: 400 },
          { source: 'Search', percentage: 28.5, count: 355 },
          { source: 'Social Media', percentage: 22.3, count: 278 },
          { source: 'Referral', percentage: 17.1, count: 214 }
        ]
      },
      performance: {
        responseTime: {
          average: 245,
          p95: 450,
          p99: 780
        },
        availability: 99.8,
        errorRate: 0.2,
        satisfaction: {
          score: 4.6,
          totalRatings: 127,
          distribution: {
            5: 68,
            4: 34,
            3: 18,
            2: 5,
            1: 2
          }
        }
      },
      goals: {
        monthlyViews: {
          target: 1500,
          current: 1247,
          progress: 83.1
        },
        conversionRate: {
          target: 10.0,
          current: 7.1,
          progress: 71.0
        },
        revenue: {
          target: 5000,
          current: 3450,
          progress: 69.0
        }
      },
      insights: [
        {
          type: 'positive',
          title: 'Strong Growth Trend',
          description: 'Profile views increased by 14.5% compared to last period'
        },
        {
          type: 'opportunity',
          title: 'Mobile Optimization',
          description: 'Mobile traffic is growing but conversion rate is lower than desktop'
        },
        {
          type: 'warning',
          title: 'Bounce Rate Alert',
          description: 'Bounce rate increased to 34.2%, consider improving page load speed'
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
