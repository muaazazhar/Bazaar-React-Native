export type UserRole = 'admin' | 'user';

export type User = {
  id: string;
  username?: string;
  email: string;
  role: UserRole;
};

export type AuthResponse = {
  user: User;
  token?: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  categoryId?: string | null;
  category?: Category | null;
};

export type OrderItem = {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  status: string;
  address: string;
  total: number;
  createdAt?: string;
  userId?: string;
  user?: Pick<User, 'id' | 'email'>;
  items: OrderItem[];
};
