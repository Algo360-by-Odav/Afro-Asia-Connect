import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  DataTable,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
// import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  pendingPayouts: number;
  completedBookings: number;
  averageBookingValue: number;
  topServices: Array<{
    serviceName: string;
    earnings: number;
    bookings: number;
  }>;
  earningsHistory: Array<{
    date: string;
    amount: number;
    bookings: number;
  }>;
  payoutHistory: Array<{
    id: string;
    amount: number;
    date: string;
    status: string;
    method: string;
  }>;
}

export const EarningsScreen: React.FC = ({ navigation }: any) => {
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0,
    pendingPayouts: 0,
    completedBookings: 0,
    averageBookingValue: 0,
    topServices: [],
    earningsHistory: [],
    payoutHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      
      const [analyticsResponse, earningsResponse, payoutsResponse] = await Promise.all([
        apiService.get(`/analytics/dashboard?days=${selectedPeriod}`),
        apiService.get(`/analytics/provider/earnings?days=${selectedPeriod}`),
        apiService.get('/payments/payouts')
      ]);

      if (analyticsResponse.success && analyticsResponse.data.provider) {
        const providerData = analyticsResponse.data.provider;
        const earningsHistory = earningsResponse.success ? earningsResponse.data : [];
        const payoutHistory = payoutsResponse.success ? payoutsResponse.data.payouts : [];

        setEarningsData({
          totalEarnings: providerData.earnings || 0,
          monthlyEarnings: earningsHistory.reduce((sum: number, item: any) => sum + item.amount, 0),
          weeklyEarnings: earningsHistory.slice(-7).reduce((sum: number, item: any) => sum + item.amount, 0),
          pendingPayouts: payoutHistory.filter((p: any) => p.status === 'PENDING').reduce((sum: number, p: any) => sum + p.amount, 0),
          completedBookings: providerData.bookings?.completed || 0,
          averageBookingValue: providerData.earnings && providerData.bookings?.completed 
            ? providerData.earnings / providerData.bookings.completed 
            : 0,
          topServices: [], // Will be populated from separate endpoint
          earningsHistory,
          payoutHistory,
        });
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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

  const OverviewTab = () => (
    <ScrollView>
      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Earnings"
            value={formatCurrency(earningsData.totalEarnings)}
            icon="account-balance-wallet"
            color="#4CAF50"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(earningsData.monthlyEarnings)}
            icon="trending-up"
            color="#2196F3"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="This Week"
            value={formatCurrency(earningsData.weeklyEarnings)}
            icon="date-range"
            color="#FF9800"
          />
          <StatCard
            title="Pending Payouts"
            value={formatCurrency(earningsData.pendingPayouts)}
            icon="schedule"
            color="#9C27B0"
          />
        </View>
      </View>

      {/* Earnings Chart */}
      <Card style={styles.chartCard}>
        <Card.Title title="Earnings Trend (Last 7 Days)" />
        <Card.Content>
          {earningsData.earningsHistory.length > 0 ? (
            <View style={styles.trendContainer}>
              <Text style={styles.trendText}>
                Recent earnings: ${earningsData.earningsHistory.slice(-7).reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
              </Text>
              <Text style={styles.trendSubtext}>
                Chart visualization coming soon
              </Text>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="show-chart" size={48} color="#ccc" />
              <Text style={styles.noDataText}>No earnings data available</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      <Card style={styles.card}>
        <Card.Title title="Performance Metrics" />
        <Card.Content>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{earningsData.completedBookings}</Text>
              <Text style={styles.metricLabel}>Completed Bookings</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatCurrency(earningsData.averageBookingValue)}</Text>
              <Text style={styles.metricLabel}>Avg. Booking Value</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const PayoutsTab = () => (
    <ScrollView>
      <Card style={styles.card}>
        <Card.Title 
          title="Payout History"
          right={(props) => (
            <Button
              {...props}
              onPress={() => navigation.navigate('RequestPayout')}
              mode="contained"
            >
              Request Payout
            </Button>
          )}
        />
        <Card.Content>
          {earningsData.payoutHistory.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Amount</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title>Method</DataTable.Title>
              </DataTable.Header>
              {earningsData.payoutHistory.map((payout) => (
                <DataTable.Row key={payout.id}>
                  <DataTable.Cell>{formatDate(payout.date)}</DataTable.Cell>
                  <DataTable.Cell>{formatCurrency(payout.amount)}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: payout.status === 'COMPLETED' ? '#4CAF50' : '#FF9800' }
                      ]}
                      textStyle={{ color: '#fff' }}
                    >
                      {payout.status}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell>{payout.method}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="payment" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No payout history</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <View style={styles.periodSelector}>
            {['7', '30', '90'].map(period => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.selectedPeriodButton
                ]}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.selectedPeriodButtonText
                ]}>
                  {period}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('overview')}
          style={[
            styles.tab,
            activeTab === 'overview' && styles.activeTab
          ]}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'overview' && styles.activeTabText
          ]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('payouts')}
          style={[
            styles.tab,
            activeTab === 'payouts' && styles.activeTab
          ]}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'payouts' && styles.activeTabText
          ]}>
            Payouts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'overview' ? (
          <OverviewTab />
        ) : (
          <PayoutsTab />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
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
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedPeriodButton: {
    backgroundColor: '#fff',
  },
  periodButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedPeriodButtonText: {
    color: '#667eea',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
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
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statusChip: {
    height: 24,
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

export default EarningsScreen;
