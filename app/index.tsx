import { Redirect } from 'expo-router';

import { useAppSelector } from '@/store/hooks';

export default function RootIndex() {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  if (!hydrated) {
    return null;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return user.role === 'admin' ? <Redirect href="/admin" /> : <Redirect href="/(tabs)" />;
}
