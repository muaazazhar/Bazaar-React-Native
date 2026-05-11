import { useEffect } from 'react';

import { getStoredAuthSession } from '@/store/authStorage';
import { useAppDispatch } from '@/store/hooks';
import { hydrateAuth } from '@/store/slices/authSlice';

export function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const hydrate = async () => {
      const session = await getStoredAuthSession();
      if (session) {
        dispatch(hydrateAuth({ user: session.user, token: session.token }));
      } else {
        dispatch(hydrateAuth(null));
      }
    };
    void hydrate();
  }, [dispatch]);

  return null;
}
