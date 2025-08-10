// AfroAsiaConnect Mobile App - Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api'; // Development URL

// RTK Query API
export const afroAsiaApi = createApi({
  reducerPath: 'afroAsiaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers, { getState }) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Service', 'Booking', 'Message', 'Analytics'],
  endpoints: (builder) => ({
    // Authentication
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    // Services
    getServices: builder.query<Service[], void>({
      query: () => '/services',
      providesTags: ['Service'],
    }),
    getServiceById: builder.query<Service, string>({
      query: (id) => `/services/${id}`,
      providesTags: ['Service'],
    }),
    
    // Bookings
    getBookings: builder.query<Booking[], void>({
      query: () => '/bookings',
      providesTags: ['Booking'],
    }),
    createBooking: builder.mutation<Booking, CreateBookingRequest>({
      query: (bookingData) => ({
        url: '/bookings',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: ['Booking'],
    }),
    
    // Messages
    getConversations: builder.query<Conversation[], void>({
      query: () => '/messaging/conversations',
      providesTags: ['Message'],
    }),
    getMessages: builder.query<Message[], string>({
      query: (conversationId) => `/messaging/conversations/${conversationId}/messages`,
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation<Message, SendMessageRequest>({
      query: ({ conversationId, ...messageData }) => ({
        url: `/messaging/conversations/${conversationId}/messages`,
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: ['Message'],
    }),
    
    // Analytics (for providers)
    getAnalytics: builder.query<AnalyticsData, { days?: number }>({
      query: ({ days = 30 }) => `/analytics/provider/dashboard?days=${days}`,
      providesTags: ['Analytics'],
    }),
  }),
});

// Auth Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      AsyncStorage.setItem('authToken', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      AsyncStorage.removeItem('authToken');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

// App Slice (for general app state)
interface AppState {
  theme: 'light' | 'dark';
  notifications: {
    enabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
  location: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  };
}

const initialAppState: AppState = {
  theme: 'light',
  notifications: {
    enabled: true,
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
  },
  location: {
    latitude: null,
    longitude: null,
    address: null,
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState: initialAppState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<AppState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    setLocation: (state, action: PayloadAction<{ latitude: number; longitude: number; address?: string }>) => {
      state.location.latitude = action.payload.latitude;
      state.location.longitude = action.payload.longitude;
      if (action.payload.address) {
        state.location.address = action.payload.address;
      }
    },
  },
});

// Persist Configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'app'], // Only persist auth and app state
};

// Root Reducer
const rootReducer = {
  auth: persistReducer(persistConfig, authSlice.reducer),
  app: persistReducer(persistConfig, appSlice.reducer),
  [afroAsiaApi.reducerPath]: afroAsiaApi.reducer,
};

// Store Configuration
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(afroAsiaApi.middleware),
});

export const persistor = persistStore(store);

// Export actions
export const { setCredentials, logout, setLoading } = authSlice.actions;
export const { setTheme, updateNotificationSettings, setLocation } = appSlice.actions;

// Export API hooks
export const {
  useLoginMutation,
  useRegisterMutation,
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useGetBookingsQuery,
  useCreateBookingMutation,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetAnalyticsQuery,
} = afroAsiaApi;

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type Definitions
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SERVICE_PROVIDER' | 'CUSTOMER';
  avatar?: string;
  phone?: string;
}

export interface Service {
  id: number;
  serviceName: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  images: string[];
  provider: {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string;
    rating: number;
  };
}

export interface Booking {
  id: number;
  serviceId: number;
  customerId: number;
  providerId: number;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  service: Service;
  customer: User;
  provider: User;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  sender: User;
}

export interface Conversation {
  id: number;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
}

export interface AnalyticsData {
  overview: {
    totalBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    customerSatisfaction: number;
  };
  bookings: {
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    completionRate: number;
  };
  revenue: {
    totalRevenue: number;
    totalTransactions: number;
    averageBookingValue: number;
  };
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SERVICE_PROVIDER' | 'CUSTOMER';
  phone?: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface CreateBookingRequest {
  serviceId: number;
  date: string;
  time: string;
  notes?: string;
}

export interface SendMessageRequest {
  conversationId: number;
  content: string;
  type: 'text' | 'image' | 'file';
}
