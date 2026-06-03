import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ValidatingTextInput } from '@/components/validating-text-input';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useResendVerificationMutation, useVerifyEmailMutation } from '@/store/api/authApi';
import { persistAuthSession } from '@/store/authStorage';
import { clearVerificationStorage, getPendingEmail } from '@/store/verificationStorage';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { getApiErrorMessage } from '@/utils/apiError';
import { getResendCooldownSeconds, isResendCooldownError } from '@/utils/authApiErrors';
import { routeAfterAuth } from '@/utils/authRouting';

function parseResendParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.ceil(parsed);
}

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
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => parseResendParam(resendInParam));

  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
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
      setInfo(result.message || 'Verification code sent to your email.');
      setSecondsLeft(result.resendAvailableInSeconds);
    } catch (err) {
      if (isResendCooldownError(err)) {
        setSecondsLeft(getResendCooldownSeconds(err));
        setError(getApiErrorMessage(err, 'Please wait before resending.'));
      } else {
        setError(getApiErrorMessage(err, 'Could not resend verification code.'));
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
        user: loginData.user,
        token: loginData.access_token,
      });
      await clearVerificationStorage();
      routeAfterAuth(loginData.user);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verification failed. Please try again.'));
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
          <Pressable style={[styles.button, { backgroundColor: primary }]} onPress={() => router.replace('/login')}>
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>Back to Login</ThemedText>
          </Pressable>
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
          showsVerticalScrollIndicator={false}>
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
                if (error) setError('');
              }}
              maxLength={FIELD_LIMITS.verificationCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />

            {info ? <ThemedText style={{ color: muted }}>{info}</ThemedText> : null}
            {error ? <ThemedText style={{ color: danger }}>{error}</ThemedText> : null}

            <Pressable
              style={[
                styles.button,
                { backgroundColor: primary },
                (verifying || code.length !== FIELD_LIMITS.verificationCode) && styles.buttonDisabled,
              ]}
              onPress={handleVerify}
              disabled={verifying || code.length !== FIELD_LIMITS.verificationCode}>
              {verifying ? (
                <ActivityIndicator color={primaryText} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: primaryText }]}>Verify & Login</ThemedText>
              )}
            </Pressable>

            <Pressable
              style={[styles.secondaryButton, { borderColor }, resendDisabled && styles.buttonDisabled]}
              onPress={handleResend}
              disabled={resendDisabled}>
              {sending && secondsLeft === 0 ? (
                <ActivityIndicator color={muted} />
              ) : (
                <ThemedText style={secondsLeft > 0 ? { color: muted } : undefined}>{resendLabel}</ThemedText>
              )}
            </Pressable>

            <Pressable onPress={() => router.replace('/login')}>
              <ThemedText type="link">Back to login</ThemedText>
            </Pressable>
          </ThemedView>
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
  button: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
