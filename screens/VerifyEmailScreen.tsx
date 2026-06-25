import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { useNotification } from '@/context/NotificationContext';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useResendVerificationMutation, useVerifyEmailMutation } from '@/store/api/authApi';
import { persistAuthSession, toStoredAuthUser } from '@/store/authStorage';
import { clearVerificationStorage, getPendingEmail } from '@/store/verificationStorage';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { getApiErrorDetails } from '@/utils/apiError';
import { notifyApiFailure, notifySuccess } from '@/utils/inAppNotify';
import { getResendCooldownSeconds, isResendCooldownError, parseResendParam } from '@/utils/authApiErrors';
import { routeAfterAuth } from '@/utils/authRouting';

export default function VerifyEmailScreen() {
  const { email: emailParam, resendIn: resendInParam } = useLocalSearchParams<{
    email?: string;
    resendIn?: string;
  }>();

  const dispatch = useAppDispatch();
  const [verifyEmail] = useVerifyEmailMutation();
  const [resendVerification] = useResendVerificationMutation();

  const [email, setEmail] = useState(
    typeof emailParam === 'string' ? emailParam.trim() : '',
  );
  const [code, setCode] = useState('');
  const { notify } = useNotification();
  const [error, setError] = useState('');

  const showApiError = (err: unknown, fallback: string, context: string) => {
    notifyApiFailure(notify, err, fallback, { title: 'Verification', context });
  };
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => parseResendParam(resendInParam));

  const backgroundColor = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  useEffect(() => {
    if (!email) {
      void getPendingEmail().then((stored) => {
        if (stored) setEmail(stored);
      });
    }
  }, [email]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (!email) {
      setError('Missing email. Go back and sign up or log in again.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const result = await resendVerification({ email }).unwrap();
      notifySuccess(notify, result.message || 'Verification code sent to your email.', {
        title: 'Verification',
      });
      setSecondsLeft(result.resendAvailableInSeconds);
    } catch (err) {
      if (isResendCooldownError(err)) {
        setSecondsLeft(getResendCooldownSeconds(err));
        showApiError(err, 'Please wait before resending.', 'POST /api/auth/resend-verification');
      } else {
        showApiError(err, 'Could not resend verification code.', 'POST /api/auth/resend-verification');
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!email) {
      setError('Missing email. Go back and sign up or log in again.');
      return;
    }
    const entered = code.trim();
    if (entered.length !== FIELD_LIMITS.verificationCode) {
      setError(`Enter the ${FIELD_LIMITS.verificationCode}-digit code from your email.`);
      return;
    }

    setVerifying(true);
    setError('');
    try {
      const loginData = await verifyEmail({ email, code: entered }).unwrap();
      dispatch(
        setCredentials({
          user: loginData.user,
          token: loginData.access_token,
        }),
      );
      await persistAuthSession({
        user: toStoredAuthUser(loginData.user),
        token: loginData.access_token,
      });
      await clearVerificationStorage();
      routeAfterAuth(loginData.user);
    } catch (err) {
      showApiError(err, 'Verification failed. Please try again.', 'POST /api/auth/verify-email');
    } finally {
      setVerifying(false);
    }
  };

  const resendDisabled = sending || secondsLeft > 0;
  const resendLabel = resendDisabled
    ? `Resend in ${secondsLeft}s`
    : sending
      ? 'Sending...'
      : 'Resend code';

  if (!email) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <ThemedView style={[styles.container, { backgroundColor }]}>
          <ScreenHeader title="Verify Email" />
          <ThemedText style={{ color: danger }}>No email provided.</ThemedText>
          <ThemedButton variant="primary" label="Back to Login" onPress={() => router.replace('/login')} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}>
          <Pressable style={styles.scrollContent} onPress={Keyboard.dismiss} accessible={false}>
          <ThemedView style={[styles.container, { backgroundColor }]}>
            <ScreenHeader title="Verify Email" showBack={false} />
            <ThemedText style={[styles.helperText, { color: muted }]}>
              Enter the {FIELD_LIMITS.verificationCode}-digit code sent to {email}.
            </ThemedText>

            <ValidatingTextInput
              label="Verification code"
              placeholder="000000"
              value={code}
              onChangeText={(text) => {
                setCode(text.replace(/[^0-9]/g, '').slice(0, FIELD_LIMITS.verificationCode));
                if (error) {
                  setError('');
                }
              }}
              maxLength={FIELD_LIMITS.verificationCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />

            <ApiErrorBanner title="Verification" message={error || null} />

            <ThemedButton
              variant="primary"
              label="Verify & Login"
              loading={verifying}
              disabled={code.length !== FIELD_LIMITS.verificationCode}
              onPress={handleVerify}
            />

            <ThemedButton
              variant="secondary"
              label={resendLabel}
              loading={sending}
              disabled={resendDisabled}
              onPress={handleResend}
            />

            <Pressable onPress={() => router.replace('/login')}>
              <ThemedText type="link">Back to login</ThemedText>
            </Pressable>
          </ThemedView>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  helperText: {
    lineHeight: 20,
  },
});
