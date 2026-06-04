import { baseApi } from '@/store/api/baseApi';
import type { Category, Product } from '@/types/domain';
import { normalizeCategory, normalizeProduct } from '@/utils/catalogNormalize';
import { mapArrayResponse } from '@/utils/rtkResponse';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => '/api/categories',
      transformResponse: (response: unknown) => mapArrayResponse(response, normalizeCategory),
      providesTags: (result) =>
        result
          ? [
              { type: 'Category', id: 'LIST' },
              ...result.map((category) => ({ type: 'Category' as const, id: String(category.id) })),
            ]
          : [{ type: 'Category', id: 'LIST' }],
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
    getProducts: builder.query<Product[], void>({
      query: () => '/api/products',
      transformResponse: (response: unknown) => mapArrayResponse(response, normalizeProduct),
      providesTags: (result) =>
        result
          ? [{ type: 'Product', id: 'LIST' }, ...result.map((product) => ({ type: 'Product' as const, id: String(product.id) }))]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getPopularProducts: builder.query<Product[], void>({
      query: () => '/api/products/popular',
      transformResponse: (response: unknown) => mapArrayResponse(response, normalizeProduct),
      providesTags: [{ type: 'Product', id: 'POPULAR' }],
    }),
    getProductsByCategory: builder.query<Product[], { categoryId: string }>({
      query: ({ categoryId }) => `/api/categories/${categoryId}/products`,
      transformResponse: (response: unknown) => mapArrayResponse(response, normalizeProduct),
      providesTags: (_result, _error, arg) => [
        { type: 'Product', id: 'LIST' },
        { type: 'Product', id: `CATEGORY-${arg.categoryId}` },
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
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProductsQuery,
  useGetPopularProductsQuery,
  useGetProductsByCategoryQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = catalogApi;
