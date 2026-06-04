import { useEffect } from 'react';

import { getStoredAuthSession } from '@/store/authStorage';
import { validateAuthSession } from '@/store/authSession';
import { useAppDispatch } from '@/store/hooks';
import { hydrateAuth } from '@/store/slices/authSlice';

export function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const hydrate = async () => {
      const session = await getStoredAuthSession();
      if (!session?.token) {
        dispatch(hydrateAuth(null));
        return;
      }

      dispatch(hydrateAuth({ user: session.user, token: session.token }));
      await validateAuthSession(dispatch, { forceRefetch: true });
    };
    void hydrate();
  }, [dispatch]);

  return null;
}
