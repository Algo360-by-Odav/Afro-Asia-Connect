import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      const userId = decoded.userId;
      const userRole = decoded.role;

      // Check if user is admin
      if (userRole !== 'admin') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      // Sample admin dashboard data
      const dashboardData = {
        overview: {
          totalUsers: 1247,
          activeUsers: 892,
          newUsersToday: 23,
          totalServices: 456,
          activeServices: 389,
          totalBookings: 2134,
          pendingBookings: 45,
          completedBookings: 1987,
          totalRevenue: 125430.50,
          monthlyRevenue: 18750.25,
          averageRating: 4.6,
          totalReviews: 1876
        },
        userStats: {
          userGrowth: [
            { month: 'Jan', users: 850, active: 720 },
            { month: 'Feb', users: 920, active: 780 },
            { month: 'Mar', users: 1050, active: 850 },
            { month: 'Apr', users: 1150, active: 920 },
            { month: 'May', users: 1200, active: 950 },
            { month: 'Jun', users: 1247, active: 892 }
          ],
          usersByRegion: [
            { region: 'Africa', count: 687, percentage: 55.1 },
            { region: 'Asia', count: 423, percentage: 33.9 },
            { region: 'Europe', count: 89, percentage: 7.1 },
            { region: 'Americas', count: 35, percentage: 2.8 },
            { region: 'Others', count: 13, percentage: 1.1 }
          ]
        },
        serviceStats: {
          topCategories: [
            { category: 'Business Consulting', count: 123, revenue: 45600 },
            { category: 'Trade Services', count: 98, revenue: 38200 },
            { category: 'Legal Services', count: 76, revenue: 29800 },
            { category: 'Financial Services', count: 65, revenue: 25400 },
            { category: 'Technology', count: 52, revenue: 20100 }
          ],
          servicePerformance: [
            { month: 'Jan', services: 380, bookings: 1650 },
            { month: 'Feb', services: 385, bookings: 1720 },
            { month: 'Mar', services: 392, bookings: 1850 },
            { month: 'Apr', services: 401, bookings: 1920 },
            { month: 'May', services: 415, bookings: 2050 },
            { month: 'Jun', services: 456, bookings: 2134 }
          ]
        },
        revenueStats: {
          monthlyRevenue: [
            { month: 'Jan', revenue: 15200, bookings: 1650 },
            { month: 'Feb', revenue: 16800, bookings: 1720 },
            { month: 'Mar', revenue: 17500, bookings: 1850 },
            { month: 'Apr', revenue: 18200, bookings: 1920 },
            { month: 'May', revenue: 18900, bookings: 2050 },
            { month: 'Jun', revenue: 18750, bookings: 2134 }
          ],
          revenueByCategory: [
            { category: 'Business Consulting', revenue: 45600, percentage: 36.4 },
            { category: 'Trade Services', revenue: 38200, percentage: 30.5 },
            { category: 'Legal Services', revenue: 29800, percentage: 23.8 },
            { category: 'Financial Services', revenue: 25400, percentage: 20.3 },
            { category: 'Technology', revenue: 20100, percentage: 16.0 }
          ]
        },
        systemHealth: {
          serverStatus: 'healthy',
          uptime: '99.8%',
          responseTime: '245ms',
          activeConnections: 1247,
          errorRate: '0.2%',
          lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          databaseSize: '2.4GB',
          storageUsed: '68%'
        },
        recentActivity: [
          {
            id: '1',
            type: 'user_registration',
            description: 'New user registered: john.doe@example.com',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            severity: 'info'
          },
          {
            id: '2',
            type: 'service_created',
            description: 'New service created: "Market Research for African Markets"',
            timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
            severity: 'info'
          },
          {
            id: '3',
            type: 'booking_completed',
            description: 'Booking completed: Business Consulting Session',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            severity: 'success'
          },
          {
            id: '4',
            type: 'payment_processed',
            description: 'Payment processed: $250.00',
            timestamp: new Date(Date.now() - 67 * 60 * 1000).toISOString(),
            severity: 'success'
          },
          {
            id: '5',
            type: 'system_alert',
            description: 'High server load detected (resolved)',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            severity: 'warning'
          }
        ],
        pendingActions: [
          {
            id: '1',
            type: 'service_approval',
            description: 'Service pending approval: "International Trade Documentation"',
            priority: 'high',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'user_verification',
            description: '3 users pending identity verification',
            priority: 'medium',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'dispute_resolution',
            description: 'Booking dispute requires attention',
            priority: 'high',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ]
      };

      return NextResponse.json(dashboardData);

    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
