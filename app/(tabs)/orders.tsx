import { Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderListSkeleton } from '@/components/catalog-skeletons';
import { ScreenHeader } from '@/components/screen-header';
import OrdersScreen from '@/screens/OrdersScreen';
import { useAppSelector } from '@/store/hooks';

export default function OrdersRoute() {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScreenHeader title="My Orders" />
        <OrderListSkeleton count={3} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'admin') {
    return <Redirect href="/admin" />;
  }

  return <OrdersScreen />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
});
