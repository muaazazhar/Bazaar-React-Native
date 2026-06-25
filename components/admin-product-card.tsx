import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { RemoteImage } from '@/components/remote-image';
import { SurfaceCard } from '@/components/surface-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import type { Product } from '@/types/domain';

type AdminProductCardProps = {
  product: Product;
  categoryLabel: string;
  busy?: boolean;
  onDelete: (productId: string) => void;
};

export function AdminProductCard({ product, categoryLabel, busy, onDelete }: AdminProductCardProps) {
  return (
    <SurfaceCard>
      <ThemedText type="defaultSemiBold">{product.name}</ThemedText>
      <ThemedText>
        Rs {product.price}
        {Number(product.discountPercent ?? 0) > 0 ? `  (${product.discountPercent}% off)` : ''}
      </ThemedText>
      <ThemedText>Category: {categoryLabel}</ThemedText>
      {product.imageUrl ? (
        <RemoteImage uri={product.imageUrl} style={styles.preview} recyclingKey={`product-${product.id}`} />
      ) : null}
      <ThemedButton
        variant="secondary"
        label="Edit Product"
        onPress={() => router.push(`/admin-products/edit/${product.id}`)}
        disabled={busy}
      />
      <ThemedButton
        variant="danger"
        label="Delete Product"
        onPress={() => onDelete(String(product.id))}
        loading={busy}
        disabled={busy}
      />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: 108,
    height: 108,
    borderRadius: 12,
  },
});
