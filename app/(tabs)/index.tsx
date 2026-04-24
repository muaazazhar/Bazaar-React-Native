import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import HomeScreen from '@/screens/HomeScreen';

export default function TabHomeRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'admin') {
    return <Redirect href="/admin" />;
  }

  return <HomeScreen />;
}
