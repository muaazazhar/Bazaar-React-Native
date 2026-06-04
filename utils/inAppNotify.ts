import type { NotifyInput } from '@/context/NotificationContext';
import { getApiErrorDetails, isImageSizeError, logApiError } from '@/utils/apiError';

type NotifyFn = (input: NotifyInput) => void;

export function notifyError(
  notify: NotifyFn,
  message: string,
  options?: { title?: string; action?: NotifyInput['action']; durationMs?: number },
) {
  notify({
    title: options?.title ?? 'Error',
    message,
    variant: 'error',
    action: options?.action,
    durationMs: options?.durationMs,
  });
}

export function notifySuccess(
  notify: NotifyFn,
  message: string,
  options?: { title?: string; durationMs?: number },
) {
  notify({
    title: options?.title ?? 'Success',
    message,
    variant: 'success',
    durationMs: options?.durationMs,
  });
}

export function notifyApiFailure(
  notify: NotifyFn,
  err: unknown,
  fallback: string,
  options?: { title?: string; context?: string; action?: NotifyInput['action'] },
) {
  if (options?.context) {
    logApiError(options.context, err);
  }
  const details = getApiErrorDetails(err, fallback);
  notifyError(notify, details.message, { title: options?.title ?? 'Error', action: options?.action });
}

/** Admin mutations: toast failure and optionally surface image size errors on the form. */
export function notifyAdminApiFailure(
  notify: NotifyFn,
  err: unknown,
  fallback: string,
  options: { title: string; context: string; onImageSizeError?: (message: string) => void },
) {
  const details = getApiErrorDetails(err, fallback);
  notifyApiFailure(notify, err, fallback, { title: options.title, context: options.context });
  if (options.onImageSizeError && isImageSizeError(details.message)) {
    options.onImageSizeError(details.message);
  }
}
