import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider } from 'react-redux';

import { AuthBootstrap } from '@/components/auth-bootstrap';
import { CartProvider } from '@/context/CartContext';
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
          <RootNavigator />
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="admin-products" options={{ headerShown: false }} />
        <Stack.Screen name="admin-categories" options={{ headerShown: false }} />
        <Stack.Screen name="admin-orders" options={{ headerShown: false }} />
        <Stack.Screen name="admin-payment" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen name="receipt" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
