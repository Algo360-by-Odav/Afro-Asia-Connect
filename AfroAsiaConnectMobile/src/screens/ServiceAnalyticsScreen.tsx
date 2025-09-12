import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  DataTable,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
// import { LineChart, BarChart } from 'react-native-chart-kit';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

interface ServiceAnalytics {
  serviceId: string;
  serviceName: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  completionRate: number;
  bookingTrend: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    customerName: string;
    bookings: number;
    totalSpent: number;
  }>;
  performanceMetrics: {
    viewsToBookings: number;
    repeatCustomers: number;
    averageBookingValue: number;
    cancellationRate: number;
  };
}

export const ServiceAnalyticsScreen: React.FC = ({ navigation, route }: any) => {
  const { serviceId } = route.params;
  const [analytics, setAnalytics] = useState<ServiceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadAnalytics();
  }, [serviceId, selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/analytics/service/${serviceId}?days=${selectedPeriod}`);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading service analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };


  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card style={styles.statCard}>
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={styles.statGradient}
      >
        <View style={styles.statContent}>
          <Icon name={icon} size={24} color="#fff" />
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </LinearGradient>
    </Card>
  );

  if (!analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="analytics" size={64} color="#ccc" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{analytics.serviceName}</Text>
        <Text style={styles.headerSubtitle}>Service Analytics</Text>
        <View style={styles.periodSelector}>
          {['7', '30', '90'].map(period => (
            <Chip
              key={period}
              selected={selectedPeriod === period}
              onPress={() => setSelectedPeriod(period)}
              style={[
                styles.periodChip,
                selectedPeriod === period && styles.selectedPeriodChip
              ]}
              textStyle={[
                styles.periodChipText,
                selectedPeriod === period && styles.selectedPeriodChipText
              ]}
            >
              {period}d
            </Chip>
          ))}
        </View>
      </LinearGradient>

      {/* Key Metrics */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Bookings"
            value={analytics.totalBookings}
            icon="event"
            color="#2196F3"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(analytics.totalRevenue)}
            icon="attach-money"
            color="#4CAF50"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Average Rating"
            value={analytics.averageRating.toFixed(1)}
            icon="star"
            color="#FF9800"
            subtitle={`${analytics.reviewCount} reviews`}
          />
          <StatCard
            title="Completion Rate"
            value={`${analytics.completionRate.toFixed(1)}%`}
            icon="check-circle"
            color="#9C27B0"
          />
        </View>
      </View>

      {/* Booking Trend */}
      <Card style={styles.chartCard}>
        <Card.Title title="Booking Trend (Last 7 Days)" />
        <Card.Content>
          <View style={styles.trendContainer}>
            <Text style={styles.trendText}>
              Recent bookings: {analytics.bookingTrend.slice(-7).reduce((sum, item) => sum + item.bookings, 0)}
            </Text>
            <Text style={styles.trendSubtext}>
              Chart visualization coming soon
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Revenue Trend */}
      <Card style={styles.chartCard}>
        <Card.Title title="Revenue Trend (Last 7 Days)" />
        <Card.Content>
          <View style={styles.trendContainer}>
            <Text style={styles.trendText}>
              Recent revenue: ${analytics.bookingTrend.slice(-7).reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
            </Text>
            <Text style={styles.trendSubtext}>
              Chart visualization coming soon
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      <Card style={styles.card}>
        <Card.Title title="Performance Metrics" />
        <Card.Content>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {analytics.performanceMetrics.averageBookingValue.toFixed(0)}%
              </Text>
              <Text style={styles.metricLabel}>Avg. Booking Value</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {analytics.performanceMetrics.repeatCustomers}
              </Text>
              <Text style={styles.metricLabel}>Repeat Customers</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {analytics.performanceMetrics.cancellationRate.toFixed(1)}%
              </Text>
              <Text style={styles.metricLabel}>Cancellation Rate</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Top Customers */}
      <Card style={styles.card}>
        <Card.Title title="Top Customers" />
        <Card.Content>
          {analytics.topCustomers.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Customer</DataTable.Title>
                <DataTable.Title numeric>Bookings</DataTable.Title>
                <DataTable.Title numeric>Total Spent</DataTable.Title>
              </DataTable.Header>
              {analytics.topCustomers.map((customer, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{customer.customerName}</DataTable.Cell>
                  <DataTable.Cell numeric>{customer.bookings}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatCurrency(customer.totalSpent)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No customer data available</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    marginTop: 16,
  },
  periodChip: {
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  selectedPeriodChip: {
    backgroundColor: '#fff',
  },
  periodChipText: {
    color: '#fff',
  },
  selectedPeriodChipText: {
    color: '#667eea',
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    width: (width - 50) / 2,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statTitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  statSubtitle: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  chartCard: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  card: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    elevation: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  trendContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  trendText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  trendSubtext: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ServiceAnalyticsScreen;
