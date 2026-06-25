import { baseApi } from '@/store/api/baseApi';
import type { User } from '@/types/domain';
import { normalizeUser } from '@/utils/normalizeUser';

export type VerifyPasswordResponse = {
  valid: boolean;
};

export type ChangePasswordResponse = {
  message: string;
};

export type UpdateProfileBody = {
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<User, UpdateProfileBody>({
      query: (body) => ({
        url: '/api/users/me',
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: unknown) => normalizeUser(response),
      invalidatesTags: [{ type: 'Auth', id: 'ME' }],
    }),
    verifyPassword: builder.mutation<VerifyPasswordResponse, { password: string }>({
      query: (body) => ({
        url: '/api/users/me/verify-password',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => {
        const raw = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
        return { valid: raw.valid === true || raw.valid === 'true' };
      },
    }),
    changePassword: builder.mutation<
      ChangePasswordResponse,
      { currentPassword: string; newPassword: string; confirmPassword: string }
    >({
      query: (body) => ({
        url: '/api/users/me/change-password',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => {
        const raw = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
        return {
          message: String(raw.message ?? 'Password updated successfully.'),
        };
      },
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useVerifyPasswordMutation,
  useChangePasswordMutation,
} = usersApi;
