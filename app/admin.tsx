import { Redirect } from 'expo-router';

import AdminScreen from '@/screens/AdminScreen';
import { useAppSelector } from '@/store/hooks';

export default function AdminRoute() {
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

  return <AdminScreen />;
}
