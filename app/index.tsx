import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function RootIndex() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return user.role === 'admin' ? <Redirect href="/admin" /> : <Redirect href="/(tabs)" />;
}
