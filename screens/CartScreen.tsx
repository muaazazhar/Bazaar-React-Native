import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCart } from '@/context/CartContext';

export default function CartScreen() {
  const { cart, total, placeOrder, clearCart, removeFromCart } = useCart();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      setError('Please add a delivery address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await placeOrder(address);
      clearCart();
      router.push({ pathname: '/receipt', params: { total: String(total) } });
    } catch {
      setError('Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Cart</ThemedText>
      {cart.length === 0 ? (
        <ThemedText>Your cart is empty.</ThemedText>
      ) : (
        cart.map((item, idx) => (
          <ThemedView key={`${item.id}-${idx}`} style={styles.itemRow}>
            <ThemedView style={styles.itemInfo}>
              <ThemedText>{item.name}</ThemedText>
              <ThemedText>Rs {item.price}</ThemedText>
            </ThemedView>
            <Pressable style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
              <ThemedText style={styles.removeButtonText}>Remove</ThemedText>
            </Pressable>
          </ThemedView>
        ))
      )}

      <ThemedText type="subtitle">Total: Rs {total}</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Delivery address"
        value={address}
        onChangeText={setAddress}
      />
      {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Pressable style={styles.button} onPress={handlePlaceOrder} disabled={loading || cart.length === 0}>
        <ThemedText style={styles.buttonText}>{loading ? 'Placing Order...' : 'Place Order'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
  itemInfo: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
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
  error: {
    color: '#d32f2f',
  },
  removeButton: {
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#d32f2f',
    fontWeight: '700',
  },
});
