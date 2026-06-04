import { Pressable, StyleSheet, View } from 'react-native';

import { RemoteImage } from '@/components/remote-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCart } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Product } from '@/types/domain';
import { getProductBasePrice, getProductDiscountedPrice } from '@/utils/cartPricing';

type Props = {
  products: Product[];
};

export function CatalogProductList({ products }: Props) {
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  if (products.length === 0) {
    return <ThemedText style={{ color: muted }}>No products in this category yet.</ThemedText>;
  }

  return (
    <View style={styles.list}>
      {products.map((product) => {
        const cartItem = cart.find((item) => item.product.id === product.id);
        const basePrice = getProductBasePrice(product);
        const discountedPrice = Math.round(getProductDiscountedPrice(product));
        const discount = Number(product.discountPercent ?? 0);

        return (
          <ThemedView
            key={String(product.id)}
            style={[styles.productCard, { borderColor, backgroundColor: surface }]}>
            <View style={styles.productRow}>
              {product.imageUrl ? (
                <RemoteImage
                  uri={product.imageUrl}
                  style={styles.productImage}
                  recyclingKey={`product-${product.id}`}
                />
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
                <Pressable
                  style={[styles.qtyButton, { borderColor }]}
                  onPress={() => decreaseQuantity(product.id)}>
                  <ThemedText>-</ThemedText>
                </Pressable>
                <ThemedText>{cartItem.quantity}</ThemedText>
                <Pressable
                  style={[styles.qtyButton, { borderColor }]}
                  onPress={() => increaseQuantity(product.id)}>
                  <ThemedText>+</ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.primaryButton, { backgroundColor: primary }]}
                onPress={() => addToCart(product)}>
                <ThemedText style={[styles.primaryButtonText, { color: primaryText }]}>Add to cart</ThemedText>
              </Pressable>
            )}
          </ThemedView>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
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
