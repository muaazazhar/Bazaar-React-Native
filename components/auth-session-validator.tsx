import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { validateAuthSession } from '@/store/authSession';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/**
 * Re-validates JWT when customer tabs regain focus (bootstrap handles cold start).
 */
export function AuthSessionValidator() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  useFocusEffect(
    useCallback(() => {
      if (!hydrated || !token || !user) {
        return undefined;
      }
      void validateAuthSession(dispatch, { forceRefetch: true });
      return undefined;
    }, [dispatch, hydrated, token, user]),
  );

  return null;
}
