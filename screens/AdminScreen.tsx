import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import {
  createCategoryApi,
  createProductApi,
  fulfillOrderApi,
  getAllOrdersApi,
  getCategoriesApi,
  getProductsApi,
  updateCategoryApi,
  updateProductApi,
} from '@/services/storeApi';
import type { Category, Order, Product } from '@/types/domain';

export default function AdminScreen() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cats, prods, ords] = await Promise.all([getCategoriesApi(), getProductsApi(), getAllOrdersApi()]);
      setCategories(cats);
      setProducts(prods);
      setOrders(ords);
    } catch {
      setError('Could not load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categoryMap = useMemo(() => new Map(categories.map((cat) => [cat.id, cat.name])), [categories]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }
    setBusy(true);
    try {
      await createCategoryApi({ name: newCategoryName.trim() });
      setNewCategoryName('');
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const handleEditCategory = async (category: Category) => {
    const nextName = `${category.name} (updated)`;
    setBusy(true);
    try {
      await updateCategoryApi(category.id, { name: nextName });
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim() || !newProductPrice.trim()) {
      return;
    }
    const price = Number(newProductPrice);
    if (Number.isNaN(price) || price <= 0) {
      return;
    }
    setBusy(true);
    try {
      await createProductApi({
        name: newProductName.trim(),
        price,
        categoryId: newProductCategoryId || undefined,
      });
      setNewProductName('');
      setNewProductPrice('');
      setNewProductCategoryId('');
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const handleEditProduct = async (product: Product) => {
    const nextCategoryId = categories.length ? categories[(categories.findIndex((c) => c.id === product.categoryId) + 1) % categories.length].id : null;
    setBusy(true);
    try {
      await updateProductApi(product.id, {
        name: `${product.name} (updated)`,
        categoryId: nextCategoryId,
      });
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const handleFulfillOrder = async (orderId: string) => {
    setBusy(true);
    try {
      await fulfillOrderApi(orderId);
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Admin Panel</ThemedText>
      <ThemedText>Logged in as: {user?.email}</ThemedText>
      <ThemedText>Role: {user?.role}</ThemedText>
      <Pressable style={styles.secondaryButton} onPress={loadData}>
        <ThemedText>Refresh Dashboard</ThemedText>
      </Pressable>
      {loading ? <ActivityIndicator /> : null}
      {!!error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <ThemedText type="subtitle">Categories</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="New category name"
        value={newCategoryName}
        onChangeText={setNewCategoryName}
      />
      <Pressable style={styles.button} onPress={handleCreateCategory} disabled={busy}>
        <ThemedText style={styles.buttonText}>Create Category</ThemedText>
      </Pressable>
      {categories.map((category) => (
        <ThemedView key={category.id} style={styles.card}>
          <ThemedText>{category.name}</ThemedText>
          <Pressable style={styles.secondaryButton} onPress={() => handleEditCategory(category)} disabled={busy}>
            <ThemedText>Rename</ThemedText>
          </Pressable>
        </ThemedView>
      ))}

      <ThemedText type="subtitle">Products</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Product name"
        value={newProductName}
        onChangeText={setNewProductName}
      />
      <TextInput
        style={styles.input}
        placeholder="Product price"
        keyboardType="numeric"
        value={newProductPrice}
        onChangeText={setNewProductPrice}
      />
      <TextInput
        style={styles.input}
        placeholder="Category ID (optional)"
        value={newProductCategoryId}
        onChangeText={setNewProductCategoryId}
      />
      <Pressable style={styles.button} onPress={handleCreateProduct} disabled={busy}>
        <ThemedText style={styles.buttonText}>Create Product</ThemedText>
      </Pressable>
      {products.map((product) => (
        <ThemedView key={product.id} style={styles.card}>
          <ThemedText type="defaultSemiBold">{product.name}</ThemedText>
          <ThemedText>Rs {product.price}</ThemedText>
          <ThemedText>Category: {product.category?.name ?? categoryMap.get(product.categoryId ?? '') ?? 'Uncategorized'}</ThemedText>
          <Pressable style={styles.secondaryButton} onPress={() => handleEditProduct(product)} disabled={busy}>
            <ThemedText>Edit Name/Category</ThemedText>
          </Pressable>
        </ThemedView>
      ))}

      <ThemedText type="subtitle">Orders</ThemedText>
      {orders.map((order) => (
        <ThemedView key={order.id} style={styles.card}>
          <ThemedText type="defaultSemiBold">Order #{order.id}</ThemedText>
          <ThemedText>Customer: {order.user?.email ?? order.userId ?? 'N/A'}</ThemedText>
          <ThemedText>Status: {order.status}</ThemedText>
          <ThemedText>Address: {order.address}</ThemedText>
          <ThemedText>Total: Rs {order.total}</ThemedText>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => handleFulfillOrder(order.id)}
            disabled={busy || order.status === 'fulfilled'}>
            <ThemedText>{order.status === 'fulfilled' ? 'Already Fulfilled' : 'Mark as Fulfilled'}</ThemedText>
          </Pressable>
        </ThemedView>
      ))}

      <Pressable style={styles.button} onPress={() => router.replace('/')}>
        <ThemedText style={styles.buttonText}>Go to Landing Route</ThemedText>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={logout}>
        <ThemedText>Logout</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    padding: 12,
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
