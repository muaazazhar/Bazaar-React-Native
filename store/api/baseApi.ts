import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getApiBaseUrl } from '@/services/baseUrl';
import { performSessionLogout } from '@/store/authSession';
import type { AppDispatch, RootState } from '@/store/index';
import { getApiErrorMessage } from '@/utils/apiError';

const baseUrl = getApiBaseUrl();

const PUBLIC_AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/google/exchange',
  '/api/auth/forgot-password',
  '/api/auth/verify-reset-otp',
  '/api/auth/reset-password',
  '/api/auth/resend-reset-otp',
];

const SESSION_CHECK_PATHS = [...PUBLIC_AUTH_PATHS, '/api/auth/me'];

function getRequestUrl(args: string | FetchArgs): string {
  if (typeof args === 'string') {
    return args;
  }
  return typeof args.url === 'string' ? args.url : '';
}

function isPublicAuthRequest(url: string): boolean {
  return SESSION_CHECK_PATHS.some((path) => url.includes(path));
}

function shouldForceLogout(error: FetchBaseQueryError, hadToken: boolean, url: string): boolean {
  if (!hadToken || isPublicAuthRequest(url)) {
    return false;
  }

  if (error.status === 401) {
    return true;
  }

  if (error.status === 403) {
    const message = getApiErrorMessage(error, '').toLowerCase();
    return (
      message.includes('expired') ||
      message.includes('invalid token') ||
      message.includes('jwt') ||
      message.includes('unauthorized')
    );
  }

  const data = error.data;
  if (data && typeof data === 'object' && 'code' in data) {
    const code = String((data as Record<string, unknown>).code ?? '').toUpperCase();
    if (code === 'TOKEN_EXPIRED' || code === 'JWT_EXPIRED' || code === 'UNAUTHORIZED') {
      return true;
    }
  }

  return false;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAuthHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const state = api.getState() as RootState;
  const hadToken = Boolean(state.auth.token);
  const url = getRequestUrl(args);

  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && shouldForceLogout(result.error, hadToken, url)) {
    const stillHasToken = Boolean((api.getState() as RootState).auth.token);
    if (stillHasToken) {
      await performSessionLogout(api.dispatch as AppDispatch);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: ['Auth', 'Category', 'Product', 'Order', 'Receipt', 'StoreSettings'],
  endpoints: () => ({}),
});
