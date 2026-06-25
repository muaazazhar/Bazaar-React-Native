import { baseApi } from '@/store/api/baseApi';
import type { Order, PaymentMethod, WalletProvider } from '@/types/domain';
import { normalizeOrder } from '@/utils/orderDisplay';
import { mapArrayResponse } from '@/utils/rtkResponse';
import { normalizeReceipt, type Receipt } from '@/utils/receipt';

export type { Receipt };

export type OrderStatus = 'pending' | 'processing' | 'fulfilled' | 'cancelled';

export type PlaceOrderJsonBody = {
  address: string;
  items: Array<{ productId: string | number; quantity: number }>;
  paymentMethod: PaymentMethod;
  walletProvider?: WalletProvider;
  paymentReference?: string;
};

export type PlaceCustomOrderBody = {
  address: string;
  customItems: string[];
  paymentMethod: 'cash_on_delivery';
};

export type PlaceOrderRequest =
  | { kind: 'json'; body: PlaceOrderJsonBody }
  | { kind: 'formData'; formData: FormData }
  | { kind: 'custom'; body: PlaceCustomOrderBody };

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    placeOrder: builder.mutation<Order, PlaceOrderRequest>({
      query: (request) => {
        if (request.kind === 'formData') {
          return {
            url: '/api/orders',
            method: 'POST',
            body: request.formData,
          };
        }
        if (request.kind === 'custom') {
          return {
            url: '/api/orders/custom',
            method: 'POST',
            body: request.body,
          };
        }
        return {
          url: '/api/orders',
          method: 'POST',
          body: request.body,
        };
      },
      transformResponse: (response: unknown) => normalizeOrder(response),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    getMyOrders: builder.query<Order[], void>({
      query: () => '/api/orders/my',
      transformResponse: (response: unknown) => mapArrayResponse(response, normalizeOrder),
      providesTags: (result) =>
        result
          ? [{ type: 'Order', id: 'LIST' }, ...result.map((order) => ({ type: 'Order' as const, id: String(order.id) }))]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    getAllOrders: builder.query<Order[], void>({
      query: () => '/api/orders',
      transformResponse: (response: unknown) => mapArrayResponse(response, normalizeOrder),
      providesTags: (result) =>
        result
          ? [{ type: 'Order', id: 'LIST' }, ...result.map((order) => ({ type: 'Order' as const, id: String(order.id) }))]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    updateOrderStatus: builder.mutation<
      Order,
      { id: string; status: OrderStatus; cancellationReason?: string }
    >({
      query: ({ id, status, cancellationReason }) => {
        const body: { status: OrderStatus; cancellationReason?: string } = { status };
        if (status === 'cancelled') {
          body.cancellationReason = (cancellationReason ?? '').trim();
        }
        return {
          url: `/api/orders/${id}`,
          method: 'PATCH',
          body,
        };
      },
      transformResponse: (response: unknown) => normalizeOrder(response),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Order', id: 'LIST' },
        { type: 'Order', id: arg.id },
        { type: 'Receipt', id: arg.id },
      ],
    }),
    getReceipt: builder.query<Receipt, { id: string }>({
      query: ({ id }) => `/api/orders/${id}/receipt`,
      transformResponse: (response: unknown) => normalizeReceipt(response),
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
