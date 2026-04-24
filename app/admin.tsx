import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import AdminScreen from '@/screens/AdminScreen';

export default function AdminRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return <AdminScreen />;
}
