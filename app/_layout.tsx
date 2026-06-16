import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { OrdersProvider } from '../context/OrdersContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { requestNotificationPermission } from '../services/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await requestNotificationPermission();
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        setReady(true);
        SplashScreen.hideAsync();
      }
    }
    init();

    const timeout = setTimeout(() => {
      setReady(true);
      SplashScreen.hideAsync();
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <OrdersProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="tabs" />
          <Stack.Screen name="new-order" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="order" />
        </Stack>
      </OrdersProvider>
    </ErrorBoundary>
  );
}
