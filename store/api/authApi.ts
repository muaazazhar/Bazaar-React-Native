import { baseApi } from '@/store/api/baseApi';
import type { User } from '@/types/domain';
import { normalizeUser } from '@/utils/normalizeUser';

export type LoginResponse = {
  access_token: string;
  user: User;
};

export type RegisterResponse = {
  requiresVerification: boolean;
  message: string;
  email: string;
  resendAvailableInSeconds: number;
  user: User;
};

export type ResendVerificationResponse = {
  message: string;
  email: string;
  resendAvailableInSeconds: number;
};

function toLoginResponse(response: unknown): LoginResponse {
  const raw = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
  return {
    access_token: String(raw.access_token ?? ''),
    user: normalizeUser(raw.user ?? raw),
  };
}

function toRegisterResponse(response: unknown): RegisterResponse {
  const raw = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
  return {
    requiresVerification: Boolean(raw.requiresVerification),
    message: String(raw.message ?? ''),
    email: String(raw.email ?? ''),
    resendAvailableInSeconds: Number(raw.resendAvailableInSeconds ?? 30),
    user: normalizeUser(raw.user ?? raw),
  };
}

function toResendResponse(response: unknown): ResendVerificationResponse {
  const raw = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
  return {
    message: String(raw.message ?? ''),
    email: String(raw.email ?? ''),
    resendAvailableInSeconds: Number(raw.resendAvailableInSeconds ?? 30),
  };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => '/api/auth/me',
      transformResponse: (response: unknown) => normalizeUser(response),
      providesTags: [{ type: 'Auth', id: 'ME' }],
    }),
    register: builder.mutation<RegisterResponse, { email: string; username: string; password: string }>({
      query: (body) => ({
        url: '/api/auth/register',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => toRegisterResponse(response),
    }),
    login: builder.mutation<LoginResponse, { identifier: string; password: string }>({
      query: (body) => ({
        url: '/api/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => toLoginResponse(response),
    }),
    verifyEmail: builder.mutation<LoginResponse, { email: string; code: string }>({
      query: (body) => ({
        url: '/api/auth/verify-email',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => toLoginResponse(response),
    }),
    resendVerification: builder.mutation<ResendVerificationResponse, { email: string }>({
      query: (body) => ({
        url: '/api/auth/resend-verification',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => toResendResponse(response),
    }),
    googleExchange: builder.mutation<
      LoginResponse,
      { code: string } | { id_token: string }
    >({
      query: (body) => ({
        url: '/api/auth/google/exchange',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => toLoginResponse(response),
    }),
  }),
});

export const {
  useGetMeQuery,
  useLazyGetMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useGoogleExchangeMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = authApi;
