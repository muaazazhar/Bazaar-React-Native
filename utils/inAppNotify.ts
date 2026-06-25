import type { NotifyInput } from '@/context/NotificationContext';
import { getApiErrorDetails, isImageSizeError, logApiError } from '@/utils/apiError';
import { router } from 'expo-router';

type NotifyFn = (input: NotifyInput) => void;

export const NOTIFICATION_AFTER_NAV_DELAY_MS = 150;

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

export function notifyInfo(
  notify: NotifyFn,
  message: string,
  options?: { title?: string; durationMs?: number },
) {
  notify({
    title: options?.title ?? 'Notice',
    message,
    variant: 'info',
    durationMs: options?.durationMs,
  });
}

/** Show a toast after navigation so it appears on the destination screen. */
export function notifyAfterNavigate(
  notify: NotifyFn,
  input: NotifyInput,
  navigate: () => void,
  delayMs = NOTIFICATION_AFTER_NAV_DELAY_MS,
) {
  navigate();
  setTimeout(() => notify(input), delayMs);
}

/** Show a toast after returning to the previous screen. */
export function notifyAfterNavigateBack(
  notify: NotifyFn,
  input: NotifyInput,
  delayMs = NOTIFICATION_AFTER_NAV_DELAY_MS,
) {
  notifyAfterNavigate(notify, input, () => router.back(), delayMs);
}

export function notifySuccessAfterNavigateBack(
  notify: NotifyFn,
  message: string,
  options?: { title?: string; delayMs?: number },
) {
  notifyAfterNavigateBack(
    notify,
    {
      title: options?.title ?? 'Success',
      message,
      variant: 'success',
    },
    options?.delayMs,
  );
}

export function notifySuccessAfterNavigate(
  notify: NotifyFn,
  message: string,
  navigate: () => void,
  options?: { title?: string; delayMs?: number },
) {
  notifyAfterNavigate(
    notify,
    {
      title: options?.title ?? 'Success',
      message,
      variant: 'success',
    },
    navigate,
    options?.delayMs,
  );
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
