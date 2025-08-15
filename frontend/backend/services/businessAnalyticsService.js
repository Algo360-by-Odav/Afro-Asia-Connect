const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class BusinessAnalyticsService {
  // Get comprehensive dashboard analytics for service providers
  async getProviderDashboard(providerId, dateRange = 30) {
    try {
      console.log('📊 BusinessAnalytics: Getting dashboard for provider:', providerId, 'dateRange:', dateRange);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      console.log('📊 Date range:', startDate, 'to', endDate);

      const services = await prisma.service.findMany({
        where: { userId: providerId },
        select: { id: true, serviceName: true }
      });
      console.log('📊 Found services:', services.length, services.map(s => s.serviceName));

      const serviceIds = services.map(s => s.id);
      console.log('📊 Service IDs:', serviceIds);

      const [bookingStats, revenueStats, reviewStats] = await Promise.all([
        this.getBookingStatistics(serviceIds, startDate, endDate),
        this.getRevenueAnalytics(serviceIds, startDate, endDate),
        this.getReviewAnalytics(serviceIds, startDate, endDate)
      ]);

      return {
        providerId,
        dateRange: { startDate, endDate, days: dateRange },
        overview: {
          totalBookings: bookingStats.totalBookings,
          totalRevenue: revenueStats.totalRevenue,
          averageBookingValue: revenueStats.averageBookingValue,
          customerSatisfaction: reviewStats.averageRating
        },
        bookings: bookingStats,
        revenue: revenueStats,
        reviews: reviewStats
      };
    } catch (error) {
      console.error('Error getting provider dashboard:', error);
      throw error;
    }
  }

  // Get booking statistics
  async getBookingStatistics(serviceIds, startDate, endDate) {
    const bookings = await prisma.booking.findMany({
      where: {
        serviceId: { in: serviceIds },
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    const totalBookings = bookings.length;
    const completedBookings = statusCounts.COMPLETED || 0;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100) : 0;

    return {
      totalBookings,
      completedBookings,
      pendingBookings: statusCounts.PENDING || 0,
      completionRate: Math.round(completionRate * 100) / 100,
      statusBreakdown: statusCounts
    };
  }

  // Get revenue analytics
  async getRevenueAnalytics(serviceIds, startDate, endDate) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: startDate, lte: endDate },
        booking: { serviceId: { in: serviceIds } }
      }
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalTransactions = payments.length;
    const averageBookingValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTransactions,
      averageBookingValue: Math.round(averageBookingValue * 100) / 100
    };
  }

  // Get review analytics
  async getReviewAnalytics(serviceIds, startDate, endDate) {
    const reviews = await prisma.serviceReview.findMany({
      where: {
        serviceId: { in: serviceIds },
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {});

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution
    };
  }

  // Get platform analytics (admin only)
  async getPlatformAnalytics(dateRange = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const [userStats, bookingStats, revenueStats] = await Promise.all([
      this.getPlatformUserStats(startDate, endDate),
      this.getPlatformBookingStats(startDate, endDate),
      this.getPlatformRevenueStats(startDate, endDate)
    ]);

    return {
      dateRange: { startDate, endDate, days: dateRange },
      users: userStats,
      bookings: bookingStats,
      revenue: revenueStats
    };
  }

  async getPlatformUserStats(startDate, endDate) {
    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    return { totalUsers, newUsers };
  }

  async getPlatformBookingStats(startDate, endDate) {
    const totalBookings = await prisma.booking.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    return { totalBookings };
  }

  async getPlatformRevenueStats(startDate, endDate) {
    const revenueData = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    return {
      totalRevenue: Math.round((revenueData._sum.amount || 0) * 100) / 100,
      totalTransactions: revenueData._count.id
    };
  }
}

module.exports = new BusinessAnalyticsService();
