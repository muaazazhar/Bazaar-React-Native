import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/types/domain";
import { getProductDiscountedPrice } from "@/utils/cartPricing";

type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string | number) => void;
  increaseQuantity: (productId: string | number) => void;
  decreaseQuantity: (productId: string | number) => void;
  clearCart: () => void;
  total: number;
  savings: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx !== -1) {
        // If product exists, increase quantity
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      // Else add new
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string | number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const increaseQuantity = (productId: string | number) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === productId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
      return updated;
    });
  };

  const decreaseQuantity = (productId: string | number) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === productId);
      if (idx === -1) return prev;
      const updated = [...prev];
      if (updated[idx].quantity > 1) {
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity - 1 };
        return updated;
      } else {
        // Remove item if quantity goes to 0
        return updated.filter((item, i) => i !== idx);
      }
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const { total, savings } = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const basePrice =
          typeof item.product.price === "string"
            ? Number(item.product.price)
            : item.product.price;
        const discounted = getProductDiscountedPrice(item.product);
        acc.total += discounted * item.quantity;
        acc.savings += Math.max(0, (basePrice - discounted) * item.quantity);
        return acc;
      },
      { total: 0, savings: 0 },
    );
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      total: Math.round(total),
      savings: Math.round(savings),
    }),
    [cart, total, savings],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
