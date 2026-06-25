import { Redirect } from 'expo-router';

import EditProfileScreen from '@/screens/EditProfileScreen';
import { useAppSelector } from '@/store/hooks';

export default function EditProfileRoute() {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  if (hydrated && !user) {
    return <Redirect href="/login" />;
  }

  return <EditProfileScreen />;
}
