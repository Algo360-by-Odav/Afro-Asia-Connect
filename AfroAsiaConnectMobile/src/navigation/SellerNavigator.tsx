import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme';

// Import screens
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import ServiceManagementScreen from '../screens/ServiceManagementScreen';
import BookingManagementScreen from '../screens/BookingManagementScreen';
import EarningsScreen from '../screens/EarningsScreen';
import MessagingScreen from '../screens/MessagingScreen';

// Additional screens that will be navigated to
import AddServiceScreen from '../screens/AddServiceScreen';
import EditServiceScreen from '../screens/EditServiceScreen';
import ServiceAnalyticsScreen from '../screens/ServiceAnalyticsScreen';
import ServiceBookingsScreen from '../screens/ServiceBookingsScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import RequestPayoutScreen from '../screens/RequestPayoutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator for Seller
const SellerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Services':
              iconName = 'business-center';
              break;
            case 'Bookings':
              iconName = 'event';
              break;
            case 'Earnings':
              iconName = 'account-balance-wallet';
              break;
            case 'Messages':
              iconName = 'chat';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          elevation: 8,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={SellerDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Services" 
        component={ServiceManagementScreen}
        options={{
          tabBarLabel: 'Services',
        }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingManagementScreen}
        options={{
          tabBarLabel: 'Bookings',
        }}
      />
      <Tab.Screen 
        name="Earnings" 
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagingScreen}
        options={{
          tabBarLabel: 'Messages',
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator for Seller App
const SellerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}
    >
      {/* Main Tab Navigator */}
      <Stack.Screen 
        name="SellerTabs" 
        component={SellerTabNavigator}
        options={{ headerShown: false }}
      />

      {/* Service Management Screens */}
      <Stack.Screen 
        name="AddService" 
        component={AddServiceScreen}
        options={{
          title: 'Add New Service',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="EditService" 
        component={EditServiceScreen}
        options={{
          title: 'Edit Service',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="ServiceAnalytics" 
        component={ServiceAnalyticsScreen}
        options={{
          title: 'Service Analytics',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="ServiceBookings" 
        component={ServiceBookingsScreen}
        options={{
          title: 'Service Bookings',
          headerBackTitle: 'Back',
        }}
      />

      {/* Booking Management Screens */}
      <Stack.Screen 
        name="BookingDetails" 
        component={BookingDetailsScreen}
        options={{
          title: 'Booking Details',
          headerBackTitle: 'Back',
        }}
      />

      {/* Earnings Screens */}
      <Stack.Screen 
        name="RequestPayout" 
        component={RequestPayoutScreen}
        options={{
          title: 'Request Payout',
          headerBackTitle: 'Back',
        }}
      />

      {/* Profile & Settings */}
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

export default SellerNavigator;
