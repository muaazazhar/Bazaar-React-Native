import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

export const NETWORK_ERROR_MESSAGE =
  'Cannot reach backend. Check EXPO_PUBLIC_API_URL and server status.';

function messageFromData(data: unknown): string | null {
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const record = data as Record<string, unknown>;

  const message = record.message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }
  if (Array.isArray(message) && message.length > 0) {
    return message.map(String).join('\n');
  }

  const nestedMessage = record.error;
  if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
    return nestedMessage.trim();
  }

  const details = record.details;
  if (typeof details === 'string' && details.trim()) {
    return details.trim();
  }

  return null;
}

export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export function isNetworkError(error: unknown): boolean {
  return isFetchBaseQueryError(error) && error.status === 'FETCH_ERROR';
}

/**
 * Extracts a user-facing message from RTK Query / backend errors.
 * Prefers backend `message` (string or validation array), then `error`, then network fallback.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!error) {
    return fallback;
  }

  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (isFetchBaseQueryError(error)) {
    const fromData = messageFromData(error.data);
    if (fromData) {
      return fromData;
    }
    if (typeof error.status === 'number') {
      return `Request failed (${error.status}).`;
    }
  }

  if (typeof error === 'object' && 'data' in error) {
    const fromData = messageFromData((error as FetchBaseQueryError).data);
    if (fromData) {
      return fromData;
    }
  }

  if (typeof error === 'object' && 'message' in error) {
    const message = (error as SerializedError).message;
    if (typeof message === 'string' && message.trim() && !message.startsWith('Rejected')) {
      return message.trim();
    }
  }

  if (error instanceof Error && error.message.trim() && !error.message.startsWith('Rejected')) {
    return error.message.trim();
  }

  return fallback;
}

export function isImageSizeError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('image size') ||
    normalized.includes('file too large') ||
    normalized.includes('payload too large') ||
    normalized.includes('smaller than')
  );
}
