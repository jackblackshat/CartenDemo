import './src/config/mapbox';
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { PhoneDataCollectorProvider } from './src/lib/PhoneDataCollectorProvider';
import { DarkModeProvider, useDarkMode } from './src/context/DarkModeContext';
import { NavigationProvider } from './src/context/NavigationContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const { isDark } = useDarkMode();
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <NavigationProvider>
          <RootNavigator />
        </NavigationProvider>
      </NavigationContainer>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PhoneDataCollectorProvider>
        <DarkModeProvider>
          <AppContent />
        </DarkModeProvider>
      </PhoneDataCollectorProvider>
    </GestureHandlerRootView>
  );
}
