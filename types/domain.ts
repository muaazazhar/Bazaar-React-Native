export type UserRole = 'admin' | 'user';

export type User = {
  id: string;
  username?: string;
  email: string;
  role: UserRole;
  isVerified?: boolean;
};

export type AuthResponse = {
  user: User;
  token?: string;
};

export type Category = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

export type Product = {
  id: string | number;
  name: string;
  price: number | string;
  discountPercent?: number | null;
  categoryId?: string | null;
  category?: Category | null;
  imageUrl?: string | null;
};

export type OrderItem = {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
};

export type PaymentMethod = 'credit_debit_card' | 'cash_on_delivery' | 'bank_transfer' | 'wallet';
export type WalletProvider = 'easypaisa' | 'jazzcash';

export type Order = {
  id: string | number;
  /** Customer-facing order number from the API (`orderNo` / `order_no`). Never show `id` in UI. */
  orderNo: string;
  status: string;
  address: string;
  total: number;
  subtotal?: number;
  deliveryCharge?: number;
  paymentScreenshotUrl?: string | null;
  createdAt?: string;
  userId?: string;
  user?: Pick<User, 'id' | 'email' | 'username'>;
  items: OrderItem[];
  paymentMethod?: PaymentMethod;
  walletProvider?: WalletProvider | null;
  paymentReference?: string | null;
  cancellationReason?: string | null;
};

export type PopularProductCriteria = 'most_ordered' | 'highest_discount' | 'newest' | 'featured';

/** Store-wide settings: payments, delivery, and home catalog display. */
export type StoreSettings = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string | null;
  instructions?: string | null;
  easypaisaNumber?: string | null;
  jazzcashNumber?: string | null;
  /** When true, delivery charge is zero and customers see a free-delivery message. */
  freeDeliveryEnabled: boolean;
  /** Fixed delivery fee (PKR) when `freeDeliveryEnabled` is false. */
  deliveryCharge: number;
  /** How many products appear on the customer home “Popular” section. */
  popularProductLimit: number;
  /** Rule the backend uses to rank popular products. */
  popularCriteria: PopularProductCriteria;
  /** When `popularCriteria` is `featured`, product ids in display order. */
  featuredProductIds: string[];
};
