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
  status: string;
  address: string;
  total: number;
  createdAt?: string;
  userId?: string;
  user?: Pick<User, 'id' | 'email'>;
  items: OrderItem[];
  paymentMethod?: PaymentMethod;
  walletProvider?: WalletProvider | null;
  paymentReference?: string | null;
};

export type PaymentSettings = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string | null;
  instructions?: string | null;
  easypaisaNumber?: string | null;
  jazzcashNumber?: string | null;
};
