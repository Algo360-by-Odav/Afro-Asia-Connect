import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppSelector } from '../../store';
import { selectUser } from '../../store/slices/authSlice';
import { colors } from '../../constants/colors';
import {
  useGetDashboardAnalyticsQuery,
  useGetRecentBookingsQuery,
} from '../../store/api';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface MetricCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const user = useAppSelector(selectUser);

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useGetDashboardAnalyticsQuery({ days: 30 });

  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetRecentBookingsQuery({ limit: 5 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAnalytics(), refetchBookings()]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAnalytics, refetchBookings]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions: QuickAction[] = [
    {
      id: 'directory',
      title: 'Business Directory',
      icon: 'business',
      color: colors.primary,
      onPress: () => Alert.alert('Business Directory', 'Browse premium B2B companies across Africa & Asia'),
    },
    {
      id: 'connect',
      title: 'Connect & Partner',
      icon: 'handshake',
      color: colors.success,
      onPress: () => Alert.alert('Business Connections', 'Find strategic partners and suppliers'),
    },
    {
      id: 'insights',
      title: 'Market Insights',
      icon: 'trending-up',
      color: colors.accent,
      onPress: () => Alert.alert('Market Intelligence', 'Access premium market data and trends'),
    },
    {
      id: 'network',
      title: 'My Network',
      icon: 'group',
      color: colors.info,
      onPress: () => Alert.alert('Professional Network', 'Manage your business connections'),
    },
  ];

  const getMetrics = (): MetricCard[] => {
    const analytics = analyticsData?.data;
    const isProvider = user?.role === 'SERVICE_PROVIDER';

    if (isProvider) {
      return [
        {
          title: 'Business Inquiries',
          value: analytics?.totalBookings || 24,
          icon: 'business-center',
          color: colors.primary,
          trend: { value: 15, isPositive: true },
        },
        {
          title: 'Revenue Generated',
          value: `$${analytics?.totalRevenue || '125K'}`,
          icon: 'trending-up',
          color: colors.success,
          trend: { value: 22, isPositive: true },
        },
        {
          title: 'Business Rating',
          value: analytics?.averageRating || '4.8',
          icon: 'star',
          color: colors.accent,
        },
        {
          title: 'Active Listings',
          value: analytics?.activeServices || 8,
          icon: 'store',
          color: colors.info,
        },
      ];
    }

    return [
      {
        title: 'Connections Made',
        value: analytics?.totalBookings || 12,
        icon: 'group',
        color: colors.primary,
      },
      {
        title: 'Investment Value',
        value: `$${analytics?.totalSpent || '45K'}`,
        icon: 'account-balance',
        color: colors.success,
      },
      {
        title: 'Saved Companies',
        value: analytics?.favoriteServices || 28,
        icon: 'bookmark',
        color: colors.error,
      },
      {
        title: 'Market Reports',
        value: analytics?.reviewsGiven || 15,
        icon: 'assessment',
        color: colors.accent,
      },
    ];
  };

  const metrics = getMetrics();
  const recentBookings = bookingsData?.data || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Enhanced Header with Gradient */}
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userRole}>
                {user?.role === 'SERVICE_PROVIDER' ? 'Service Provider' : 'Customer'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => Alert.alert('Notifications', 'Coming soon!')}
              >
                <Icon name="notifications" size={24} color={colors.textInverse} />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Metrics Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Performance</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={[styles.metricIcon, { backgroundColor: `${metric.color}15` }]}>
                    <Icon name={metric.icon} size={24} color={metric.color} />
                  </View>
                  {metric.trend && (
                    <View style={styles.trendContainer}>
                      <Icon 
                        name={metric.trend.isPositive ? 'trending-up' : 'trending-down'} 
                        size={16} 
                        color={metric.trend.isPositive ? colors.success : colors.error} 
                      />
                      <Text style={[
                        styles.trendText,
                        { color: metric.trend.isPositive ? colors.success : colors.error }
                      ]}>
                        {metric.trend.value}%
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricTitle}>{metric.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Tools</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Icon name={action.icon} size={28} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Activity</Text>
            <TouchableOpacity onPress={() => Alert.alert('View All', 'Coming soon!')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentBookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {recentBookings.map((booking: any, index: number) => (
                <View key={booking.id || index} style={styles.bookingCard}>
                  <View style={styles.bookingLeft}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <Icon name="event" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingTitle}>
                        {booking.service?.title || 'Service Booking'}
                      </Text>
                      <Text style={styles.bookingDate}>
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bookingRight}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(booking.status) }
                    ]}>
                      <Text style={styles.statusText}>{booking.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="event-note" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No business activity</Text>
              <Text style={styles.emptyStateSubtext}>
                Your business connections and deals will appear here
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return colors.success;
    case 'pending':
      return colors.warning;
    case 'cancelled':
      return colors.error;
    case 'completed':
      return colors.info;
    default:
      return colors.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 16,
    color: colors.textInverse,
    opacity: 0.9,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: colors.textInverse,
    opacity: 0.8,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  bookingsList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bookingRight: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textInverse,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default DashboardScreen;
