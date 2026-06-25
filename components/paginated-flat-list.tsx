import type { ReactElement } from 'react';
import { FlatList, StyleSheet, type ListRenderItem, type StyleProp, type ViewStyle } from 'react-native';

import { ListLoadMoreFooter } from '@/components/list-load-more-footer';

const DEFAULT_END_REACHED_THRESHOLD = 0.35;

type PaginatedFlatListProps<T> = {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;
  ListHeaderComponent?: ReactElement | null;
  ListEmptyComponent?: ReactElement | null;
  ListFooterComponent?: ReactElement | null;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  loadMoreLabel?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled' | boolean;
  horizontal?: boolean;
  onEndReachedThreshold?: number;
};

export function PaginatedFlatList<T extends { id: string | number }>({
  data,
  renderItem,
  keyExtractor = (item) => String(item.id),
  ListHeaderComponent,
  ListEmptyComponent,
  ListFooterComponent,
  isFetchingNextPage,
  onLoadMore,
  loadMoreLabel,
  contentContainerStyle,
  keyboardShouldPersistTaps,
  horizontal,
  onEndReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
}: PaginatedFlatListProps<T>) {
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={
        ListFooterComponent ?? (
          <ListLoadMoreFooter visible={isFetchingNextPage} label={loadMoreLabel} />
        )
      }
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      horizontal={horizontal}
      onEndReached={onLoadMore}
      onEndReachedThreshold={onEndReachedThreshold}
    />
  );
}

export const paginatedListStyles = StyleSheet.create({
  contentWide: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
  },
  contentNarrow: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  contentDefault: {
    flexGrow: 1,
    padding: 16,
    gap: 10,
  },
});
