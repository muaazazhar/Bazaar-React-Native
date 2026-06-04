import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useAppSelector } from '@/store/hooks';

export function AdminRoute({ children }: { children: ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  if (!hydrated) {
    return null;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return children;
}
