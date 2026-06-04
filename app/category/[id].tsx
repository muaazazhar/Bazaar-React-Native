import { Redirect, useLocalSearchParams } from 'expo-router';

import CategoryProductsScreen from '@/screens/CategoryProductsScreen';
import { useAppSelector } from '@/store/hooks';

export default function CategoryProductsRoute() {
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
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

  const categoryId = typeof id === 'string' ? id : '';
  const categoryName = typeof name === 'string' ? name : undefined;

  if (!categoryId) {
    return <Redirect href="/(tabs)" />;
  }

  return <CategoryProductsScreen categoryId={categoryId} categoryName={categoryName} />;
}
