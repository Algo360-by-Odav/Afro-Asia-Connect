import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isOnline: boolean;
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  onboarding: {
    completed: boolean;
    currentStep: number;
  };
  lastSync: string | null;
  deviceInfo: {
    platform: string;
    version: string;
    deviceId: string;
  } | null;
}

const initialState: AppState = {
  isOnline: true,
  theme: 'light',
  language: 'en',
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
  },
  onboarding: {
    completed: false,
    currentStep: 0,
  },
  lastSync: null,
  deviceInfo: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    updateNotificationSettings: (
      state,
      action: PayloadAction<Partial<AppState['notifications']>>
    ) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    setOnboardingCompleted: (state) => {
      state.onboarding.completed = true;
    },
    setOnboardingStep: (state, action: PayloadAction<number>) => {
      state.onboarding.currentStep = action.payload;
    },
    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
    setDeviceInfo: (state, action: PayloadAction<AppState['deviceInfo']>) => {
      state.deviceInfo = action.payload;
    },
    resetApp: () => initialState,
  },
});

export const {
  setOnlineStatus,
  setTheme,
  setLanguage,
  updateNotificationSettings,
  setOnboardingCompleted,
  setOnboardingStep,
  setLastSync,
  setDeviceInfo,
  resetApp,
} = appSlice.actions;

export default appSlice.reducer;

// Selectors
export const selectApp = (state: { app: AppState }) => state.app;
export const selectIsOnline = (state: { app: AppState }) => state.app.isOnline;
export const selectTheme = (state: { app: AppState }) => state.app.theme;
export const selectLanguage = (state: { app: AppState }) => state.app.language;
export const selectNotifications = (state: { app: AppState }) => state.app.notifications;
export const selectOnboarding = (state: { app: AppState }) => state.app.onboarding;
export const selectLastSync = (state: { app: AppState }) => state.app.lastSync;
export const selectDeviceInfo = (state: { app: AppState }) => state.app.deviceInfo;
