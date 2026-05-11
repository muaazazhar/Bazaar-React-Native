import { useLocalSearchParams } from 'expo-router';

import ReceiptScreen from '@/screens/ReceiptScreen';

export default function ReceiptRoute() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  return <ReceiptScreen orderId={orderId ?? ''} />;
}
