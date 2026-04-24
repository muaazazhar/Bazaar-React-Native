import { useLocalSearchParams } from 'expo-router';

import ReceiptScreen from '@/screens/ReceiptScreen';

export default function ReceiptRoute() {
  const { total } = useLocalSearchParams<{ total?: string }>();

  return <ReceiptScreen total={total ?? '0'} />;
}
