import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { ProfileFormSkeleton } from '@/components/catalog-skeletons';
import { NameFieldsRow } from '@/components/name-fields-row';
import { useNotification } from '@/context/NotificationContext';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { ScreenHeader } from '@/components/screen-header';
import { SurfaceCard } from '@/components/surface-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import {
  FIELD_LIMITS,
  validatePersonName,
  validatePhone,
  validatePhoneOptional,
  validateUsername,
} from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetMeQuery } from '@/store/api/authApi';
import { useUpdateProfileMutation } from '@/store/api/usersApi';
import { toStoredAuthUser, updateStoredAuthUser } from '@/store/authStorage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { getApiErrorDetails } from '@/utils/apiError';
import { notifySuccessAfterNavigateBack } from '@/utils/inAppNotify';
import type { User } from '@/types/domain';

type FieldErrors = {
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

function populateFormFromUser(
  user: User,
  setters: {
    setUsername: (v: string) => void;
    setFirstName: (v: string) => void;
    setLastName: (v: string) => void;
    setPhone: (v: string) => void;
    setHadPhoneOnLoad: (v: boolean) => void;
  },
) {
  setters.setUsername(user.username ?? '');
  setters.setFirstName(user.firstName ?? '');
  setters.setLastName(user.lastName ?? '');
  setters.setPhone(user.phone ?? '');
  setters.setHadPhoneOnLoad(Boolean(user.phone));
}

function EditProfileLoading() {
  const muted = useThemeColor({}, 'muted');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Edit Profile" />
        <ThemedText style={{ color: muted }}>
          Update your name, username, and phone number. Email cannot be changed here.
        </ThemedText>
        <ProfileFormSkeleton />
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

export default function EditProfileScreen() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const authUser = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  const {
    data: me,
    isLoading,
    isFetching,
    isError: meIsError,
    error: meQueryError,
  } = useGetMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  const [updateProfile] = useUpdateProfileMutation();
  const { notify } = useNotification();

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [hadPhoneOnLoad, setHadPhoneOnLoad] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const muted = useThemeColor({}, 'muted');
  const queryPending = isLoading || isFetching;
  const profileSource = me ?? authUser;

  useEffect(() => {
    if (!hydrated || !token || formReady || queryPending || !profileSource) {
      return;
    }

    populateFormFromUser(profileSource, {
      setUsername,
      setFirstName,
      setLastName,
      setPhone,
      setHadPhoneOnLoad,
    });
    setFormReady(true);
  }, [hydrated, token, formReady, queryPending, profileSource]);

  const handleSave = async () => {
    const errors: FieldErrors = {};
    const usernameError = validateUsername(username);
    if (usernameError) errors.username = usernameError;

    const firstNameError = validatePersonName(firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    const lastNameError = validatePersonName(lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;

    const phoneError = hadPhoneOnLoad ? validatePhone(phone) : validatePhoneOptional(phone);
    if (phoneError) errors.phone = phoneError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    };

    if (!phone.trim() && hadPhoneOnLoad) {
      setFieldErrors({ phone: 'Phone number is required.' });
      return;
    }

    setSaving(true);
    setError('');
    try {
      const updated = await updateProfile(payload).unwrap();
      dispatch(updateUser(updated));
      if (token) {
        await updateStoredAuthUser(toStoredAuthUser(updated));
      }
      notifySuccessAfterNavigateBack(notify, 'Profile updated.', { title: 'Saved' });
    } catch (err) {
      const details = getApiErrorDetails(err, 'Could not update profile. Please try again.');
      setError(details.message);
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated || (Boolean(token) && (queryPending || !formReady))) {
    return <EditProfileLoading />;
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAwareScroll contentContainerStyle={styles.container}>
          <ScreenHeader title="Edit Profile" />
          <ThemedText>Sign in to edit your profile.</ThemedText>
          <ThemedButton variant="primary" label="Go to login" onPress={() => router.replace('/login')} />
        </KeyboardAwareScroll>
      </SafeAreaView>
    );
  }

  if (meIsError && !profileSource) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAwareScroll contentContainerStyle={styles.container}>
          <ScreenHeader title="Edit Profile" />
          <ApiErrorBanner
            title="Could not load profile"
            message={getApiErrorDetails(meQueryError, 'Could not load profile.').message}
          />
          <ThemedButton variant="secondary" label="Go back" onPress={() => router.back()} />
        </KeyboardAwareScroll>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Edit Profile" />
        <ThemedText style={{ color: muted }}>
          Update your name, username, and phone number. Email cannot be changed here.
        </ThemedText>

        <SurfaceCard>
          <ValidatingTextInput
            label="Email"
            value={profileSource?.email ?? ''}
            onChangeText={() => undefined}
            maxLength={FIELD_LIMITS.email}
            editable={false}
          />
          <NameFieldsRow
            firstName={firstName}
            lastName={lastName}
            onFirstNameChange={(text) => {
              setFirstName(text);
              if (fieldErrors.firstName) {
                setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
              }
            }}
            onLastNameChange={(text) => {
              setLastName(text);
              if (fieldErrors.lastName) {
                setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
              }
            }}
            firstNameError={fieldErrors.firstName}
            lastNameError={fieldErrors.lastName}
          />
          <ValidatingTextInput
            label="Username"
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
            maxLength={FIELD_LIMITS.username}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            error={fieldErrors.username}
          />
          <ValidatingTextInput
            label={hadPhoneOnLoad ? 'Phone number' : 'Phone number (optional)'}
            placeholder="e.g. 03001234567"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (fieldErrors.phone) {
                setFieldErrors((prev) => ({ ...prev, phone: undefined }));
              }
            }}
            maxLength={FIELD_LIMITS.phone}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            error={fieldErrors.phone}
          />
        </SurfaceCard>

        <ApiErrorBanner title="Profile" message={error || null} />

        <ThemedButton variant="primary" label="Save changes" loading={saving} onPress={handleSave} />

        <ThemedButton
          variant="secondary"
          label="Change password"
          onPress={() => router.push('/change-password')}
        />
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
