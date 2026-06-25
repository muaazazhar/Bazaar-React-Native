import { useEffect } from 'react';

import { useNotification } from '@/context/NotificationContext';
import { subscribeSessionLogoutState, isSessionLogoutInProgress } from '@/store/authSession';

/** Clears queued toasts when sign-out starts so stale messages do not appear on login. */
export function NotificationLogoutSync() {
  const { clearAll } = useNotification();

  useEffect(() => {
    return subscribeSessionLogoutState(() => {
      if (isSessionLogoutInProgress()) {
        clearAll();
      }
    });
  }, [clearAll]);

  return null;
}
