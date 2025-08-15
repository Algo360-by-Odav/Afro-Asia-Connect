/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, Alert } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';

// Redux Store
import { store, persistor } from './src/store';
import { setOnlineStatus, setDeviceInfo } from './src/store/slices/appSlice';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Components
import LoadingScreen from './src/components/LoadingScreen';

const App = () => {
  useEffect(() => {
    // Setup network listener
    const unsubscribe = NetInfo.addEventListener(state => {
      store.dispatch(setOnlineStatus(state.isConnected ?? false));
    });

    // Get device info
    const getDeviceInfo = async () => {
      try {
        const deviceInfo = {
          platform: DeviceInfo.getSystemName(),
          version: DeviceInfo.getSystemVersion(),
          deviceId: await DeviceInfo.getUniqueId(),
        };
        store.dispatch(setDeviceInfo(deviceInfo));
      } catch (error) {
        console.error('Error getting device info:', error);
      }
    };

    getDeviceInfo();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#3B82F6"
            translucent={false}
          />
          <AppNavigator />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
