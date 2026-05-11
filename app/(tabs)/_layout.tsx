import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/ThemePreferenceContext';
import { useAppSelector } from '@/store/hooks';

export default function TabLayout() {
  const { resolvedTheme } = useThemePreference();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[resolvedTheme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          href: user?.role === 'admin' ? null : '/(tabs)/cart',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          href: null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet.clipboard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          href: user?.role === 'admin' ? null : '/(tabs)/wallet',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="wallet.pass.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          href: user?.role === 'admin' ? null : '/(tabs)/account',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
