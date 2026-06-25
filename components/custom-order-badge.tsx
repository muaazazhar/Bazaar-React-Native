import { ThemedText } from '@/components/themed-text';
import { CUSTOM_ORDER_BADGE } from '@/utils/orderDisplay';

type CustomOrderBadgeProps = {
  color: string;
};

export function CustomOrderBadge({ color }: CustomOrderBadgeProps) {
  return <ThemedText style={{ color, fontSize: 13 }}>{CUSTOM_ORDER_BADGE}</ThemedText>;
}
