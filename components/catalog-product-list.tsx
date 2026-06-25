import { StyleSheet, View } from 'react-native';

import { DebouncedPressable } from '@/components/debounced-pressable';
import { RemoteImage } from '@/components/remote-image';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCart } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Product } from '@/types/domain';
import { getProductBasePrice, getProductDiscountedPrice } from '@/utils/cartPricing';

export function CatalogProductCard({ product }: { product: Product }) {
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const muted = useThemeColor({}, 'muted');

  const cartItem = cart.find((item) => item.product.id === product.id);
  const basePrice = getProductBasePrice(product);
  const discountedPrice = Math.round(getProductDiscountedPrice(product));
  const discount = Number(product.discountPercent ?? 0);

  return (
    <ThemedView style={[styles.productCard, { borderColor, backgroundColor: surface }]}>
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
          <DebouncedPressable
            style={[styles.qtyButton, { borderColor }]}
            onPress={() => decreaseQuantity(product.id)}>
            <ThemedText>-</ThemedText>
          </DebouncedPressable>
          <ThemedText>{cartItem.quantity}</ThemedText>
          <DebouncedPressable
            style={[styles.qtyButton, { borderColor }]}
            onPress={() => increaseQuantity(product.id)}>
            <ThemedText>+</ThemedText>
          </DebouncedPressable>
        </View>
      ) : (
        <ThemedButton variant="primary" label="Add to cart" onPress={() => addToCart(product)} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
});
