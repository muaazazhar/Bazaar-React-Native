import { Stack } from 'expo-router';

import { AdminRoute } from '@/components/admin-route';

export default function AdminCategoriesLayout() {
  return (
    <AdminRoute>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="edit/[id]" />
      </Stack>
    </AdminRoute>
  );
}
