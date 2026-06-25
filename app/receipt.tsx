import { useLocalSearchParams } from 'expo-router';

import ReceiptScreen from '@/screens/ReceiptScreen';

export default function ReceiptRoute() {
  const { orderId, paymentMethod, orderType } = useLocalSearchParams<{
    orderId?: string;
    paymentMethod?: string;
    orderType?: string;
  }>();

  return (
    <ReceiptScreen
      orderId={orderId ?? ''}
      paymentMethod={paymentMethod}
      orderType={orderType}
    />
  );
}
