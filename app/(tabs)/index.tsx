import { Redirect } from 'expo-router';

import HomeScreen from '@/screens/HomeScreen';
import { useAppSelector } from '@/store/hooks';

export default function TabHomeRoute() {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  if (!hydrated) {
    return null;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'admin') {
    return <Redirect href="/admin" />;
  }

  return <HomeScreen />;
}
