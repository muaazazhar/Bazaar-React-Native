import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ApiErrorBanner } from '@/components/api-feedback';
import { CategoryRowSkeleton, ProductListSkeleton } from '@/components/catalog-skeletons';
import { CatalogProductCard } from '@/components/catalog-product-list';
import { DebouncedPressable } from '@/components/debounced-pressable';
import { fabStackBottomPadding } from '@/components/floating-action-button';
import { ListEmptyPlaceholder } from '@/components/list-empty-placeholder';
import { ListLoadMoreFooter } from '@/components/list-load-more-footer';
import { PaginatedFlatList, paginatedListStyles } from '@/components/paginated-flat-list';
import { RemoteImage } from '@/components/remote-image';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePaginatedInfiniteList } from '@/hooks/use-paginated-infinite-list';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  useGetCategoryPagesInfiniteQuery,
  useGetPopularProductPagesInfiniteQuery,
} from '@/store/api/catalogApi';
import type { Product } from '@/types/domain';
import { getApiErrorDetails } from '@/utils/apiError';

export default function HomeScreen() {
  const popularQuery = useGetPopularProductPagesInfiniteQuery();
  const categoriesQuery = useGetCategoryPagesInfiniteQuery();

  const {
    items: popularProducts,
    isInitialLoading: popularLoading,
    loadMore: loadMoreProducts,
    isFetchingNextPage: fetchingMoreProducts,
  } = usePaginatedInfiniteList(popularQuery);

  const {
    items: categories,
    isInitialLoading: categoriesLoading,
    loadMore: loadMoreCategories,
    isFetchingNextPage: fetchingMoreCategories,
  } = usePaginatedInfiniteList(categoriesQuery);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const muted = useThemeColor({}, 'muted');

  const productsErrorMessage = popularQuery.isError
    ? getApiErrorDetails(popularQuery.error, 'Could not load popular products.').message
    : null;
  const categoriesErrorMessage = categoriesQuery.isError
    ? getApiErrorDetails(categoriesQuery.error, 'Could not load categories.').message
    : null;
  const errorMessage = productsErrorMessage ?? categoriesErrorMessage;

  const openCategory = useCallback((categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/category/[id]',
      params: { id: categoryId, name: categoryName },
    });
  }, []);

  const refetchAll = useCallback(() => {
    void popularQuery.refetch();
    void categoriesQuery.refetch();
  }, [categoriesQuery, popularQuery]);

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <ScreenHeader title="Bazaar" showBack={false} />

        <ThemedView style={[styles.bannerCard, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="defaultSemiBold">Smarter grocery shopping</ThemedText>
          <ThemedText style={{ color: muted }}>Fast delivery, easy cart, and practical checkout.</ThemedText>
        </ThemedView>

        <View style={styles.sectionRow}>
          <ThemedText type="subtitle">Categories</ThemedText>
          <DebouncedPressable onPress={refetchAll}>
            <ThemedText type="link">
              {popularQuery.isFetching || categoriesQuery.isFetching ? 'Refreshing...' : 'Refresh'}
            </ThemedText>
          </DebouncedPressable>
        </View>

        {categoriesLoading ? (
          <CategoryRowSkeleton />
        ) : (
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
            onEndReached={loadMoreCategories}
            onEndReachedThreshold={0.6}
            ListFooterComponent={
              <ListLoadMoreFooter visible={fetchingMoreCategories} label="Loading categories…" />
            }
            renderItem={({ item: category }) => (
              <DebouncedPressable
                onPress={() => openCategory(String(category.id), category.name)}
                style={({ pressed }) => [pressed && styles.pressed]}>
                <ThemedView style={[styles.categoryCard, { borderColor, backgroundColor: surface }]}>
                  {category.imageUrl ? (
                    <RemoteImage
                      uri={category.imageUrl}
                      style={styles.categoryImage}
                      recyclingKey={`category-${category.id}`}
                    />
                  ) : null}
                  <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                </ThemedView>
              </DebouncedPressable>
            )}
          />
        )}

        <ThemedText type="subtitle">Popular products</ThemedText>
        <ApiErrorBanner title="Could not load store" message={errorMessage} onRetry={refetchAll} />
      </View>
    ),
    [
      borderColor,
      categories,
      categoriesLoading,
      categoriesQuery.isFetching,
      errorMessage,
      fetchingMoreCategories,
      loadMoreCategories,
      muted,
      openCategory,
      popularQuery.isFetching,
      refetchAll,
      surface,
    ],
  );

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <CatalogProductCard product={item} />,
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PaginatedFlatList
        data={popularProducts}
        renderItem={renderProduct}
        ListHeaderComponent={listHeader}
        isFetchingNextPage={fetchingMoreProducts}
        onLoadMore={loadMoreProducts}
        contentContainerStyle={[paginatedListStyles.contentDefault, { paddingBottom: fabStackBottomPadding(2) }]}
        ListFooterComponent={
          <View style={styles.footerBlock}>
            <ListLoadMoreFooter visible={fetchingMoreProducts} />
            <ThemedButton
              variant="primary"
              label="Go to cart"
              onPress={() => router.push('/(tabs)/cart')}
              style={styles.cartButton}
            />
          </View>
        }
        ListEmptyComponent={
          <ListEmptyPlaceholder
            isLoading={popularLoading}
            isError={popularQuery.isError}
            loadingSkeleton={<ProductListSkeleton count={4} />}
            emptyLabel="No popular products right now."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBlock: {
    gap: 12,
    marginBottom: 4,
  },
  footerBlock: {
    gap: 12,
    marginTop: 4,
  },
  bannerCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesRow: {
    gap: 10,
    paddingRight: 10,
  },
  categoryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    width: 108,
    gap: 6,
  },
  categoryImage: {
    width: 92,
    height: 72,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 13,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  cartButton: {
    marginTop: 4,
  },
});
