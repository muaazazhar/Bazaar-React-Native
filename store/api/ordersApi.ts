import { baseApi } from '@/store/api/baseApi';
import type { Order, PaymentMethod, WalletProvider } from '@/types/domain';
import { normalizeOrder } from '@/utils/orderDisplay';
import { buildPagedUrl, PAGE_LIMITS, parsePaginatedPage, type PaginatedPage } from '@/utils/pagination';
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
    getMyOrdersPreview: builder.query<Order[], void>({
      query: () => buildPagedUrl('/api/orders/my', 1, PAGE_LIMITS.orders),
      transformResponse: (response) =>
        parsePaginatedPage(response, normalizeOrder, 1, PAGE_LIMITS.orders).items,
      providesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    getMyOrderPages: builder.infiniteQuery<PaginatedPage<Order>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
      },
      query: ({ pageParam }) => buildPagedUrl('/api/orders/my', pageParam, PAGE_LIMITS.orders),
      transformResponse: (response, _meta, arg) =>
        parsePaginatedPage(response, normalizeOrder, arg.pageParam, PAGE_LIMITS.orders),
      providesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    getAllOrderPages: builder.infiniteQuery<PaginatedPage<Order>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
      },
      query: ({ pageParam }) => buildPagedUrl('/api/orders', pageParam, PAGE_LIMITS.orders),
      transformResponse: (response, _meta, arg) =>
        parsePaginatedPage(response, normalizeOrder, arg.pageParam, PAGE_LIMITS.orders),
      providesTags: [{ type: 'Order', id: 'LIST' }],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useUpdateOrderStatusMutation,
  useGetReceiptQuery,
  useGetMyOrdersPreviewQuery,
  useGetMyOrderPagesInfiniteQuery,
  useGetAllOrderPagesInfiniteQuery,
} = ordersApi;
