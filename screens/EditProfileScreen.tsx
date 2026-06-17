import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { useNotification } from '@/context/NotificationContext';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  FIELD_LIMITS,
  validatePhone,
  validatePhoneOptional,
  validateUsername,
} from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetMeQuery } from '@/store/api/authApi';
import { useUpdateProfileMutation } from '@/store/api/usersApi';
import { updateStoredAuthUser } from '@/store/authStorage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { getApiErrorDetails } from '@/utils/apiError';
import { notifySuccess } from '@/utils/inAppNotify';

type FieldErrors = {
  username?: string;
  phone?: string;
};

export default function EditProfileScreen() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, { skip: !token });
  const [updateProfile] = useUpdateProfileMutation();
  const { notify } = useNotification();

  const user = me ?? authUser;
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [hadPhoneOnLoad, setHadPhoneOnLoad] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  useEffect(() => {
    if (!user || initialized) return;
    setUsername(user.username ?? '');
    setPhone(user.phone ?? '');
    setHadPhoneOnLoad(Boolean(user.phone));
    setInitialized(true);
  }, [user, initialized]);

  const handleSave = async () => {
    const errors: FieldErrors = {};
    const usernameError = validateUsername(username);
    if (usernameError) errors.username = usernameError;

    const phoneError = hadPhoneOnLoad
      ? validatePhone(phone)
      : validatePhoneOptional(phone);
    if (phoneError) errors.phone = phoneError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: { username: string; phone?: string } = {
      username: username.trim(),
    };
    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      payload.phone = trimmedPhone;
    } else if (hadPhoneOnLoad) {
      setFieldErrors({ phone: 'Phone number is required.' });
      return;
    }

    setSaving(true);
    setError('');
    try {
      const updated = await updateProfile(payload).unwrap();
      dispatch(updateUser(updated));
      if (token) {
        await updateStoredAuthUser({
          id: updated.id,
          email: updated.email,
          username: updated.username,
          phone: updated.phone,
          role: updated.role,
          isVerified: updated.isVerified,
        });
      }
      notifySuccess(notify, 'Profile updated.', { title: 'Saved' });
      router.back();
    } catch (err) {
      const details = getApiErrorDetails(err, 'Could not update profile. Please try again.');
      setError(details.message);
    } finally {
      setSaving(false);
    }
  };

  if (!token || !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.container}>
          <ScreenHeader title="Edit Profile" />
          <ThemedText>Sign in to edit your profile.</ThemedText>
          <Pressable style={[styles.button, { backgroundColor: primary }]} onPress={() => router.replace('/login')}>
            <ThemedText style={{ color: primaryText }}>Go to login</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Edit Profile" />
        <ThemedText style={{ color: muted }}>
          Update your username and phone number. Email cannot be changed here.
        </ThemedText>

        {meLoading && !initialized ? <ActivityIndicator /> : null}

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ValidatingTextInput
            label="Email"
            value={user.email}
            onChangeText={() => undefined}
            maxLength={FIELD_LIMITS.email}
            editable={false}
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
        </ThemedView>

        <ApiErrorBanner title="Profile" message={error || null} />

        <Pressable
          style={[styles.button, { backgroundColor: primary }, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color={primaryText} />
          ) : (
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>Save changes</ThemedText>
          )}
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor }]}
          onPress={() => router.push('/change-password')}>
          <ThemedText type="defaultSemiBold">Change password</ThemedText>
        </Pressable>
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
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  button: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: { fontWeight: '700' },
  buttonDisabled: { opacity: 0.55 },
});
