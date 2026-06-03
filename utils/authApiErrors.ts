import { isFetchBaseQueryError } from '@/utils/apiError';

export type ApiErrorBody = {
  statusCode?: number;
  message?: string;
  error?: string;
  code?: string;
  email?: string;
  resendAvailableInSeconds?: number;
};

export function getApiErrorData(error: unknown): ApiErrorBody | null {
  if (!isFetchBaseQueryError(error)) {
    return null;
  }
  const data = error.data;
  if (!data || typeof data !== 'object') {
    return null;
  }
  return data as ApiErrorBody;
}

export function isEmailNotVerifiedError(error: unknown): boolean {
  return getApiErrorData(error)?.code === 'EMAIL_NOT_VERIFIED';
}

export function isResendCooldownError(error: unknown): boolean {
  return getApiErrorData(error)?.code === 'RESEND_COOLDOWN';
}

export function getResendCooldownSeconds(error: unknown, fallback = 30): number {
  const seconds = getApiErrorData(error)?.resendAvailableInSeconds;
  if (typeof seconds === 'number' && seconds >= 0) {
    return Math.ceil(seconds);
  }
  return fallback;
}

export function getEmailFromApiError(error: unknown): string | null {
  const email = getApiErrorData(error)?.email;
  return typeof email === 'string' && email.trim() ? email.trim() : null;
}
