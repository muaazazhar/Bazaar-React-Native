import { useEffect, useRef } from 'react';

import { useNotification } from '@/context/NotificationContext';
import { store } from '@/store';
import { isSessionLogoutInProgress } from '@/store/authSession';

type ApiErrorBannerProps = {
  message?: string | null;
  /** @deprecated Not shown in UI; use logApiError in dev instead. */
  debugDetails?: string | null;
  title?: string;
  /** When false, no toast is shown (e.g. after sign-out). Default true. */
  enabled?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
};

/**
 * Shows a top toast (same as Admin Orders) when `message` is set. Renders nothing inline.
 */
export function ApiErrorBanner({
  message,
  title = 'Error',
  enabled = true,
  onRetry,
  onDismiss,
  retryLabel = 'Retry',
}: ApiErrorBannerProps) {
  const { notify } = useNotification();
  const lastSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const text = message?.trim() ?? '';
    if (!text || !enabled) {
      lastSignatureRef.current = null;
      return;
    }

    const token = store.getState().auth.token;
    if (!token || isSessionLogoutInProgress()) {
      return;
    }

    const signature = `${title}:${text}:${onRetry ? retryLabel : ''}`;
    if (lastSignatureRef.current === signature) {
      return;
    }
    lastSignatureRef.current = signature;

    notify({
      title,
      message: text,
      variant: 'error',
      action: onRetry
        ? {
            label: retryLabel,
            onPress: () => {
              onRetry();
              onDismiss?.();
            },
          }
        : undefined,
    });
  }, [message, title, enabled, notify, onRetry, onDismiss, retryLabel]);

  return null;
}
