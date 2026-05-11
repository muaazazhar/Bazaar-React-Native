import { baseApi } from '@/store/api/baseApi';
import type { User } from '@/types/domain';

type LoginResponse = {
  access_token: string;
  user: User;
};

type RegisterResponse = User;

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, { email: string; username: string; password: string }>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation<LoginResponse, { identifier: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    googleExchange: builder.mutation<
      LoginResponse,
      { code: string } | { id_token: string }
    >({
      query: (body) => ({
        url: '/auth/google/exchange',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useGoogleExchangeMutation } = authApi;
