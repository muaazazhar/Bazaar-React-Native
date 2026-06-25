import type { ReactNode } from 'react';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type ListEmptyPlaceholderProps = {
  isLoading: boolean;
  isError: boolean;
  loadingSkeleton: ReactNode;
  emptyLabel: string;
};

export function ListEmptyPlaceholder({
  isLoading,
  isError,
  loadingSkeleton,
  emptyLabel,
}: ListEmptyPlaceholderProps) {
  const muted = useThemeColor({}, 'muted');

  if (isLoading) {
    return loadingSkeleton ?? null;
  }
  if (isError) {
    return null;
  }
  return <ThemedText style={{ color: muted }}>{emptyLabel}</ThemedText>;
}
