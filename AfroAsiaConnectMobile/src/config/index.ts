// App Configuration
export const APP_CONFIG = {
  // API Configuration
  API_BASE_URL: __DEV__ 
    ? 'http://10.0.2.2:5000/api' // Android emulator
    : 'https://your-production-api.com/api',
  
  // App Information
  APP_NAME: 'AfroAsiaConnect',
  APP_VERSION: '1.0.0',
  
  // Features
  FEATURES: {
    BIOMETRIC_AUTH: true,
    PUSH_NOTIFICATIONS: true,
    OFFLINE_MODE: true,
    ANALYTICS: true,
    CRASH_REPORTING: true,
  },
  
  // Timeouts
  TIMEOUTS: {
    API_REQUEST: 10000, // 10 seconds
    IMAGE_UPLOAD: 30000, // 30 seconds
    FILE_UPLOAD: 60000, // 1 minute
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
  },
  
  // Cache
  CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100, // Maximum number of cached items
  },
  
  // Theme
  THEME: {
    PRIMARY_COLOR: '#3B82F6',
    SECONDARY_COLOR: '#10B981',
    ERROR_COLOR: '#EF4444',
    WARNING_COLOR: '#F59E0B',
    SUCCESS_COLOR: '#10B981',
    BACKGROUND_COLOR: '#F9FAFB',
    TEXT_COLOR: '#1F2937',
    BORDER_RADIUS: 12,
  },
  
  // Validation
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 128,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_FILE_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // Social Login
  SOCIAL_LOGIN: {
    GOOGLE_ENABLED: true,
    FACEBOOK_ENABLED: true,
    APPLE_ENABLED: true,
  },
  
  // Analytics
  ANALYTICS: {
    TRACK_SCREEN_VIEWS: true,
    TRACK_USER_ACTIONS: true,
    TRACK_ERRORS: true,
  },
};

// Environment-specific overrides
if (__DEV__) {
  // Development overrides
  APP_CONFIG.TIMEOUTS.API_REQUEST = 30000; // Longer timeout for development
  APP_CONFIG.ANALYTICS.TRACK_SCREEN_VIEWS = false; // Disable analytics in dev
}

export default APP_CONFIG;
