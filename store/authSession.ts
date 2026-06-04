import { router } from 'expo-router';

import { clearStoredAuthSession } from '@/store/authStorage';
import type { AppDispatch } from '@/store/index';
import { waitForPendingSessionTasks } from '@/store/pendingSessionTasks';
import { logout } from '@/store/slices/authSlice';
import { isAuthFlowScreen } from '@/utils/authRoute';

let sessionLogoutInProgress = false;
const logoutListeners = new Set<() => void>();

function emitLogoutState() {
  logoutListeners.forEach((listener) => listener());
}

export function subscribeSessionLogoutState(listener: () => void): () => void {
  logoutListeners.add(listener);
  return () => logoutListeners.delete(listener);
}

export function isSessionLogoutInProgress(): boolean {
  return sessionLogoutInProgress;
}

let sessionValidationInFlight: Promise<void> | null = null;

/** Validates JWT with GET /api/auth/me; logs out on failure. Dedupes concurrent calls. */
export function validateAuthSession(
  dispatch: AppDispatch,
  options?: { forceRefetch?: boolean },
): Promise<void> {
  if (sessionValidationInFlight) {
    return sessionValidationInFlight;
  }

  sessionValidationInFlight = (async () => {
    try {
      const { store } = await import('@/store/index');
      const { authApi } = await import('@/store/api/authApi');
      const { hydrated, token, user } = store.getState().auth;
      if (!hydrated || !token || !user) {
        return;
      }
      await store
        .dispatch(
          authApi.endpoints.getMe.initiate(undefined, {
            forceRefetch: options?.forceRefetch ?? false,
          }),
        )
        .unwrap();
    } catch {
      await performSessionLogout(dispatch);
    } finally {
      sessionValidationInFlight = null;
    }
  })();

  return sessionValidationInFlight;
}

/** Clears auth state, cache, and sends user to login. Waits for pending tasks (e.g. receipt) first. */
export async function performSessionLogout(dispatch: AppDispatch) {
  if (sessionLogoutInProgress) {
    return;
  }
  sessionLogoutInProgress = true;
  emitLogoutState();
  try {
    await waitForPendingSessionTasks();
    dispatch(logout());
    const { baseApi } = await import('@/store/api/baseApi');
    dispatch(baseApi.util.resetApiState());
    await clearStoredAuthSession();
    if (!isAuthFlowScreen()) {
      router.replace('/login');
    }
  } finally {
    sessionLogoutInProgress = false;
    emitLogoutState();
  }
}
