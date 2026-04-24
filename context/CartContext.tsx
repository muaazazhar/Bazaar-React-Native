import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { createOrderApi } from '@/services/storeApi';
import type { Product } from '@/types/domain';

type CartContextType = {
  cart: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (address: string) => Promise<void>;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Product[]>([]);

  const addToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === productId);
      if (idx === -1) {
        return prev;
      }
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async (address: string) => {
    await createOrderApi({
      items: cart.map((item) => ({
        productId: item.id,
        quantity: 1,
      })),
      address,
    });
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      placeOrder,
      total,
    }),
    [cart, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
