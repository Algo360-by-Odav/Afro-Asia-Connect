import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Button,
  Searchbar,
  Chip,
  Badge,
  Menu,
  Divider,
  Avatar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';
import { colors } from '../theme';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  specialRequests?: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
}

export const BookingManagementScreen: React.FC = ({ navigation, route }: any) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(route?.params?.filter || 'ALL');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, selectedFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/bookings/provider');
      if (response.success) {
        setBookings(response.data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
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
      if (selectedFilter === 'ACTIVE') {
        filtered = filtered.filter(booking => 
          ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)
        );
      } else {
        filtered = filtered.filter(booking => booking.status === selectedFilter);
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by booking date (newest first)
    filtered.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await apiService.patch(`/bookings/${bookingId}/status`, {
        status: newStatus
      });

      if (response.success) {
        setBookings(prev => prev.map(booking =>
          booking.id === bookingId ? { ...booking, status: newStatus as 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' } : booking
        ));
        Alert.alert('Success', `Booking ${newStatus.toLowerCase()} successfully`);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Failed to update booking status');
    }
  };

  const confirmBooking = (bookingId: string) => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateBookingStatus(bookingId, 'CONFIRMED')
        }
      ]
    );
  };

  const cancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => updateBookingStatus(bookingId, 'CANCELLED')
        }
      ]
    );
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

  const getStatusActions = (booking: Booking) => {
    switch (booking.status) {
      case 'PENDING':
        return [
          { title: 'Confirm', action: () => confirmBooking(booking.id), color: '#4CAF50' },
          { title: 'Cancel', action: () => cancelBooking(booking.id), color: '#F44336' }
        ];
      case 'CONFIRMED':
        return [
          { title: 'Start Service', action: () => updateBookingStatus(booking.id, 'IN_PROGRESS'), color: '#2196F3' },
          { title: 'Cancel', action: () => cancelBooking(booking.id), color: '#F44336' }
        ];
      case 'IN_PROGRESS':
        return [
          { title: 'Complete', action: () => updateBookingStatus(booking.id, 'COMPLETED'), color: '#9C27B0' }
        ];
      default:
        return [];
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

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const actions = getStatusActions(booking);

    return (
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
              <Icon name="business" size={16} color="#666" />
              <Text style={styles.detailText}>{booking.serviceName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="event" size={16} color="#666" />
              <Text style={styles.detailText}>
                {formatDate(booking.bookingDate)} at {formatTime(booking.bookingTime)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="schedule" size={16} color="#666" />
              <Text style={styles.detailText}>{booking.duration} minutes</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="attach-money" size={16} color="#666" />
              <Text style={styles.detailText}>${booking.totalAmount.toFixed(2)}</Text>
            </View>
            {booking.specialRequests && (
              <View style={styles.specialRequests}>
                <Text style={styles.specialRequestsLabel}>Special Requests:</Text>
                <Text style={styles.specialRequestsText}>{booking.specialRequests}</Text>
              </View>
            )}
          </View>
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
            style={styles.actionButton}
          >
            View Details
          </Button>
          {booking.customerPhone && (
            <Button
              mode="outlined"
              onPress={() => {/* Implement call functionality */}}
              icon="phone"
              style={styles.actionButton}
            >
              Call
            </Button>
          )}
          {actions.map((action, index) => (
            <Button
              key={index}
              mode="contained"
              onPress={action.action}
              style={[styles.actionButton, { backgroundColor: action.color }]}
            >
              {action.title}
            </Button>
          ))}
        </Card.Actions>
      </Card>
    );
  };

  const FilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
    >
      {['ALL', 'ACTIVE', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(filter => (
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

  return (
    <View style={styles.container}>
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
                : 'You don\'t have any bookings yet'
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
    backgroundColor: colors.surface,
  },
  searchContainer: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.success,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
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
  specialRequests: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
  },
  specialRequestsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  specialRequestsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  cardActions: {
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  actionButton: {
    marginHorizontal: 4,
    marginVertical: 4,
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

export default BookingManagementScreen;
