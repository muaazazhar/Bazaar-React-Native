import { useLocalSearchParams } from 'expo-router';

import ReceiptScreen from '@/screens/ReceiptScreen';

export default function ReceiptRoute() {
  const { orderId, paymentMethod } = useLocalSearchParams<{
    orderId?: string;
    paymentMethod?: string;
  }>();

  return <ReceiptScreen orderId={orderId ?? ''} paymentMethod={paymentMethod} />;
}
