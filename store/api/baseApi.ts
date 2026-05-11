import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getApiBaseUrl } from '@/services/baseUrl';
import type { RootState } from '@/store/index';

const baseUrl = getApiBaseUrl();

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Category', 'Product', 'Order', 'Receipt', 'PaymentSettings'],
  endpoints: () => ({}),
});
