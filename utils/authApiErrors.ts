import { getApiErrorDetails, isFetchBaseQueryError } from '@/utils/apiError';

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

const GENERIC_AUTH_FAILURES = new Set([
  'unauthorized',
  'forbidden',
  'bad request',
  'request failed',
]);

/** User-facing login failure message from API 401/403 responses. */
export function getLoginErrorMessage(
  error: unknown,
  fallback = 'Incorrect email or password.',
): string {
  const details = getApiErrorDetails(error, fallback);
  const normalized = details.message.trim().toLowerCase();

  if (
    details.status === 401 ||
    details.status === 403 ||
    details.code === 'INVALID_CREDENTIALS' ||
    details.code === 'UNAUTHORIZED'
  ) {
    if (!normalized || GENERIC_AUTH_FAILURES.has(normalized)) {
      return fallback;
    }
  }

  return details.message;
}

export function parseResendParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.ceil(parsed);
}
