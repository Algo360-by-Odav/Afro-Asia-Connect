import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  StatusBar,
  FlatList,
  Image,
  Modal,
  Animated,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface BusinessCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

interface BusinessData {
  id: string;
  name: string;
  description: string;
  industry: string;
  location: string;
  rating: number;
  reviews: number;
  isPremium: boolean;
  isVerified: boolean;
  tags: string[];
  companySize: string;
  yearsInBusiness: number;
  revenueRange: string;
  certifications: string[];
}

interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  country: string;
  rating: number;
  reviews: number;
  verified: boolean;
  premium: boolean;
  description: string;
  image: string;
  tags: string[];
  companySize: 'SME' | 'Large' | 'Multinational';
  yearsInBusiness: number;
  revenueRange: string;
  certifications: string[];
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'company' | 'industry' | 'location';
  icon: string;
}

interface FilterOptions {
  companySize: string[];
  revenueRange: string[];
  yearsInBusiness: { min: number; max: number };
  rating: { min: number; max: number };
  certifications: string[];
  sortBy: 'relevance' | 'rating' | 'distance' | 'premium';
  sortOrder: 'asc' | 'desc';
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'company' | 'industry' | 'location';
  icon: string;
}

const ServicesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(['Mining companies Nigeria', 'Tech startups Singapore']);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    companySize: [],
    revenueRange: [],
    yearsInBusiness: { min: 0, max: 50 },
    rating: { min: 0, max: 5 },
    certifications: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const categories: BusinessCategory[] = [
    { id: 'all', name: 'All Industries', icon: 'business', count: 2847, color: colors.primary },
    { id: 'manufacturing', name: 'Manufacturing', icon: 'precision-manufacturing', count: 542, color: colors.success },
    { id: 'technology', name: 'Technology', icon: 'computer', count: 398, color: colors.info },
    { id: 'finance', name: 'Finance & Banking', icon: 'account-balance', count: 287, color: colors.accent },
    { id: 'logistics', name: 'Logistics & Trade', icon: 'local-shipping', count: 456, color: colors.warning },
    { id: 'energy', name: 'Energy & Mining', icon: 'bolt', count: 234, color: colors.error },
    { id: 'agriculture', name: 'Agriculture', icon: 'agriculture', count: 378, color: colors.success },
    { id: 'healthcare', name: 'Healthcare', icon: 'local-hospital', count: 189, color: colors.info },
  ];

  const regions = [
    { id: 'all', name: 'All Regions', flag: '🌍' },
    { id: 'west-africa', name: 'West Africa', flag: '🇳🇬' },
    { id: 'east-africa', name: 'East Africa', flag: '🇰🇪' },
    { id: 'south-africa', name: 'Southern Africa', flag: '🇿🇦' },
    { id: 'north-africa', name: 'North Africa', flag: '🇪🇬' },
    { id: 'southeast-asia', name: 'Southeast Asia', flag: '🇸🇬' },
    { id: 'east-asia', name: 'East Asia', flag: '🇨🇳' },
    { id: 'south-asia', name: 'South Asia', flag: '🇮🇳' },
  ];

  const featuredBusinesses: Business[] = [
    {
      id: '1',
      name: 'African Mining Consortium',
      category: 'Energy & Mining',
      location: 'Lagos, Nigeria',
      country: 'Nigeria',
      rating: 4.8,
      reviews: 127,
      verified: true,
      premium: true,
      description: 'Leading mining and mineral processing company across West Africa',
      image: 'https://via.placeholder.com/300x200/0A2342/FFFFFF?text=AMC',
      tags: ['Gold Mining', 'Copper', 'Infrastructure'],
      companySize: 'Large',
      yearsInBusiness: 15,
      revenueRange: '$50M - $100M',
      certifications: ['ISO 9001', 'ISO 14001', 'Mining License'],
    },
    {
      id: '2',
      name: 'Singapore Tech Solutions',
      category: 'Technology',
      location: 'Singapore',
      country: 'Singapore',
      rating: 4.9,
      reviews: 203,
      verified: true,
      premium: true,
      description: 'Enterprise software solutions and digital transformation services',
      image: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=STS',
      tags: ['Software', 'AI/ML', 'Cloud Services'],
      companySize: 'Multinational',
      yearsInBusiness: 12,
      revenueRange: '$100M+',
      certifications: ['ISO 27001', 'SOC 2', 'AWS Partner'],
    },
    {
      id: '3',
      name: 'Kenya Agricultural Export',
      category: 'Agriculture',
      location: 'Nairobi, Kenya',
      country: 'Kenya',
      rating: 4.7,
      reviews: 89,
      verified: true,
      premium: false,
      description: 'Premium coffee and tea export to global markets',
      image: 'https://via.placeholder.com/300x200/FFD700/000000?text=KAE',
      tags: ['Coffee Export', 'Tea', 'Organic'],
      companySize: 'SME',
      yearsInBusiness: 8,
      revenueRange: '$5M - $10M',
      certifications: ['Organic Certified', 'Fair Trade', 'Export License'],
    },
    {
      id: '4',
      name: 'Mumbai Financial Services',
      category: 'Finance & Banking',
      location: 'Mumbai, India',
      country: 'India',
      rating: 4.6,
      reviews: 156,
      verified: true,
      premium: true,
      description: 'Corporate banking and investment solutions for emerging markets',
      image: 'https://via.placeholder.com/300x200/6366F1/FFFFFF?text=MFS',
      tags: ['Corporate Banking', 'Investment', 'Trade Finance'],
      companySize: 'Large',
      yearsInBusiness: 25,
      revenueRange: '$25M - $50M',
      certifications: ['RBI License', 'ISO 27001', 'Basel III Compliant'],
    },
  ];

  const searchSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'African Mining Consortium', type: 'company', icon: 'business' },
    { id: '2', text: 'Singapore Tech Solutions', type: 'company', icon: 'business' },
    { id: '3', text: 'Manufacturing companies', type: 'industry', icon: 'precision-manufacturing' },
    { id: '4', text: 'Lagos, Nigeria', type: 'location', icon: 'location-on' },
    { id: '5', text: 'Technology startups', type: 'industry', icon: 'computer' },
    { id: '6', text: 'Singapore', type: 'location', icon: 'location-on' },
  ];

  // Filter businesses based on search query and filters
  useEffect(() => {
    let filtered = [...featuredBusinesses];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(business => 
        business.name.toLowerCase().includes(query) ||
        business.category.toLowerCase().includes(query) ||
        business.location.toLowerCase().includes(query) ||
        business.description.toLowerCase().includes(query) ||
        business.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(business => 
        business.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Apply region filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(business => 
        business.location.toLowerCase().includes(selectedRegion.toLowerCase())
      );
    }

    // Apply advanced filters
    if (filters.companySize.length > 0) {
      filtered = filtered.filter(business => 
        filters.companySize.includes(business.companySize)
      );
    }

    if (filters.rating.min > 0) {
      filtered = filtered.filter(business => business.rating >= filters.rating.min);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return filters.sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
        case 'distance':
          // Mock distance sorting
          return filters.sortOrder === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
        case 'premium':
          return filters.sortOrder === 'asc' ? 
            (a.premium ? -1 : 1) - (b.premium ? -1 : 1) :
            (b.premium ? -1 : 1) - (a.premium ? -1 : 1);
        default: // relevance
          return 0;
      }
    });

    setFilteredBusinesses(filtered);
  }, [searchQuery, selectedCategory, selectedRegion, filters, featuredBusinesses]);

  // Contact Action Handlers
  const handleCall = useCallback((phoneNumber: string) => {
    console.log('handleCall called with:', phoneNumber);
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((err) => {
        console.error('Error opening phone dialer:', err);
        Alert.alert('Error', 'Failed to open phone dialer');
      });
  }, []);

  const handleEmail = useCallback((email: string, subject?: string) => {
    const emailUrl = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(emailUrl);
        } else {
          Alert.alert('Error', 'Email is not supported on this device');
        }
      })
      .catch((err) => {
        console.error('Error opening email:', err);
        Alert.alert('Error', 'Failed to open email client');
      });
  }, []);

  const handleWhatsApp = useCallback((phoneNumber: string, message?: string) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}${message ? `&text=${encodeURIComponent(message)}` : ''}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Fallback to web WhatsApp
          const webWhatsappUrl = `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
          return Linking.openURL(webWhatsappUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('Error', 'Failed to open WhatsApp');
      });
  }, []);

  const handleLinkedIn = useCallback((linkedinUrl: string) => {
    Linking.canOpenURL(linkedinUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(linkedinUrl);
        } else {
          Alert.alert('Error', 'Cannot open LinkedIn profile');
        }
      })
      .catch((err) => {
        console.error('Error opening LinkedIn:', err);
        Alert.alert('Error', 'Failed to open LinkedIn profile');
      });
  }, []);

  // Quick Action Handlers
  const handleSave = useCallback((businessId: string, businessName: string) => {
    // TODO: Implement save to favorites functionality
    Alert.alert('Saved!', `${businessName} has been saved to your favorites`);
  }, []);

  const handleShare = useCallback(async (business: any) => {
    try {
      const shareContent = {
        title: business.name,
        message: `Check out ${business.name} on AfroAsiaConnect!\n\n${business.description}\n\nLocation: ${business.location}\nRating: ${business.rating} stars\n\nDiscover more businesses on AfroAsiaConnect.`,
        url: `https://afroasiaconnect.com/business/${business.id}`, // Replace with actual URL
      };
      
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share business');
    }
  }, []);

  const handleGetQuote = useCallback((business: any) => {
    // TODO: Navigate to quote request screen or open quote modal
    Alert.alert(
      'Request Quote',
      `Would you like to request a quote from ${business.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Request Quote', 
          onPress: () => {
            // TODO: Implement quote request functionality
            Alert.alert('Quote Requested', `Your quote request has been sent to ${business.name}. They will contact you soon!`);
          }
        },
      ]
    );
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setShowSearchSuggestions(true);
    } else {
      setShowSearchSuggestions(false);
    }
  };

  const handleSearchSubmit = (query: string) => {
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
    setShowSearchSuggestions(false);
    // Implement actual search logic here
  };

  const clearFilters = () => {
    setFilters({
      companySize: [],
      revenueRange: [],
      yearsInBusiness: { min: 0, max: 50 },
      rating: { min: 0, max: 5 },
      certifications: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.companySize.length > 0) count++;
    if (filters.revenueRange.length > 0) count++;
    if (filters.certifications.length > 0) count++;
    if (filters.rating.min > 0 || filters.rating.max < 5) count++;
    if (filters.yearsInBusiness.min > 0 || filters.yearsInBusiness.max < 50) count++;
    return count;
  };

  const renderCategoryCard = ({ item }: { item: BusinessCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory === item.id && styles.categoryCardSelected,
      ]}
      onPress={() => setSelectedCategory(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIcon, { backgroundColor: `${item.color}15` }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryCount}>{item.count.toLocaleString()} companies</Text>
    </TouchableOpacity>
  );

  const handleContactAction = (business: Business, action: string) => {
    console.log('Button pressed:', action, 'for business:', business.name);
    
    // Mock contact information - in real app, this would come from the business data
    const mockContacts = {
      phone: business.id === '1' ? '+234-803-123-4567' : business.id === '2' ? '+65-9123-4567' : '+91-98765-43210',
      email: business.id === '1' ? 'contact@africanmining.com' : business.id === '2' ? 'hello@singaporetech.com' : 'info@mumbaifinance.com',
      linkedin: business.id === '1' ? 'https://linkedin.com/company/african-mining-consortium' : business.id === '2' ? 'https://linkedin.com/company/singapore-tech-solutions' : 'https://linkedin.com/company/mumbai-financial-services',
    };
    
    console.log('Mock contacts:', mockContacts);

    switch (action) {
      case 'call':
        Alert.alert('Call', `Calling ${mockContacts.phone}`);
        // handleCall(mockContacts.phone);
        break;
      case 'email':
        Alert.alert('Email', `Emailing ${mockContacts.email}`);
        // handleEmail(mockContacts.email, `Inquiry about ${business.name}`);
        break;
      case 'whatsapp':
        Alert.alert('WhatsApp', `Opening WhatsApp for ${mockContacts.phone}`);
        // handleWhatsApp(mockContacts.phone, `Hi! I'm interested in your services at ${business.name}. Could you please provide more information?`);
        break;
      case 'linkedin':
        Alert.alert('LinkedIn', `Opening LinkedIn: ${mockContacts.linkedin}`);
        // handleLinkedIn(mockContacts.linkedin);
        break;
      case 'save':
        Alert.alert('Save', `Saving ${business.name} to favorites`);
        // handleSave(business.id, business.name);
        break;
      case 'share':
        Alert.alert('Share', `Sharing ${business.name}`);
        // handleShare(business);
        break;
      case 'quote':
        Alert.alert('Quote', `Requesting quote from ${business.name}`);
        // handleGetQuote(business);
        break;
      default:
        break;
    }
  };

  const renderListHeader = () => (
    <View>
      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity 
          style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Icon name="view-list" size={20} color={viewMode === 'list' ? colors.textInverse : colors.textSecondary} />
          <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>List</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.viewToggleButton, viewMode === 'map' && styles.viewToggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Icon name="map" size={20} color={viewMode === 'map' ? colors.textInverse : colors.textSecondary} />
          <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>Map</Text>
        </TouchableOpacity>
      </View>

      {/* Region Filters */}
      <View style={styles.regionFilters}>
        <FlatList
          data={regions}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.regionChip,
                selectedRegion === item.id && styles.regionChipSelected,
              ]}
              onPress={() => setSelectedRegion(item.id)}
            >
              <Text
                style={[
                  styles.regionChipText,
                  selectedRegion === item.id && styles.regionChipTextSelected,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionFiltersContent}
        />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Industry</Text>
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryCard,
                selectedCategory === item.id && styles.categoryCardSelected,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Icon name={item.icon} size={32} color={item.color} />
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryCount}>{item.count} businesses</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.categoryRow}
        />
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Featured Premium Businesses</Text>
    </View>
  );

  const renderBusinessCard = ({ item }: { item: Business }) => (
    <View style={styles.businessCard}>
      <View style={styles.businessImageContainer}>
        <View style={styles.businessImagePlaceholder}>
          <Icon name="business" size={40} color={colors.primary} />
        </View>
        {item.premium && (
          <View style={styles.premiumBadge}>
            <Icon name="star" size={12} color={colors.accent} />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Icon name="verified" size={16} color={colors.success} />
          </View>
        )}
      </View>
      
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{item.name}</Text>
        <Text style={styles.businessCategory}>{item.category}</Text>
        <Text style={styles.businessLocation}>
          <Icon name="location-on" size={14} color={colors.textSecondary} />
          {' '}{item.location}
        </Text>
        
        <View style={styles.businessRating}>
          <Icon name="star" size={16} color={colors.accent} />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewsText}>({item.reviews} reviews)</Text>
        </View>
        
        <Text style={styles.businessDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.businessTags}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        {/* Business Hours & Availability */}
        <View style={styles.businessHours}>
          <Icon name="access-time" size={14} color={colors.textSecondary} />
          <Text style={styles.businessHoursText}>Open • Closes 6:00 PM</Text>
          <View style={styles.availabilityDot} />
          <Text style={styles.availabilityText}>Available</Text>
        </View>
        
        {/* Contact Actions */}
        <View style={styles.contactActions}>
          <TouchableOpacity onPress={() => console.log('Call', item.name)}>
            <Icon name="phone" size={18} color={colors.primary} />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Email', item.name)}>
            <Icon name="email" size={18} color={colors.primary} />
            <Text style={styles.contactButtonText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('WhatsApp', item.name)}>
            <Icon name="message" size={18} color={colors.primary} />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('LinkedIn', item.name)}>
            <Icon name="business" size={18} color={colors.primary} />
            <Text style={styles.contactButtonText}>LinkedIn</Text>
          </TouchableOpacity>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity onPress={() => console.log('Save', item.name)}>
            <Icon name="bookmark-border" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Share', item.name)}>
            <Icon name="share" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Get Quote', item.name)}>
            <Icon name="request-quote" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      {/* Header with Search */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Business Directory</Text>
        <Text style={styles.headerSubtitle}>
          Discover premium businesses across Africa & Asia
        </Text>
        
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search companies, industries, locations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={() => handleSearchSubmit(searchQuery)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => {
                setSearchQuery('');
                setShowSearchSuggestions(false);
              }}
            >
              <Icon name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.filterButton, getActiveFiltersCount() > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Icon name="tune" size={20} color={getActiveFiltersCount() > 0 ? colors.textInverse : colors.primary} />
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
            
            {/* Search Suggestions */}
            {showSearchSuggestions && (
              <View style={styles.searchSuggestions}>
                {recentSearches.length > 0 && (
                  <View style={styles.suggestionSection}>
                    <Text style={styles.suggestionSectionTitle}>Recent Searches</Text>
                    {recentSearches.map((search, index) => (
                      <TouchableOpacity
                        key={`recent-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setSearchQuery(search);
                          handleSearchSubmit(search);
                        }}
                      >
                        <Icon name="history" size={18} color={colors.textSecondary} />
                        <Text style={styles.suggestionText}>{search}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setRecentSearches(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <Icon name="close" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                <View style={styles.suggestionSection}>
                  <Text style={styles.suggestionSectionTitle}>Suggestions</Text>
                  {searchSuggestions
                    .filter(suggestion => 
                      suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion.id}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setSearchQuery(suggestion.text);
                          handleSearchSubmit(suggestion.text);
                        }}
                      >
                        <Icon name={suggestion.icon} size={18} color={colors.textSecondary} />
                        <Text style={styles.suggestionText}>{suggestion.text}</Text>
                        <View style={styles.suggestionType}>
                          <Text style={styles.suggestionTypeText}>{suggestion.type}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  }
                </View>
              </View>
            )}
          </LinearGradient>

          {viewMode === 'list' ? (
            <FlatList
              style={styles.content}
              data={filteredBusinesses}
              renderItem={renderBusinessCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.businessList}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Icon name="search-off" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>No businesses found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try adjusting your search or filters
                  </Text>
                </View>
              )}
              ListFooterComponent={() => <View style={styles.bottomSpacing} />}
            />
          ) : (
            <View style={styles.content}>
              {renderListHeader()}
              <View style={styles.mapContainer}>
                <View style={styles.mapPlaceholder}>
                  <Icon name="map" size={48} color={colors.textSecondary} />
                  <Text style={styles.mapPlaceholderTitle}>Interactive Map View</Text>
                  <Text style={styles.mapPlaceholderSubtitle}>
                    Premium businesses in your area
                  </Text>
                  
                  <View style={styles.mapLegend}>
                    <View style={styles.mapLegendItem}>
                      <View style={[styles.mapPin, { backgroundColor: colors.primary }]} />
                      <Text style={styles.mapLegendText}>Premium</Text>
                    </View>
                    <View style={styles.mapLegendItem}>
                      <View style={[styles.mapPin, { backgroundColor: colors.accent }]} />
                      <Text style={styles.mapLegendText}>Verified</Text>
                    </View>
                  </View>
                </View>
                
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.mapBusinessCards}
                  contentContainerStyle={styles.mapBusinessCardsContent}
                >
                  {filteredBusinesses.slice(0, 5).map((business) => (
                    <View key={business.id} style={styles.mapBusinessCard}>
                      <View style={styles.mapBusinessImageContainer}>
                        <View style={styles.mapBusinessImagePlaceholder}>
                          <Icon name="business" size={24} color={colors.primary} />
                        </View>
                      </View>
                      <Text style={styles.mapBusinessName} numberOfLines={1}>
                        {business.name}
                      </Text>
                      <Text style={styles.mapBusinessLocation} numberOfLines={1}>
                        {business.location}
                      </Text>
                      <View style={styles.mapBusinessRating}>
                        <Icon name="star" size={12} color={colors.accent} />
                        <Text style={styles.mapBusinessRatingText}>{business.rating}</Text>
                        <Text style={styles.mapBusinessDistance}>0.5km</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Advanced Filters Modal */}
          <Modal
          visible={showFilters}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFilters(false)}
        >
          <SafeAreaView style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.filterTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          
          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Company Size Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Company Size</Text>
              <View style={styles.filterOptions}>
                {['SME', 'Large', 'Multinational'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.filterChip,
                      filters.companySize.includes(size) && styles.filterChipSelected,
                    ]}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        companySize: prev.companySize.includes(size)
                          ? prev.companySize.filter(s => s !== size)
                          : [...prev.companySize, size],
                      }));
                    }}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.companySize.includes(size) && styles.filterChipTextSelected,
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Revenue Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Revenue Range</Text>
              <View style={styles.filterOptions}>
                {['Under $1M', '$1M - $5M', '$5M - $10M', '$10M - $25M', '$25M - $50M', '$50M - $100M', '$100M+'].map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.filterChip,
                      filters.revenueRange.includes(range) && styles.filterChipSelected,
                    ]}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        revenueRange: prev.revenueRange.includes(range)
                          ? prev.revenueRange.filter(r => r !== range)
                          : [...prev.revenueRange, range],
                      }));
                    }}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.revenueRange.includes(range) && styles.filterChipTextSelected,
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Years in Business Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Years in Business</Text>
              <View style={styles.filterOptions}>
                {['0-2 years', '3-5 years', '6-10 years', '11-20 years', '20+ years'].map((years) => (
                  <TouchableOpacity
                    key={years}
                    style={styles.filterChip}
                  >
                    <Text style={styles.filterChipText}>{years}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Rating Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingFilter}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={styles.ratingOption}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        rating: { ...prev.rating, min: rating },
                      }));
                    }}
                  >
                    <View style={styles.ratingStars}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Icon
                          key={i}
                          name="star"
                          size={16}
                          color={i < rating ? colors.accent : colors.border}
                        />
                      ))}
                    </View>
                    <Text style={styles.ratingText}>{rating}+ stars</Text>
                    {filters.rating.min === rating && (
                      <Icon name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Certifications Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Certifications</Text>
              <View style={styles.filterOptions}>
                {['ISO 9001', 'ISO 14001', 'ISO 27001', 'SOC 2', 'Organic Certified', 'Fair Trade', 'Export License'].map((cert) => (
                  <TouchableOpacity
                    key={cert}
                    style={[
                      styles.filterChip,
                      filters.certifications.includes(cert) && styles.filterChipSelected,
                    ]}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        certifications: prev.certifications.includes(cert)
                          ? prev.certifications.filter(c => c !== cert)
                          : [...prev.certifications, cert],
                      }));
                    }}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.certifications.includes(cert) && styles.filterChipTextSelected,
                    ]}>
                      {cert}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'relevance', label: 'Relevance', icon: 'search' },
                  { key: 'rating', label: 'Highest Rated', icon: 'star' },
                  { key: 'premium', label: 'Premium First', icon: 'workspace-premium' },
                  { key: 'distance', label: 'Distance', icon: 'location-on' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      filters.sortBy === option.key && styles.sortOptionSelected,
                    ]}
                    onPress={() => {
                      setFilters(prev => ({ ...prev, sortBy: option.key as any }));
                    }}
                  >
                    <Icon name={option.icon} size={20} color={filters.sortBy === option.key ? colors.primary : colors.textSecondary} />
                    <Text style={[
                      styles.sortOptionText,
                      filters.sortBy === option.key && styles.sortOptionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                    {filters.sortBy === option.key && (
                      <Icon name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.filterFooter}>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                setShowFilters(false);
                // Apply filters logic here
              }}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textInverse,
    opacity: 0.9,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    padding: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
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
  regionScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  regionFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  regionName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  regionNameSelected: {
    color: colors.textInverse,
  },
  regionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  regionChipTextSelected: {
    color: colors.textInverse,
  },
  categoryRow: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  businessCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  businessImageContainer: {
    position: 'relative',
    height: 120,
  },
  businessImagePlaceholder: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginLeft: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  businessInfo: {
    padding: 16,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  businessLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  businessRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  businessTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
  // Search Enhancement Styles
  clearSearchButton: {
    position: 'absolute',
    right: 50,
    top: 12,
    padding: 4,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '600',
  },
  // Search Suggestions Styles
  searchSuggestions: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 300,
    zIndex: 1000,
  },
  suggestionSection: {
    paddingVertical: 8,
  },
  suggestionSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
  },
  suggestionType: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  suggestionTypeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // Filter Modal Styles
  filterModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: colors.textInverse,
  },
  // Rating Filter Styles
  ratingFilter: {
    gap: 12,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingFilterText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  // Sort Options Styles
  sortOptions: {
    gap: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  sortOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  sortOptionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
  },
  sortOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Filter Footer Styles
  filterFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyFiltersButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  // Interactive Business Card Styles
  businessHours: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  businessHoursText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    marginRight: 8,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  availabilityText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    marginHorizontal: 2,
  },
  contactButtonText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  quoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quoteButtonText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Region Filter Styles
  regionFilters: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  regionFiltersContent: {
    paddingHorizontal: 4,
  },
  businessList: {
    paddingHorizontal: 20,
  },
  // View Toggle Styles
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.primary,
  },
  viewToggleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: 6,
  },
  viewToggleTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  // Map View Styles
  mapContainer: {
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Additional map styles for JSX compatibility
  mapPlaceholderSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapPin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  mapLegendText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  mapBusinessCards: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  mapBusinessCardsContent: {
    paddingHorizontal: 20,
  },
  mapBusinessCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mapBusinessImageContainer: {
    position: 'relative',
    height: 60,
    marginBottom: 8,
  },
  mapBusinessImagePlaceholder: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mapBusinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mapBusinessName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  mapBusinessRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapBusinessRatingText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    marginLeft: 2,
  },
  mapBusinessLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  mapBusinessDistance: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default ServicesScreen;
