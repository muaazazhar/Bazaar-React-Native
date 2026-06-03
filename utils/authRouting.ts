import { router } from 'expo-router';

import type { User } from '@/types/domain';

export function routeAfterAuth(user: User) {
  if (user.role === 'admin') {
    router.replace('/admin');
    return;
  }
  router.replace('/(tabs)');
}
