import { apiService } from './apiService';

export interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  completionRate: number;
  averageRating: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  bookingsByStatus: Array<{
    status: string;
    count: number;
  }>;
}

class AnalyticsService {
  async getDashboardAnalytics(days: number = 30): Promise<AnalyticsData> {
    try {
      const response = await apiService.get(`/analytics/dashboard?days=${days}`);
      
      if (response.success) {
        return response.data;
      }
      
      // Return mock data if API fails
      return this.getMockAnalytics();
    } catch (error) {
      console.error('Analytics service error:', error);
      return this.getMockAnalytics();
    }
  }

  async getServiceAnalytics(serviceId: string): Promise<any> {
    try {
      const response = await apiService.get(`/analytics/service/${serviceId}`);
      return response.success ? response.data : {};
    } catch (error) {
      console.error('Service analytics error:', error);
      return {};
    }
  }

  async getEarningsAnalytics(period: string = 'month'): Promise<any> {
    try {
      const response = await apiService.get(`/analytics/earnings?period=${period}`);
      return response.success ? response.data : this.getMockEarnings();
    } catch (error) {
      console.error('Earnings analytics error:', error);
      return this.getMockEarnings();
    }
  }

  private getMockAnalytics(): AnalyticsData {
    return {
      totalRevenue: 15420,
      totalBookings: 87,
      completionRate: 94.5,
      averageRating: 4.8,
      monthlyRevenue: [
        { month: 'Jan', revenue: 2500 },
        { month: 'Feb', revenue: 3200 },
        { month: 'Mar', revenue: 2800 },
        { month: 'Apr', revenue: 3500 },
        { month: 'May', revenue: 3400 },
      ],
      bookingsByStatus: [
        { status: 'COMPLETED', count: 65 },
        { status: 'PENDING', count: 12 },
        { status: 'CONFIRMED', count: 8 },
        { status: 'CANCELLED', count: 2 },
      ],
    };
  }

  private getMockEarnings() {
    return {
      totalEarnings: 15420,
      monthlyEarnings: 3400,
      weeklyEarnings: 850,
      pendingPayouts: 1200,
      completedBookings: 65,
      averageBookingValue: 237,
      earningsHistory: [
        { date: '2024-01-01', amount: 150 },
        { date: '2024-01-02', amount: 200 },
        { date: '2024-01-03', amount: 180 },
        { date: '2024-01-04', amount: 220 },
        { date: '2024-01-05', amount: 190 },
      ],
    };
  }

  async trackEvent(eventName: string, properties: any): Promise<void> {
    try {
      await apiService.post('/analytics/track', {
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
