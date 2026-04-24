import { api } from '@/services/api';
import type { AuthResponse, Category, Order, Product, User } from '@/types/domain';

type MaybeAuthResponse = AuthResponse | User;

function toAuthResponse(data: MaybeAuthResponse): AuthResponse {
  if ('user' in data) {
    return data;
  }
  return { user: data };
}

export async function loginApi(identifier: string, password: string): Promise<AuthResponse> {
  const trimmedIdentifier = identifier.trim();
  const isEmailLogin = trimmedIdentifier.includes('@');
  const res = await api.post<MaybeAuthResponse>('/auth/login', {
    identifier: trimmedIdentifier,
    email: isEmailLogin ? trimmedIdentifier : undefined,
    username: isEmailLogin ? undefined : trimmedIdentifier,
    password,
  });
  return toAuthResponse(res.data);
}

export async function registerApi(username: string, email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<MaybeAuthResponse>('/auth/register', {
    username: username.trim(),
    email: email.trim(),
    password,
  });
  return toAuthResponse(res.data);
}

export async function getProductsApi(): Promise<Product[]> {
  const res = await api.get<Product[]>('/products');
  return res.data;
}

export async function createProductApi(payload: {
  name: string;
  price: number;
  categoryId?: string;
}): Promise<Product> {
  const res = await api.post<Product>('/products', payload);
  return res.data;
}

export async function updateProductApi(
  productId: string,
  payload: {
    name?: string;
    price?: number;
    categoryId?: string | null;
  }
): Promise<Product> {
  const res = await api.patch<Product>(`/products/${productId}`, payload);
  return res.data;
}

export async function getCategoriesApi(): Promise<Category[]> {
  const res = await api.get<Category[]>('/categories');
  return res.data;
}

export async function createCategoryApi(payload: { name: string }): Promise<Category> {
  const res = await api.post<Category>('/categories', payload);
  return res.data;
}

export async function updateCategoryApi(categoryId: string, payload: { name: string }): Promise<Category> {
  const res = await api.patch<Category>(`/categories/${categoryId}`, payload);
  return res.data;
}

export async function createOrderApi(payload: { items: Array<{ productId: string; quantity: number }>; address: string }) {
  const res = await api.post<Order>('/orders', payload);
  return res.data;
}

export async function getMyOrdersApi(): Promise<Order[]> {
  try {
    const res = await api.get<Order[]>('/orders/my');
    return res.data;
  } catch {
    const fallback = await api.get<Order[]>('/orders');
    return fallback.data;
  }
}

export async function getAllOrdersApi(): Promise<Order[]> {
  const res = await api.get<Order[]>('/orders');
  return res.data;
}

export async function fulfillOrderApi(orderId: string): Promise<Order> {
  const res = await api.patch<Order>(`/orders/${orderId}`, { status: 'fulfilled' });
  return res.data;
}
