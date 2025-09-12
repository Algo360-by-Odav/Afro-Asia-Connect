// AfroAsiaConnect Mobile - Dashboard Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootState } from './src/store';
import { colors } from './src/theme';

interface DashboardScreenProps {
  navigation: any;
}

const { width: screenWidth } = Dimensions.get('window');

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const isProvider = user?.role === 'SERVICE_PROVIDER';

  // Mock data for now
  const analytics = {
    totalRevenue: 15420,
    totalBookings: 87,
    completionRate: 94.5,
    averageRating: 4.8,
    overview: {
      totalBookings: 87,
      totalRevenue: 15420,
      customerSatisfaction: 4.8
    },
    bookings: {
      completedBookings: 80,
      pendingBookings: 5,
      completionRate: 94.5
    }
  };
  
  const bookings = [
    { id: '1', customerName: 'John Doe', serviceName: 'Web Development', date: '2024-01-15', time: '10:00 AM', status: 'COMPLETED', provider: { firstName: 'John', lastName: 'Doe' } },
    { id: '2', customerName: 'Jane Smith', serviceName: 'Graphic Design', date: '2024-01-16', time: '11:00 AM', status: 'PENDING', provider: { firstName: 'Jane', lastName: 'Smith' } },
    { id: '3', customerName: 'Mike Johnson', serviceName: 'SEO Consulting', date: '2024-01-17', time: '12:00 PM', status: 'CANCELLED', provider: { firstName: 'Mike', lastName: 'Johnson' } }
  ];

  // Mock refetch functions
  const refetchAnalytics = async () => {
    console.log('Refreshing analytics...');
  };
  
  const refetchBookings = async () => {
    console.log('Refreshing bookings...');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchAnalytics(),
        refetchBookings(),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Sample data for charts
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [120, 180, 150, 220, 190, 280, 240],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const bookingStatusData = [
    {
      name: 'Completed',
      population: analytics?.bookings.completedBookings || 0,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Pending',
      population: analytics?.bookings.pendingBookings || 0,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Cancelled',
      population: 2,
      color: '#F44336',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
  };

  const renderProviderDashboard = () => (
    <>
      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="event" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>{analytics?.overview.totalBookings || 0}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="attach-money" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>${analytics?.overview.totalRevenue || 0}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="star" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{analytics?.overview.customerSatisfaction || 0}/5</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="trending-up" size={24} color="#9C27B0" />
          <Text style={styles.statNumber}>{analytics?.bookings.completionRate || 0}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>

      {/* Revenue Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartTitleText}>Revenue Trend</Text>
          <Text style={styles.chartSubtitle}>Chart visualization coming soon</Text>
        </View>
      </View>

      {/* Booking Status Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartTitleText}>Booking Status</Text>
          <Text style={styles.chartSubtitle}>Chart visualization coming soon</Text>
        </View>
      </View>
    </>
  );

  const renderCustomerDashboard = () => (
    <>
      {/* Recent Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        {bookings?.slice(0, 3).map((booking: any) => (
          <TouchableOpacity
            key={booking.id}
            style={styles.bookingCard}
            onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
          >
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingService}>{booking.service.serviceName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>
            <Text style={styles.bookingProvider}>
              with {booking.provider.firstName} {booking.provider.lastName}
            </Text>
            <Text style={styles.bookingDate}>
              {new Date(booking.date).toLocaleDateString()} at {booking.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recommended Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* Sample recommended services */}
          {[1, 2, 3].map((item) => (
            <TouchableOpacity key={item} style={styles.serviceCard}>
              <Image
                source={{ uri: `https://picsum.photos/150/100?random=${item}` }}
                style={styles.serviceImage}
              />
              <Text style={styles.serviceName}>Service {item}</Text>
              <Text style={styles.servicePrice}>$99</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}!
          </Text>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Icon name="notifications" size={24} color="#007AFF" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Period Selector (for providers) */}
      {isProvider && (
        <View style={styles.periodSelector}>
          {[7, 30, 90].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.periodButton,
                selectedPeriod === days && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(days)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === days && styles.periodButtonTextActive,
                ]}
              >
                {days}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Dashboard Content */}
      {isProvider ? renderProviderDashboard() : renderCustomerDashboard()}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Services')}
          >
            <Icon name="search" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Find Services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Icon name="chat" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="person" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    color: '#666',
    fontSize: 14,
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    margin: '1%',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  bookingCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingService: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingProvider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#999',
  },
  serviceCard: {
    width: 150,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceImage: {
    width: '100%',
    height: 100,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    padding: 8,
  },
  servicePrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  quickActions: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  chartPlaceholder: {
    backgroundColor: '#f8f9fa',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  chartTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default DashboardScreen;
