import { baseApi } from '@/store/api/baseApi';
import type { Order, PaymentMethod, WalletProvider } from '@/types/domain';

type ReceiptItem = {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type Receipt = {
  receiptNumber: string;
  orderId: number;
  status: string;
  createdAt: string;
  deliveryAddress: string;
  items: ReceiptItem[];
  totalAmount: number;
  customer: {
    id: number;
    email: string;
  };
};

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    placeOrder: builder.mutation<Order, {
      address: string;
      items: Array<{ productId: number; quantity: number }>;
      paymentMethod: PaymentMethod;
      walletProvider?: WalletProvider;
      paymentReference?: string;
    }>({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    getMyOrders: builder.query<Order[], void>({
      query: () => '/orders/my',
      providesTags: (result) =>
        result
          ? [{ type: 'Order', id: 'LIST' }, ...result.map((order) => ({ type: 'Order' as const, id: String(order.id) }))]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    getAllOrders: builder.query<Order[], void>({
      query: () => '/orders',
      providesTags: (result) =>
        result
          ? [{ type: 'Order', id: 'LIST' }, ...result.map((order) => ({ type: 'Order' as const, id: String(order.id) }))]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: 'pending' | 'processing' | 'fulfilled' | 'cancelled' }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Order', id: 'LIST' },
        { type: 'Order', id: arg.id },
        { type: 'Receipt', id: arg.id },
      ],
    }),
    getReceipt: builder.query<Receipt, { id: string }>({
      query: ({ id }) => `/orders/${id}/receipt`,
      providesTags: (_result, _error, arg) => [{ type: 'Receipt', id: arg.id }],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useGetMyOrdersQuery,
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetReceiptQuery,
} = ordersApi;
