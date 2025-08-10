import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';
import {
  User,
  Service,
  Booking,
  Message,
  Conversation,
  DashboardAnalytics,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  PaginatedResponse,
  ServiceFilters,
  BookingFilters,
  ServiceFormData,
  BookingFormData,
} from '../../types';

// Base API configuration
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://10.0.2.2:3001/api', // Android emulator localhost mapping
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Service', 'Booking', 'Message', 'Conversation', 'Analytics'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<ApiResponse<{ user: User; token: string }>, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<ApiResponse<{ user: User; token: string }>, RegisterData>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    refreshToken: builder.mutation<ApiResponse<{ token: string }>, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Service', 'Booking', 'Message', 'Conversation'],
    }),

    // User endpoints
    getProfile: builder.query<ApiResponse<User>, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<ApiResponse<User>, Partial<User>>({
      query: (userData) => ({
        url: '/users/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    getUserById: builder.query<ApiResponse<User>, string>({
      query: (userId) => `/users/${userId}`,
      providesTags: ['User'],
    }),

    // Service endpoints
    getServices: builder.query<PaginatedResponse<Service>, { page?: number; limit?: number; filters?: ServiceFilters }>({
      query: ({ page = 1, limit = 10, filters = {} }) => ({
        url: '/services',
        params: { page, limit, ...filters },
      }),
      providesTags: ['Service'],
    }),
    getServiceById: builder.query<ApiResponse<Service>, string>({
      query: (serviceId) => `/services/${serviceId}`,
      providesTags: ['Service'],
    }),
    createService: builder.mutation<ApiResponse<Service>, ServiceFormData>({
      query: (serviceData) => ({
        url: '/services',
        method: 'POST',
        body: serviceData,
      }),
      invalidatesTags: ['Service'],
    }),
    updateService: builder.mutation<ApiResponse<Service>, { id: string; data: Partial<ServiceFormData> }>({
      query: ({ id, data }) => ({
        url: `/services/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Service'],
    }),
    deleteService: builder.mutation<ApiResponse<void>, string>({
      query: (serviceId) => ({
        url: `/services/${serviceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Service'],
    }),
    getMyServices: builder.query<ApiResponse<Service[]>, void>({
      query: () => '/services/my-services',
      providesTags: ['Service'],
    }),

    // Booking endpoints
    getBookings: builder.query<PaginatedResponse<Booking>, { page?: number; limit?: number; filters?: BookingFilters }>({
      query: ({ page = 1, limit = 10, filters = {} }) => ({
        url: '/bookings',
        params: { page, limit, ...filters },
      }),
      providesTags: ['Booking'],
    }),
    getBookingById: builder.query<ApiResponse<Booking>, string>({
      query: (bookingId) => `/bookings/${bookingId}`,
      providesTags: ['Booking'],
    }),
    createBooking: builder.mutation<ApiResponse<Booking>, BookingFormData>({
      query: (bookingData) => ({
        url: '/bookings',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: ['Booking', 'Service'],
    }),
    updateBookingStatus: builder.mutation<ApiResponse<Booking>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/bookings/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation<ApiResponse<void>, string>({
      query: (bookingId) => ({
        url: `/bookings/${bookingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Booking'],
    }),
    checkAvailability: builder.query<ApiResponse<{ available: boolean; slots: string[] }>, { serviceId: string; date: string }>({
      query: ({ serviceId, date }) => `/bookings/availability/${serviceId}?date=${date}`,
    }),
    getRecentBookings: builder.query<ApiResponse<Booking[]>, { limit?: number }>({
      query: ({ limit = 5 }) => ({
        url: '/bookings',
        params: { limit, sort: 'createdAt', order: 'desc' },
      }),
      providesTags: ['Booking'],
    }),

    // Messaging endpoints
    getConversations: builder.query<ApiResponse<Conversation[]>, void>({
      query: () => '/messaging/conversations',
      providesTags: ['Conversation'],
    }),
    getConversationById: builder.query<ApiResponse<Conversation>, string>({
      query: (conversationId) => `/messaging/conversations/${conversationId}`,
      providesTags: ['Conversation'],
    }),
    getMessages: builder.query<PaginatedResponse<Message>, { conversationId: string; page?: number; limit?: number }>({
      query: ({ conversationId, page = 1, limit = 50 }) => ({
        url: `/messaging/conversations/${conversationId}/messages`,
        params: { page, limit },
      }),
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation<ApiResponse<Message>, { conversationId: string; content: string; messageType?: string }>({
      query: ({ conversationId, content, messageType = 'TEXT' }) => ({
        url: `/messaging/conversations/${conversationId}/messages`,
        method: 'POST',
        body: { content, messageType },
      }),
      invalidatesTags: ['Message', 'Conversation'],
    }),
    markAsRead: builder.mutation<ApiResponse<void>, { conversationId: string; messageId: string }>({
      query: ({ conversationId, messageId }) => ({
        url: `/messaging/conversations/${conversationId}/messages/${messageId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Message', 'Conversation'],
    }),
    createConversation: builder.mutation<ApiResponse<Conversation>, { participantId: string; title?: string }>({
      query: (data) => ({
        url: '/messaging/conversations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Conversation'],
    }),

    // Analytics endpoints
    getDashboardAnalytics: builder.query<ApiResponse<DashboardAnalytics>, { days?: number }>({
      query: ({ days = 30 }) => ({
        url: '/analytics/provider/dashboard',
        params: { days },
      }),
      providesTags: ['Analytics'],
    }),
    getBookingAnalytics: builder.query<ApiResponse<any>, { days?: number }>({
      query: ({ days = 30 }) => ({
        url: '/analytics/provider/bookings',
        params: { days },
      }),
      providesTags: ['Analytics'],
    }),
    getRevenueAnalytics: builder.query<ApiResponse<any>, { days?: number }>({
      query: ({ days = 30 }) => ({
        url: '/analytics/provider/revenue',
        params: { days },
      }),
      providesTags: ['Analytics'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,

  // User hooks
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetUserByIdQuery,

  // Service hooks
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetMyServicesQuery,

  // Booking hooks
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useUpdateBookingStatusMutation,
  useCancelBookingMutation,
  useCheckAvailabilityQuery,
  useGetRecentBookingsQuery,

  // Messaging hooks
  useGetConversationsQuery,
  useGetConversationByIdQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkAsReadMutation,
  useCreateConversationMutation,

  // Analytics hooks
  useGetDashboardAnalyticsQuery,
  useGetBookingAnalyticsQuery,
  useGetRevenueAnalyticsQuery,
} = api;
