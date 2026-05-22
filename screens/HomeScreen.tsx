import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RemoteImage } from '@/components/remote-image';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCart } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetCategoriesQuery, useGetProductsQuery } from '@/store/api/catalogApi';
import { getApiErrorMessage } from '@/utils/apiError';

export default function HomeScreen() {
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const {
    data: products = [],
    isLoading: productsLoading,
    isFetching,
    isError: productsError,
    error: productsQueryError,
    refetch,
  } = useGetProductsQuery();
  const {
    data: categories = [],
    isError: categoriesError,
    error: categoriesQueryError,
  } = useGetCategoriesQuery();

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const catalogError =
    productsError || categoriesError
      ? getApiErrorMessage(
          productsQueryError ?? categoriesQueryError,
          'Could not load store catalog.',
        )
      : null;

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
          <Pressable onPress={refetch}>
            <ThemedText type="link">{isFetching ? 'Refreshing...' : 'Refresh'}</ThemedText>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {categories.map((category) => (
            <ThemedView key={category.id} style={[styles.categoryCard, { borderColor, backgroundColor: surface }]}>
              {category.imageUrl ? (
                <RemoteImage uri={category.imageUrl} style={styles.categoryImage} recyclingKey={`category-${category.id}`} />
              ) : null}
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            </ThemedView>
          ))}
        </ScrollView>

        <ThemedText type="subtitle">Popular products</ThemedText>
        {catalogError ? <ThemedText style={{ color: danger }}>{catalogError}</ThemedText> : null}
        {productsLoading ? <ActivityIndicator /> : null}
        {products.map((product) => {
          const cartItem = cart.find((item) => item.product.id === product.id);
          const basePrice = Number(product.price) || 0;
          const discount = Number(product.discountPercent ?? 0);
          const discountedPrice =
            Number.isFinite(discount) && discount > 0
              ? Math.round(basePrice * (1 - Math.min(discount, 100) / 100))
              : basePrice;
          return (
            <ThemedView key={String(product.id)} style={[styles.productCard, { borderColor, backgroundColor: surface }]}>
              <View style={styles.productRow}>
                {product.imageUrl ? (
                  <RemoteImage uri={product.imageUrl} style={styles.productImage} recyclingKey={`product-${product.id}`} />
                ) : null}
                <View style={styles.productInfo}>
                  <ThemedText type="defaultSemiBold">{product.name}</ThemedText>
                  <View style={styles.priceRow}>
                    <ThemedText>Rs {discountedPrice}</ThemedText>
                    {discount > 0 ? (
                      <ThemedText style={[styles.strikePrice, { color: muted }]}>Rs {basePrice}</ThemedText>
                    ) : null}
                  </View>
                  <ThemedText style={{ color: muted }}>{product.category?.name ?? 'General'}</ThemedText>
                </View>
              </View>
              {cartItem ? (
                <View style={styles.qtyRow}>
                  <Pressable style={[styles.qtyButton, { borderColor }]} onPress={() => decreaseQuantity(product.id)}>
                    <ThemedText>-</ThemedText>
                  </Pressable>
                  <ThemedText>{cartItem.quantity}</ThemedText>
                  <Pressable style={[styles.qtyButton, { borderColor }]} onPress={() => increaseQuantity(product.id)}>
                    <ThemedText>+</ThemedText>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={[styles.primaryButton, { backgroundColor: primary }]} onPress={() => addToCart(product)}>
                  <ThemedText style={[styles.primaryButtonText, { color: primaryText }]}>Add to cart</ThemedText>
                </Pressable>
              )}
            </ThemedView>
          );
        })}

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
  productCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  productRow: {
    flexDirection: 'row',
    gap: 10,
  },
  productImage: {
    width: 74,
    height: 74,
    borderRadius: 10,
  },
  productInfo: {
    flex: 1,
    gap: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strikePrice: {
    textDecorationLine: 'line-through',
    fontSize: 13,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
