import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {
  Card,
  Button,
  Avatar,
  Badge,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';

interface BookingDetails {
  id: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  service: {
    serviceName: string;
    category: string;
    description: string;
  };
  paymentStatus: string;
  paymentMethod?: string;
}

export const BookingDetailsScreen: React.FC = ({ navigation, route }: any) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/bookings/${bookingId}`);
      if (response.success) {
        setBooking(response.data.booking);
      } else {
        Alert.alert('Error', 'Failed to load booking details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      Alert.alert('Error', 'Failed to load booking details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const response = await apiService.patch(`/bookings/${bookingId}/status`, {
        status: newStatus
      });

      if (response.success) {
        setBooking(prev => prev ? { ...prev, status: newStatus as BookingDetails['status'] } : null);
        Alert.alert('Success', `Booking ${newStatus.toLowerCase()} successfully`);
      } else {
        Alert.alert('Error', response.error || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  const confirmBooking = () => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateBookingStatus('CONFIRMED')
        }
      ]
    );
  };

  const startService = () => {
    Alert.alert(
      'Start Service',
      'Mark this booking as in progress?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => updateBookingStatus('IN_PROGRESS')
        }
      ]
    );
  };

  const completeService = () => {
    Alert.alert(
      'Complete Service',
      'Mark this booking as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => updateBookingStatus('COMPLETED')
        }
      ]
    );
  };

  const cancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => updateBookingStatus('CANCELLED')
        }
      ]
    );
  };

  const callCustomer = () => {
    if (booking?.customerPhone) {
      Linking.openURL(`tel:${booking.customerPhone}`);
    } else {
      Alert.alert('No Phone Number', 'Customer phone number is not available');
    }
  };

  const emailCustomer = () => {
    if (booking?.customerEmail) {
      Linking.openURL(`mailto:${booking.customerEmail}`);
    }
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

  const getStatusActions = () => {
    if (!booking) return [];

    switch (booking.status) {
      case 'PENDING':
        return [
          { title: 'Confirm', action: confirmBooking, color: '#4CAF50', icon: 'check' },
          { title: 'Cancel', action: cancelBooking, color: '#F44336', icon: 'close' }
        ];
      case 'CONFIRMED':
        return [
          { title: 'Start Service', action: startService, color: '#2196F3', icon: 'play-arrow' },
          { title: 'Cancel', action: cancelBooking, color: '#F44336', icon: 'close' }
        ];
      case 'IN_PROGRESS':
        return [
          { title: 'Complete', action: completeService, color: '#9C27B0', icon: 'check-circle' }
        ];
      default:
        return [];
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  const actions = getStatusActions();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Avatar.Text
            size={60}
            label={booking.customer.firstName.charAt(0) + booking.customer.lastName.charAt(0)}
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.customerName}>
              {booking.customer.firstName} {booking.customer.lastName}
            </Text>
            <Text style={styles.serviceName}>{booking.service.serviceName}</Text>
            <Badge
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(booking.status) }
              ]}
            >
              {booking.status}
            </Badge>
          </View>
        </View>
      </LinearGradient>

      {/* Booking Information */}
      <Card style={styles.card}>
        <Card.Title title="Booking Information" />
        <Card.Content>
          <View style={styles.infoRow}>
            <Icon name="event" size={20} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>
                {formatDate(booking.bookingDate)} at {formatTime(booking.bookingTime)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="schedule" size={20} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{booking.duration} minutes</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="attach-money" size={20} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Total Amount</Text>
              <Text style={styles.infoValue}>${booking.totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="payment" size={20} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Payment Status</Text>
              <Text style={styles.infoValue}>
                {booking.paymentStatus} {booking.paymentMethod && `(${booking.paymentMethod})`}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Customer Information */}
      <Card style={styles.card}>
        <Card.Title title="Customer Information" />
        <Card.Content>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{booking.customerEmail}</Text>
            </View>
          </View>

          {booking.customerPhone && (
            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color="#667eea" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{booking.customerPhone}</Text>
              </View>
            </View>
          )}

          <View style={styles.contactButtons}>
            <Button
              mode="outlined"
              onPress={emailCustomer}
              icon="email"
              style={styles.contactButton}
            >
              Email
            </Button>
            {booking.customerPhone && (
              <Button
                mode="outlined"
                onPress={callCustomer}
                icon="phone"
                style={styles.contactButton}
              >
                Call
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Service Details */}
      <Card style={styles.card}>
        <Card.Title title="Service Details" />
        <Card.Content>
          <View style={styles.infoRow}>
            <Icon name="business-center" size={20} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{booking.service.category}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="description" size={20} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{booking.service.description}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Special Requests */}
      {booking.specialRequests && (
        <Card style={styles.card}>
          <Card.Title title="Special Requests" />
          <Card.Content>
            <Text style={styles.specialRequestsText}>{booking.specialRequests}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Booking Timeline */}
      <Card style={styles.card}>
        <Card.Title title="Booking Timeline" />
        <Card.Content>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Booked on:</Text>
            <Text style={styles.timelineValue}>
              {new Date(booking.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Last updated:</Text>
            <Text style={styles.timelineValue}>
              {new Date(booking.updatedAt).toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <View style={styles.actionContainer}>
          {actions.map((action, index) => (
            <Button
              key={index}
              mode="contained"
              onPress={action.action}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              icon={action.icon}
              loading={updating}
              disabled={updating}
            >
              {action.title}
            </Button>
          ))}
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  customerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  serviceName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  contactButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  contactButton: {
    marginRight: 12,
  },
  specialRequestsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  timelineItem: {
    marginBottom: 12,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    color: '#333',
  },
  actionContainer: {
    padding: 16,
    paddingTop: 8,
  },
  actionButton: {
    marginBottom: 12,
    paddingVertical: 4,
  },
});

export default BookingDetailsScreen;
