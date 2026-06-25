import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider } from 'react-redux';

import { AuthBootstrap } from '@/components/auth-bootstrap';
import { AuthRouteTracker } from '@/components/auth-route-tracker';
import { CustomerScreenOverlays } from '@/components/customer-screen-overlays';
import { NotificationHost } from '@/components/notification-host';
import { NotificationLogoutSync } from '@/components/notification-logout-sync';
import { SessionBusyOverlay } from '@/components/session-busy-overlay';
import { OrderStatusWatcher } from '@/components/order-status-watcher';
import { CartProvider } from '@/context/CartContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ThemePreferenceProvider, useThemePreference } from '@/context/ThemePreferenceContext';
import { store } from '@/store';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthBootstrap />
      <CartProvider>
        <ThemePreferenceProvider>
          <NotificationProvider>
            <AuthRouteTracker />
            <OrderStatusWatcher />
            <NotificationLogoutSync />
            <RootNavigator />
            <CustomerScreenOverlays />
            <NotificationHost />
            <SessionBusyOverlay />
          </NotificationProvider>
        </ThemePreferenceProvider>
      </CartProvider>
    </Provider>
  );
}

function RootNavigator() {
  const { resolvedTheme } = useThemePreference();

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="verify-reset-otp" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
        <Stack.Screen name="custom-order" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="admin-products" options={{ headerShown: false }} />
        <Stack.Screen name="admin-categories" options={{ headerShown: false }} />
        <Stack.Screen name="admin-orders" options={{ headerShown: false }} />
        <Stack.Screen name="admin-store-settings" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen name="bank-transfer" options={{ headerShown: false }} />
        <Stack.Screen name="receipt" options={{ headerShown: false }} />
        <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
