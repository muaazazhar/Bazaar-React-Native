import { ThemedLoader } from '@/components/themed-loader';

type ListLoadMoreFooterProps = {
  visible: boolean;
  label?: string;
};

export function ListLoadMoreFooter({ visible, label = 'Loading more…' }: ListLoadMoreFooterProps) {
  if (!visible) return null;
  return <ThemedLoader size="small" label={label} minHeight={72} />;
}
