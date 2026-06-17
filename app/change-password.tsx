import { Redirect } from 'expo-router';

import ChangePasswordScreen from '@/screens/ChangePasswordScreen';
import { useAppSelector } from '@/store/hooks';

export default function ChangePasswordRoute() {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  if (!hydrated) {
    return null;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <ChangePasswordScreen />;
}
