import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import OrdersScreen from '@/screens/OrdersScreen';

export default function OrdersRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'admin') {
    return <Redirect href="/admin" />;
  }

  return <OrdersScreen />;
}
