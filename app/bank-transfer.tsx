import { useLocalSearchParams } from 'expo-router';
import { Redirect } from 'expo-router';

import BankTransferScreen from '@/screens/BankTransferScreen';
import { useAppSelector } from '@/store/hooks';

export default function BankTransferRoute() {
  const { orderId, orderNo, total } = useLocalSearchParams<{
    orderId?: string;
    orderNo?: string;
    total?: string;
  }>();
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  if (!hydrated) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role === 'admin') return <Redirect href="/admin" />;

  return <BankTransferScreen orderId={orderId} orderNo={orderNo} total={total} />;
}
