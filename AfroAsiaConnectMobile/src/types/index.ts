// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'SERVICE_PROVIDER' | 'ADMIN';
  profileImage?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Service Types
export interface Service {
  id: string;
  serviceName: string;
  description: string;
  price: number;
  duration: number;
  location: string;
  serviceCategory: string;
  tags: string[];
  requirements?: string[];
  deliverables?: string[];
  userId: string;
  user: User;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Booking Types
export interface Booking {
  id: string;
  serviceId: string;
  service: Service;
  customerId?: string;
  customer?: User;
  providerId: string;
  provider: User;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

// Message Types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: User;
  conversationId: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  attachmentUrl?: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  lastMessageAt: string;
  unreadCount: number;
  title?: string;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface DashboardAnalytics {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  recentBookings: Booking[];
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  bookingsByStatus: Array<{
    status: BookingStatus;
    count: number;
  }>;
  // Customer-specific analytics
  activeServices?: number;
  totalSpent?: number;
  favoriteServices?: number;
  reviewsGiven?: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'SERVICE_PROVIDER';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  ServiceDetail: { serviceId: string };
  BookingDetail: { bookingId: string };
  Chat: { conversationId: string };
  Profile: { userId?: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Services: undefined;
  Bookings: undefined;
  Messages: undefined;
  Profile: undefined;
};

// Form Types
export interface ServiceFormData {
  serviceName: string;
  description: string;
  price: number;
  duration: number;
  location: string;
  serviceCategory: string;
  tags: string[];
  requirements?: string[];
  deliverables?: string[];
}

export interface BookingFormData {
  serviceId: string;
  bookingDate: string;
  startTime: string;
  specialRequests?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

// Filter Types
export interface ServiceFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  rating?: number;
  sortBy?: 'price' | 'rating' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
}

export interface BookingFilters {
  status?: BookingStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}
