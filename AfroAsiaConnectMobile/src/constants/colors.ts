// AfroAsiaConnect Mobile App Color Theme
// Aligned with web application design system

export const colors = {
  // Primary Colors (matching web app)
  primary: '#0A2342',        // Primary Blue - main brand color
  primaryLight: '#1A3A5C',   // Lighter shade of primary
  primaryDark: '#051A2E',    // Darker shade of primary
  
  // Secondary Colors
  accent: '#FFD700',         // Accent Gold - highlights and accents
  success: '#10B981',        // CTA Emerald - success states, CTAs
  warning: '#F59E0B',        // Warning orange
  error: '#EF4444',          // Error red
  info: '#3B82F6',           // Info blue
  
  // Background Colors
  background: '#FFFFFF',     // Main background
  backgroundSecondary: '#F3F4F6', // Light gray background
  backgroundTertiary: '#F9FAFB',  // Even lighter background
  surface: '#FFFFFF',        // Card/surface background
  surfaceSecondary: '#F8FAFC', // Secondary surface
  
  // Text Colors
  text: '#171717',           // Primary text (dark)
  textSecondary: '#6B7280',  // Secondary text (gray)
  textTertiary: '#9CA3AF',   // Tertiary text (light gray)
  textInverse: '#FFFFFF',    // White text for dark backgrounds
  textMuted: '#A1A1AA',      // Muted text
  
  // Border Colors
  border: '#E5E7EB',         // Default border
  borderLight: '#F3F4F6',    // Light border
  borderDark: '#D1D5DB',     // Darker border
  
  // Status Colors
  online: '#10B981',         // Online/active status
  offline: '#6B7280',        // Offline status
  pending: '#F59E0B',        // Pending status
  
  // Gradient Colors
  gradientStart: '#0A2342',  // Primary blue
  gradientEnd: '#1A3A5C',    // Lighter primary
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Component-specific Colors
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  input: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputFocus: '#0A2342',
  placeholder: '#9CA3AF',
  
  // Navigation Colors
  tabActive: '#0A2342',
  tabInactive: '#6B7280',
  tabBackground: '#FFFFFF',
  
  // Button Colors
  buttonPrimary: '#0A2342',
  buttonSecondary: '#F3F4F6',
  buttonSuccess: '#10B981',
  buttonWarning: '#F59E0B',
  buttonDanger: '#EF4444',
  
  // Icon Colors
  iconPrimary: '#0A2342',
  iconSecondary: '#6B7280',
  iconSuccess: '#10B981',
  iconWarning: '#F59E0B',
  iconDanger: '#EF4444',
};

// Theme variants
export const lightTheme = {
  ...colors,
  isDark: false,
};

export const darkTheme = {
  ...colors,
  // Dark theme overrides
  background: '#0A0A0A',
  backgroundSecondary: '#1F1F1F',
  backgroundTertiary: '#2A2A2A',
  surface: '#1A1A1A',
  surfaceSecondary: '#2A2A2A',
  text: '#EDEDED',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  border: '#374151',
  borderLight: '#4B5563',
  borderDark: '#6B7280',
  card: '#1A1A1A',
  cardBorder: '#374151',
  input: '#1A1A1A',
  inputBorder: '#4B5563',
  tabBackground: '#1A1A1A',
  isDark: true,
};

export default colors;
