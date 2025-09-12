import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Card, Button, Avatar, Badge, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';
import { analyticsService } from '../services/analyticsService';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalServices: number;
  activeBookings: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
  monthlyEarnings: number;
  pendingReviews: number;
  newMessages: number;
}

interface RecentBooking {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  status: string;
  amount: number;
}

export const SellerDashboardScreen: React.FC = ({ navigation }: any) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalServices: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    monthlyEarnings: 0,
    pendingReviews: 0,
    newMessages: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard analytics
      const analyticsResponse = await apiService.get('/analytics/dashboard?days=30');
      if (analyticsResponse.success && analyticsResponse.data.provider) {
        const providerData = analyticsResponse.data.provider;
        setStats({
          totalServices: providerData.services || 0,
          activeBookings: providerData.bookings?.active || 0,
          completedBookings: providerData.bookings?.completed || 0,
          totalEarnings: providerData.earnings || 0,
          averageRating: providerData.rating || 0,
          monthlyEarnings: analyticsResponse.data.earnings?.reduce((sum: number, earning: any) => sum + earning.amount, 0) || 0,
          pendingReviews: 0, // Will be loaded separately
          newMessages: 0, // Will be loaded separately
        });
      }

      // Load recent bookings
      const bookingsResponse = await apiService.get('/bookings/provider?limit=5');
      if (bookingsResponse.success) {
        setRecentBookings(bookingsResponse.data.bookings || []);
      }

      // Track screen view
      await analyticsService.trackEvent('seller_dashboard_viewed', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.statCard}>
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={styles.statGradient}
      >
        <View style={styles.statContent}>
          <Icon name={icon} size={24} color="#fff" />
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

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
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Avatar.Text
              size={50}
              label={user?.firstName?.charAt(0) || 'U'}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
              <View style={styles.ratingContainer}>
                <Icon name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{stats.averageRating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="notifications" size={24} color="#fff" />
            {stats.newMessages > 0 && (
              <Badge style={styles.notificationBadge}>{stats.newMessages}</Badge>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Services"
            value={stats.totalServices}
            icon="business"
            color="#4CAF50"
            onPress={() => navigation.navigate('Services')}
          />
          <StatCard
            title="Active Bookings"
            value={stats.activeBookings}
            icon="schedule"
            color="#FF9800"
            onPress={() => navigation.navigate('Bookings', { filter: 'active' })}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Earnings"
            value={formatCurrency(stats.totalEarnings)}
            icon="attach-money"
            color="#2196F3"
            onPress={() => navigation.navigate('Earnings')}
          />
          <StatCard
            title="This Month"
            value={formatCurrency(stats.monthlyEarnings)}
            icon="trending-up"
            color="#9C27B0"
            onPress={() => navigation.navigate('Analytics')}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Title title="Quick Actions" />
        <Card.Content>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddService')}
            >
              <Icon name="add-business" size={32} color="#667eea" />
              <Text style={styles.actionText}>Add Service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Bookings')}
            >
              <Icon name="calendar-today" size={32} color="#667eea" />
              <Text style={styles.actionText}>Manage Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Messages')}
            >
              <Icon name="message" size={32} color="#667eea" />
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Analytics')}
            >
              <Icon name="analytics" size={32} color="#667eea" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Bookings */}
      <Card style={styles.card}>
        <Card.Title
          title="Recent Bookings"
          right={(props) => (
            <Button
              {...props}
              onPress={() => navigation.navigate('Bookings')}
            >
              View All
            </Button>
          )}
        />
        <Card.Content>
          {recentBookings.length > 0 ? (
            recentBookings.map((booking, index) => (
              <View key={booking.id}>
                <View style={styles.bookingItem}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.customerName}>{booking.customerName}</Text>
                    <Text style={styles.serviceName}>{booking.serviceName}</Text>
                    <Text style={styles.bookingDate}>{booking.date}</Text>
                  </View>
                  <View style={styles.bookingStatus}>
                    <Badge
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(booking.status) }
                      ]}
                    >
                      {booking.status}
                    </Badge>
                    <Text style={styles.bookingAmount}>
                      {formatCurrency(booking.amount)}
                    </Text>
                  </View>
                </View>
                {index < recentBookings.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="event-busy" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent bookings</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Performance Summary */}
      <Card style={styles.card}>
        <Card.Title title="Performance Summary" />
        <Card.Content>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.completedBookings}</Text>
              <Text style={styles.performanceLabel}>Completed</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.performanceLabel}>Rating</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.pendingReviews}</Text>
              <Text style={styles.performanceLabel}>Pending Reviews</Text>
            </View>
          </View>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userDetails: {
    marginLeft: 15,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
  },
  statsContainer: {
    padding: 20,
    marginTop: -10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    width: (width - 50) / 2,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statTitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  card: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    elevation: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 80) / 2,
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  bookingStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: 4,
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginVertical: 8,
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
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default SellerDashboardScreen;
