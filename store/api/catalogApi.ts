import { baseApi } from '@/store/api/baseApi';
import type { Category, Product } from '@/types/domain';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
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
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    updateCategory: builder.mutation<Category, { id: string; body: FormData | { name: string } }>({
      query: ({ id, body }) => ({
        url: `/categories/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: arg.id },
      ],
    }),
    deleteCategory: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: arg.id },
      ],
    }),
    getProducts: builder.query<Product[], void>({
      query: () => '/products',
      providesTags: (result) =>
        result
          ? [{ type: 'Product', id: 'LIST' }, ...result.map((product) => ({ type: 'Product' as const, id: String(product.id) }))]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    createProduct: builder.mutation<Product, FormData>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    updateProduct: builder.mutation<Product, { id: string; body: FormData | { name?: string; price?: number; categoryId?: number } }>({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Product', id: 'LIST' },
        { type: 'Product', id: arg.id },
      ],
    }),
    deleteProduct: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Product', id: 'LIST' },
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
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = catalogApi;
