import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { CatalogProductList } from '@/components/catalog-product-list';
import { QueryLoadBody } from '@/components/query-load-body';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useQueryLoadState } from '@/hooks/use-query-load-state';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetProductsByCategoryQuery } from '@/store/api/catalogApi';

type Props = {
  categoryId: string;
  categoryName?: string;
};

export default function CategoryProductsScreen({ categoryId, categoryName }: Props) {
  const {
    data: products = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetProductsByCategoryQuery({ categoryId }, { skip: !categoryId });

  const muted = useThemeColor({}, 'muted');
  const { errorMessage, showSpinner, showContent } = useQueryLoadState({
    isError,
    error,
    fallback: 'Could not load products for this category.',
    isLoading,
  });

  const title = categoryName?.trim() ? categoryName : 'Category';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={title} />
        <ThemedText style={{ color: muted }}>
          {isFetching && !isLoading ? 'Refreshing…' : 'All products in this category'}
        </ThemedText>
        <ApiErrorBanner
          title="Could not load products"
          message={errorMessage}
          onRetry={refetch}
        />
        <QueryLoadBody isLoading={showSpinner} hasError={Boolean(errorMessage)}>
          <CatalogProductList products={products} />
        </QueryLoadBody>
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
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
  },
});
