import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

export const NETWORK_ERROR_MESSAGE =
  'Cannot reach backend. Check EXPO_PUBLIC_API_URL and server status.';

export type ApiErrorDetails = {
  message: string;
  status?: number | string;
  code?: string;
  /** For dev console logging only — never shown in UI. */
  debugLine?: string;
};

/** Strips HTTP status codes from text shown to users. */
export function sanitizeUserFacingMessage(message: string, fallback: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return fallback;
  }
  if (/^request failed \(\d{3}\)\.?$/i.test(trimmed)) {
    return fallback;
  }
  const withoutHttp = trimmed
    .replace(/\s*\(HTTP\s*\d{3}\)\s*/gi, ' ')
    .replace(/\bHTTP\s*\d{3}\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return withoutHttp || fallback;
}

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

  const errors = record.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.map(String).join('\n');
  }
  if (errors && typeof errors === 'object') {
    const parts = Object.entries(errors as Record<string, unknown>).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((item) => `${field}: ${String(item)}`);
      }
      if (typeof value === 'string') {
        return [`${field}: ${value}`];
      }
      return [];
    });
    if (parts.length > 0) {
      return parts.join('\n');
    }
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

function errorCodeFromData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || !('code' in data)) {
    return undefined;
  }
  const code = (data as Record<string, unknown>).code;
  return code != null ? String(code) : undefined;
}

export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export function isNetworkError(error: unknown): boolean {
  return isFetchBaseQueryError(error) && error.status === 'FETCH_ERROR';
}

/**
 * Extracts a user-facing message from RTK Query / backend errors.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  return getApiErrorDetails(error, fallback).message;
}

/**
 * Structured error info for UI banners and dev debugging.
 */
export function getApiErrorDetails(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): ApiErrorDetails {
  if (!error) {
    return { message: fallback };
  }

  if (isNetworkError(error)) {
    return {
      message: NETWORK_ERROR_MESSAGE,
      status: 'FETCH_ERROR',
    };
  }

  if (isFetchBaseQueryError(error)) {
    const fromData = messageFromData(error.data);
    const code = errorCodeFromData(error.data);
    const status = error.status;
    const rawMessage = fromData ?? fallback;
    const message = sanitizeUserFacingMessage(rawMessage, fallback);

    const debugParts: string[] = [];
    if (__DEV__) {
      if (status != null) debugParts.push(`HTTP ${String(status)}`);
      if (code) debugParts.push(`code=${code}`);
    }

    return {
      message,
      status,
      code,
      debugLine: debugParts.length > 0 ? debugParts.join(' · ') : undefined,
    };
  }

  if (typeof error === 'object' && 'data' in error) {
    const fromData = messageFromData((error as FetchBaseQueryError).data);
    if (fromData) {
      return { message: sanitizeUserFacingMessage(fromData, fallback) };
    }
  }

  if (typeof error === 'object' && 'message' in error) {
    const message = (error as SerializedError).message;
    if (typeof message === 'string' && message.trim() && !message.startsWith('Rejected')) {
      return { message: sanitizeUserFacingMessage(message.trim(), fallback) };
    }
  }

  if (error instanceof Error && error.message.trim() && !error.message.startsWith('Rejected')) {
    return { message: sanitizeUserFacingMessage(error.message.trim(), fallback) };
  }

  return { message: fallback };
}

/** Logs full API error context in development builds. */
export function logApiError(context: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  const details = getApiErrorDetails(error, '');
  console.warn(`[API] ${context}`, {
    message: details.message,
    status: details.status,
    code: details.code,
    error,
  });
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
