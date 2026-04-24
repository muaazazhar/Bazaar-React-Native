import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getProductsApi } from '@/services/storeApi';
import type { Product } from '@/types/domain';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getProductsApi();
      setProducts(data);
    } catch {
      setError('Could not load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Home</ThemedText>
      <ThemedText>Welcome, {user?.email}</ThemedText>
      <Pressable style={styles.secondaryButton} onPress={loadProducts}>
        <ThemedText>Refresh Products</ThemedText>
      </Pressable>

      {loading ? <ActivityIndicator /> : null}
      {!!error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      {products.map((product) => (
        <ThemedView key={product.id} style={styles.productCard}>
          <ThemedText type="defaultSemiBold">{product.name}</ThemedText>
          <ThemedText>Rs {product.price}</ThemedText>
          <ThemedText>Category: {product.category?.name ?? 'Uncategorized'}</ThemedText>
          <Pressable style={styles.button} onPress={() => addToCart(product)}>
            <ThemedText style={styles.buttonText}>Add to Cart</ThemedText>
          </Pressable>
        </ThemedView>
      ))}

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/(tabs)/cart')}>
        <ThemedText>Go to Cart</ThemedText>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => router.push('/(tabs)/orders')}>
        <ThemedText>My Orders</ThemedText>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={logout}>
        <ThemedText>Logout</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  productCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  error: {
    color: '#d32f2f',
  },
});
