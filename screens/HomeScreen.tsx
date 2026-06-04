import { router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { CatalogProductList } from '@/components/catalog-product-list';
import { QueryLoadBody } from '@/components/query-load-body';
import { RemoteImage } from '@/components/remote-image';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useMergedQueryLoadState } from '@/hooks/use-query-load-state';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetCategoriesQuery, useGetPopularProductsQuery } from '@/store/api/catalogApi';

export default function HomeScreen() {
  const {
    data: popularProducts = [],
    isLoading: productsLoading,
    isFetching,
    isError: productsError,
    error: productsQueryError,
    refetch: refetchPopular,
  } = useGetPopularProductsQuery();
  const {
    data: categories = [],
    isError: categoriesError,
    error: categoriesQueryError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const { errorMessage, showSpinner } = useMergedQueryLoadState({
    queries: [
      { isError: productsError, error: productsQueryError },
      { isError: categoriesError, error: categoriesQueryError },
    ],
    fallback: 'Could not load store catalog.',
    isLoading: productsLoading,
  });

  const openCategory = useCallback(
    (categoryId: string, categoryName: string) => {
      router.push({
        pathname: '/category/[id]',
        params: { id: categoryId, name: categoryName },
      });
    },
    [],
  );

  const refetchAll = useCallback(() => {
    void refetchPopular();
    void refetchCategories();
  }, [refetchPopular, refetchCategories]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Bazaar" showBack={false} />

        <ThemedView style={[styles.bannerCard, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="defaultSemiBold">Smarter grocery shopping</ThemedText>
          <ThemedText style={{ color: muted }}>Fast delivery, easy cart, and practical checkout.</ThemedText>
        </ThemedView>

        <View style={styles.sectionRow}>
          <ThemedText type="subtitle">Categories</ThemedText>
          <Pressable onPress={refetchAll}>
            <ThemedText type="link">{isFetching ? 'Refreshing...' : 'Refresh'}</ThemedText>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
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
            </Pressable>
          ))}
        </ScrollView>

        <ThemedText type="subtitle">Popular products</ThemedText>
        <ApiErrorBanner
          title="Could not load store"
          message={errorMessage}
          onRetry={refetchAll}
        />
        <QueryLoadBody isLoading={showSpinner} hasError={Boolean(errorMessage)}>
          <CatalogProductList products={popularProducts} />
        </QueryLoadBody>

        <Pressable style={[styles.primaryButton, { backgroundColor: primary }]} onPress={() => router.push('/(tabs)/cart')}>
          <ThemedText style={[styles.primaryButtonText, { color: primaryText }]}>Go to cart</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
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
  primaryButton: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontWeight: '700',
  },
});
