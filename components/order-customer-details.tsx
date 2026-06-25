import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Order } from '@/types/domain';
import {
  formatOrderCustomerField,
  getOrderCustomerDetails,
} from '@/utils/orderDisplay';

type OrderCustomerDetailsProps = {
  order: Order;
};

function CustomerDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <ThemedText>
      {label}: {value}
    </ThemedText>
  );
}

export function OrderCustomerDetails({ order }: OrderCustomerDetailsProps) {
  const { firstName, lastName, displayName, phone, email } = getOrderCustomerDetails(order);

  return (
    <View style={styles.block}>
      <CustomerDetailRow label="Customer" value={displayName} />
      <CustomerDetailRow label="First name" value={formatOrderCustomerField(firstName)} />
      <CustomerDetailRow label="Last name" value={formatOrderCustomerField(lastName)} />
      <CustomerDetailRow label="Phone" value={formatOrderCustomerField(phone)} />
      <CustomerDetailRow label="Email" value={formatOrderCustomerField(email)} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 2,
  },
});
