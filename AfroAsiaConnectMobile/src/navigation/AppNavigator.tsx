import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Redux
import { useAppSelector } from '../store';
import { selectIsAuthenticated } from '../store/slices/authSlice';

// Components
import LoadingScreen from '../components/LoadingScreen';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ServicesScreen from '../screens/services/ServicesScreen';
import ServiceDetailScreen from '../screens/services/ServiceDetailScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Types
import { RootStackParamList, MainTabParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab Navigator
const MainTabNavigator = () => {
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
              iconName = 'business';
              break;
            case 'Bookings':
              iconName = 'event';
              break;
            case 'Messages':
              iconName = 'message';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'AfroAsiaConnect',
        }}
      />
      <Tab.Screen 
        name="Services" 
        component={ServicesScreen}
        options={{
          title: 'Services',
        }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingsScreen}
        options={{
          title: 'Bookings',
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          title: 'Messages',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Auth Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'Welcome Back',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          title: 'Create Account',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const [isRehydrated, setIsRehydrated] = useState(false);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authState = useAppSelector((state) => state.auth);
  
  // Allow time for Redux Persist to rehydrate
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRehydrated(true);
      console.log('🔄 Redux Persist rehydration complete');
    }, 1000); // 1 second delay
    
    return () => clearTimeout(timer);
  }, []);
  
  console.log('🔍 AppNavigator - isRehydrated:', isRehydrated);
  console.log('🔍 AppNavigator - isAuthenticated:', isAuthenticated);
  console.log('🔍 AppNavigator - authState:', authState);
  
  // Show loading screen while rehydrating
  if (!isRehydrated) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth screens
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Main app screens
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="ServiceDetail" 
              component={ServiceDetailScreen}
              options={{
                headerShown: true,
                title: 'Service Details',
                headerStyle: {
                  backgroundColor: '#3B82F6',
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen 
              name="BookingDetail" 
              component={BookingDetailScreen}
              options={{
                headerShown: true,
                title: 'Booking Details',
                headerStyle: {
                  backgroundColor: '#3B82F6',
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{
                headerShown: true,
                title: 'Chat',
                headerStyle: {
                  backgroundColor: '#3B82F6',
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
