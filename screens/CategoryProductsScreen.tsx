import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { ProductListSkeleton } from '@/components/catalog-skeletons';
import { CatalogProductCard } from '@/components/catalog-product-list';
import { ListEmptyPlaceholder } from '@/components/list-empty-placeholder';
import { PaginatedFlatList, paginatedListStyles } from '@/components/paginated-flat-list';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { usePaginatedInfiniteList } from '@/hooks/use-paginated-infinite-list';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetCategoryProductPagesInfiniteQuery } from '@/store/api/catalogApi';
import type { Product } from '@/types/domain';
import { getApiErrorDetails } from '@/utils/apiError';

type Props = {
  categoryId: string;
  categoryName?: string;
};

export default function CategoryProductsScreen({ categoryId, categoryName }: Props) {
  const query = useGetCategoryProductPagesInfiniteQuery({ categoryId }, { skip: !categoryId });
  const { items, isInitialLoading, loadMore, isFetchingNextPage } = usePaginatedInfiniteList(query);

  const muted = useThemeColor({}, 'muted');
  const errorMessage = query.isError
    ? getApiErrorDetails(query.error, 'Could not load products for this category.').message
    : null;
  const title = categoryName?.trim() ? categoryName : 'Category';

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <CatalogProductCard product={item} />,
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PaginatedFlatList
        data={items}
        renderItem={renderItem}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={loadMore}
        contentContainerStyle={paginatedListStyles.contentWide}
        ListHeaderComponent={
          <>
            <ScreenHeader title={title} />
            <ThemedText style={{ color: muted, marginBottom: 8 }}>
              {query.isFetching && !isInitialLoading ? 'Refreshing…' : 'All products in this category'}
            </ThemedText>
            <ApiErrorBanner
              title="Could not load products"
              message={errorMessage}
              onRetry={() => void query.refetch()}
            />
          </>
        }
        ListEmptyComponent={
          <ListEmptyPlaceholder
            isLoading={isInitialLoading}
            isError={query.isError}
            loadingSkeleton={<ProductListSkeleton count={5} />}
            emptyLabel="No products in this category yet."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});
