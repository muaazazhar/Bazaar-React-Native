import { baseApi } from '@/store/api/baseApi';
import type { StoreSettings } from '@/types/domain';
import { normalizeStoreSettings } from '@/utils/storeSettings';

/** Backend route is still `/api/payment-settings` until the API is renamed server-side. */
const STORE_SETTINGS_PATH = '/api/payment-settings';

export const storeSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Any logged-in user (customer or admin). */
    getStoreSettings: builder.query<StoreSettings | null, void>({
      query: () => STORE_SETTINGS_PATH,
      transformResponse: (response: unknown) => normalizeStoreSettings(response),
      providesTags: [{ type: 'StoreSettings', id: 'SINGLE' }],
    }),
    /** Admin only — update is restricted on the backend. */
    upsertStoreSettings: builder.mutation<StoreSettings, StoreSettings>({
      query: (body) => ({
        url: STORE_SETTINGS_PATH,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: unknown) => normalizeStoreSettings(response) as StoreSettings,
      invalidatesTags: [
        { type: 'StoreSettings', id: 'SINGLE' },
        { type: 'Product', id: 'POPULAR' },
      ],
    }),
  }),
});

export const { useGetStoreSettingsQuery, useUpsertStoreSettingsMutation } = storeSettingsApi;
