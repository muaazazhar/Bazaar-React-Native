import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import CartScreen from '@/screens/CartScreen';

export default function CartRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'admin') {
    return <Redirect href="/admin" />;
  }

  return <CartScreen />;
}
