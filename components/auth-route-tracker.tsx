import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import { setTrackedPathname } from '@/utils/authRoute';

export function AuthRouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    setTrackedPathname(pathname ?? '');
  }, [pathname]);

  return null;
}
