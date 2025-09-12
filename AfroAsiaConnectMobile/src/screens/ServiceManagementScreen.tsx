import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Card,
  Button,
  FAB,
  Searchbar,
  Chip,
  Badge,
  Menu,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';
import { colors } from '../theme';

interface Service {
  id: string;
  serviceName: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  images: string[];
  bookingCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export const ServiceManagementScreen: React.FC = ({ navigation }: any) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchQuery, selectedFilter]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/services/provider');
      if (response.success) {
        setServices(response.data.services || []);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const filterServices = () => {
    let filtered = services;

    // Filter by status
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(service => service.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await apiService.patch(`/services/${serviceId}/status`, {
        status: newStatus
      });

      if (response.success) {
        setServices(prev => prev.map(service =>
          service.id === serviceId ? { ...service, status: newStatus } : service
        ));
        Alert.alert('Success', `Service ${newStatus.toLowerCase()} successfully`);
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      Alert.alert('Error', 'Failed to update service status');
    }
  };

  const deleteService = async (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.delete(`/services/${serviceId}`);
              if (response.success) {
                setServices(prev => prev.filter(service => service.id !== serviceId));
                Alert.alert('Success', 'Service deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', 'Failed to delete service');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#4CAF50';
      case 'INACTIVE': return '#757575';
      case 'PENDING': return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'check-circle';
      case 'INACTIVE': return 'pause-circle-filled';
      case 'PENDING': return 'schedule';
      default: return 'help';
    }
  };

  const ServiceCard = ({ service }: { service: Service }) => (
    <Card style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.serviceName}</Text>
          <Text style={styles.serviceCategory}>{service.category}</Text>
          <View style={styles.serviceMetrics}>
            <View style={styles.metric}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.metricText}>
                {service.rating.toFixed(1)} ({service.reviewCount})
              </Text>
            </View>
            <View style={styles.metric}>
              <Icon name="event" size={16} color="#666" />
              <Text style={styles.metricText}>{service.bookingCount} bookings</Text>
            </View>
          </View>
        </View>
        <View style={styles.serviceActions}>
          <Badge
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(service.status) }
            ]}
          >
            {service.status}
          </Badge>
          <Menu
            visible={menuVisible === service.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <TouchableOpacity
                onPress={() => setMenuVisible(service.id)}
                style={styles.menuButton}
              >
                <Icon name="more-vert" size={24} color="#666" />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                navigation.navigate('EditService', { serviceId: service.id });
              }}
              title="Edit"
              leadingIcon="edit"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                toggleServiceStatus(service.id, service.status);
              }}
              title={service.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              leadingIcon={service.status === 'ACTIVE' ? 'pause' : 'play-arrow'}
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                deleteService(service.id);
              }}
              title="Delete"
              leadingIcon="delete"
              titleStyle={{ color: '#F44336' }}
            />
          </Menu>
        </View>
      </View>

      <Card.Content>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {service.description}
        </Text>
        <View style={styles.servicePricing}>
          <Text style={styles.price}>${service.price}</Text>
          <Text style={styles.duration}>{service.duration} min</Text>
        </View>
      </Card.Content>

      <Card.Actions>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('ServiceAnalytics', { serviceId: service.id })}
          style={styles.actionButton}
        >
          Analytics
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('ServiceBookings', { serviceId: service.id })}
          style={styles.actionButton}
        >
          View Bookings
        </Button>
      </Card.Actions>
    </Card>
  );

  const FilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
    >
      {['ALL', 'ACTIVE', 'INACTIVE', 'PENDING'].map(filter => (
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
          placeholder="Search services..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <FilterChips />
      </View>

      {/* Services List */}
      <ScrollView
        style={styles.servicesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="business-center" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Services Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedFilter !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first service'
              }
            </Text>
            {!searchQuery && selectedFilter === 'ALL' && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('AddService')}
                style={styles.addFirstServiceButton}
              >
                Add Your First Service
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="add"
        onPress={() => navigation.navigate('AddService')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
  servicesList: {
    flex: 1,
    padding: 16,
  },
  serviceCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metricText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  serviceActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: 8,
  },
  menuButton: {
    padding: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  servicePricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    marginLeft: 8,
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
  addFirstServiceButton: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea',
  },
});

export default ServiceManagementScreen;
