import { useSyncExternalStore } from 'react';

import {
  isSessionLogoutInProgress,
  subscribeSessionLogoutState,
} from '@/store/authSession';
import {
  getPendingSessionTaskCount,
  isDrainingSessionTasks,
  subscribePendingSessionTasks,
} from '@/store/pendingSessionTasks';

function subscribeSessionBusy(listener: () => void) {
  const unsubPending = subscribePendingSessionTasks(listener);
  const unsubLogout = subscribeSessionLogoutState(listener);
  return () => {
    unsubPending();
    unsubLogout();
  };
}

function getSessionBusySnapshot(): boolean {
  return (
    getPendingSessionTaskCount() > 0 ||
    isDrainingSessionTasks() ||
    isSessionLogoutInProgress()
  );
}

export function useSessionBusy(): boolean {
  return useSyncExternalStore(subscribeSessionBusy, getSessionBusySnapshot, () => false);
}
