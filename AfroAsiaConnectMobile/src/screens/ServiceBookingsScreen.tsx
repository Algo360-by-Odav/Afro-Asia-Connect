import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  Searchbar,
  Chip,
  Badge,
  Avatar,
  DataTable,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';

interface ServiceBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  bookingDate: string;
  bookingTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
  };
}

export const ServiceBookingsScreen: React.FC = ({ navigation, route }: any) => {
  const { serviceId } = route.params;
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [serviceName, setServiceName] = useState('');

  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadBookings();
  }, [serviceId]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, selectedFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, serviceResponse] = await Promise.all([
        apiService.get(`/bookings/service/${serviceId}`),
        apiService.get(`/services/${serviceId}`)
      ]);

      if (bookingsResponse.success) {
        setBookings(bookingsResponse.data.bookings || []);
      }

      if (serviceResponse.success) {
        setServiceName(serviceResponse.data.service.serviceName || 'Service');
      }
    } catch (error) {
      console.error('Error loading service bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filter by status
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(booking => booking.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by booking date (newest first)
    filtered.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

    setFilteredBookings(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'CONFIRMED': return '#4CAF50';
      case 'IN_PROGRESS': return '#2196F3';
      case 'COMPLETED': return '#9C27B0';
      case 'CANCELLED': return '#F44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getBookingStats = () => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'PENDING').length;
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
    const completed = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;
    const totalRevenue = bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return { total, pending, confirmed, completed, cancelled, totalRevenue };
  };

  const stats = getBookingStats();

  const FilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
    >
      {['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(filter => (
        <Chip
          key={filter}
          selected={selectedFilter === filter}
          onPress={() => setSelectedFilter(filter)}
          style={[
            styles.filterChip,
            selectedFilter === filter && styles.selectedFilterChip
          ]}
          textStyle={[
            styles.filterChipText,
            selectedFilter === filter && styles.selectedFilterChipText
          ]}
        >
          {filter}
        </Chip>
      ))}
    </ScrollView>
  );

  const BookingCard = ({ booking }: { booking: ServiceBooking }) => (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.customerInfo}>
          <Avatar.Text
            size={40}
            label={booking.customer.firstName.charAt(0) + booking.customer.lastName.charAt(0)}
            style={styles.avatar}
          />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>
              {booking.customer.firstName} {booking.customer.lastName}
            </Text>
            <Text style={styles.customerEmail}>{booking.customerEmail}</Text>
          </View>
        </View>
        <Badge
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(booking.status) }
          ]}
        >
          {booking.status}
        </Badge>
      </View>

      <Card.Content>
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Icon name="event" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatDate(booking.bookingDate)} at {formatTime(booking.bookingTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="attach-money" size={16} color="#666" />
            <Text style={styles.detailText}>${booking.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.detailText}>
              Booked on {new Date(booking.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Card.Content>

      <Card.Actions>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
          style={styles.actionButton}
        >
          View Details
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <Card style={styles.statsCard}>
        <Card.Title title={`${serviceName} Bookings`} />
        <Card.Content>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${stats.totalRevenue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search bookings..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <FilterChips />
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.bookingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="event-busy" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedFilter !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'This service has no bookings yet'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    elevation: 2,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedFilterChip: {
    backgroundColor: '#667eea',
  },
  filterChipText: {
    color: '#666',
  },
  selectedFilterChipText: {
    color: '#fff',
  },
  bookingsList: {
    flex: 1,
    padding: 16,
  },
  bookingCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#667eea',
  },
  customerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    marginLeft: 12,
  },
  bookingDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  actionButton: {
    marginHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ServiceBookingsScreen;
