import { baseApi } from '@/store/api/baseApi';
import type { Category, Product } from '@/types/domain';
import { normalizeCategory, normalizeProduct } from '@/utils/catalogNormalize';
import { buildPagedUrl, PAGE_LIMITS, parsePaginatedPage, type PaginatedPage } from '@/utils/pagination';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategory: builder.query<Category, string>({
      query: (id) => `/api/categories/${id}`,
      transformResponse: (response: unknown) => normalizeCategory(response),
      providesTags: (_result, _error, id) => [{ type: 'Category', id }],
    }),
    getProduct: builder.query<Product, string>({
      query: (id) => `/api/products/${id}`,
      transformResponse: (response: unknown) => normalizeProduct(response),
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
    createCategory: builder.mutation<Category, FormData | { name: string }>({
      query: (body) => ({
        url: '/api/categories',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => normalizeCategory(response),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    updateCategory: builder.mutation<Category, { id: string; body: FormData | { name: string } }>({
      query: ({ id, body }) => ({
        url: `/api/categories/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: unknown) => normalizeCategory(response),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: arg.id },
      ],
    }),
    deleteCategory: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/api/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: arg.id },
      ],
    }),
    createProduct: builder.mutation<Product, FormData>({
      query: (body) => ({
        url: '/api/products',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => normalizeProduct(response),
      invalidatesTags: [
        { type: 'Product', id: 'LIST' },
        { type: 'Product', id: 'POPULAR' },
      ],
    }),
    updateProduct: builder.mutation<Product, { id: string; body: FormData | { name?: string; price?: number; categoryId?: number } }>({
      query: ({ id, body }) => ({
        url: `/api/products/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: unknown) => normalizeProduct(response),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Product', id: 'LIST' },
        { type: 'Product', id: 'POPULAR' },
        { type: 'Product', id: arg.id },
      ],
    }),
    deleteProduct: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/api/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Product', id: 'LIST' },
        { type: 'Product', id: 'POPULAR' },
        { type: 'Product', id: arg.id },
      ],
    }),
    getCategoryOptions: builder.query<Category[], void>({
      query: () => buildPagedUrl('/api/categories', 1, PAGE_LIMITS.categories),
      transformResponse: (response) =>
        parsePaginatedPage(response, normalizeCategory, 1, PAGE_LIMITS.categories).items,
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    getCategoryPages: builder.infiniteQuery<PaginatedPage<Category>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
      },
      query: ({ pageParam }) =>
        buildPagedUrl('/api/categories', pageParam, PAGE_LIMITS.categories),
      transformResponse: (response, _meta, arg) =>
        parsePaginatedPage(response, normalizeCategory, arg.pageParam, PAGE_LIMITS.categories),
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    getPopularProductPages: builder.infiniteQuery<PaginatedPage<Product>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
      },
      query: ({ pageParam }) =>
        buildPagedUrl('/api/products/popular', pageParam, PAGE_LIMITS.popularProducts),
      transformResponse: (response, _meta, arg) =>
        parsePaginatedPage(response, normalizeProduct, arg.pageParam, PAGE_LIMITS.popularProducts),
      providesTags: [{ type: 'Product', id: 'POPULAR' }],
    }),
    getCategoryProductPages: builder.infiniteQuery<
      PaginatedPage<Product>,
      { categoryId: string },
      number
    >({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
      },
      query: ({ queryArg, pageParam }) =>
        buildPagedUrl(
          `/api/categories/${queryArg.categoryId}/products`,
          pageParam,
          PAGE_LIMITS.products,
        ),
      transformResponse: (response, _meta, arg) =>
        parsePaginatedPage(response, normalizeProduct, arg.pageParam, PAGE_LIMITS.products),
      providesTags: (_result, _error, arg) => [
        { type: 'Product', id: 'LIST' },
        { type: 'Product', id: `CATEGORY-${arg.categoryId}` },
      ],
    }),
    getProductPages: builder.infiniteQuery<PaginatedPage<Product>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
      },
      query: ({ pageParam }) => buildPagedUrl('/api/products', pageParam, PAGE_LIMITS.products),
      transformResponse: (response, _meta, arg) =>
        parsePaginatedPage(response, normalizeProduct, arg.pageParam, PAGE_LIMITS.products),
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCategoryQuery,
  useGetProductQuery,
  useGetCategoryOptionsQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoryPagesInfiniteQuery,
  useGetPopularProductPagesInfiniteQuery,
  useGetCategoryProductPagesInfiniteQuery,
  useGetProductPagesInfiniteQuery,
} = catalogApi;
