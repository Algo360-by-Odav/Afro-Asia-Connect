// AfroAsiaConnect Mobile App - Navigation Structure
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screen Components (to be implemented)
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import ServiceDiscoveryScreen from './src/screens/services/ServiceDiscoveryScreen';
import BookingsScreen from './src/screens/bookings/BookingsScreen';
import MessagesScreen from './src/screens/messages/MessagesScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import AnalyticsScreen from './src/screens/analytics/AnalyticsScreen';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Messages: undefined;
  Profile: undefined;
  More: undefined;
};

// Stack Navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' }
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'dashboard' : 'dashboard';
              break;
            case 'Bookings':
              iconName = focused ? 'event' : 'event';
              break;
            case 'Messages':
              iconName = focused ? 'chat' : 'chat';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person';
              break;
            case 'More':
              iconName = focused ? 'more-horiz' : 'more-horiz';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <MainTab.Screen 
        name="Home" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <MainTab.Screen 
        name="Bookings" 
        component={BookingsScreen}
        options={{ title: 'My Bookings' }}
      />
      <MainTab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <MainTab.Screen 
        name="More" 
        component={AnalyticsScreen}
        options={{ title: 'More' }}
      />
    </MainTab.Navigator>
  );
}

// Root App Navigator
export default function AppNavigator() {
  const isAuthenticated = false; // This will come from Redux store

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
