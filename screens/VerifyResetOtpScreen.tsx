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
import { useResendResetOtpMutation, useVerifyResetOtpMutation } from '@/store/api/authApi';
import {
  getPasswordResetEmail,
  savePasswordResetSession,
} from '@/store/passwordResetStorage';
import { notifyApiFailure, notifySuccess } from '@/utils/inAppNotify';
import {
  getResendCooldownSeconds,
  isResendCooldownError,
  parseResendParam,
} from '@/utils/authApiErrors';

export default function VerifyResetOtpScreen() {
  const { email: emailParam, resendIn: resendInParam } = useLocalSearchParams<{
    email?: string;
    resendIn?: string;
  }>();

  const [verifyResetOtp] = useVerifyResetOtpMutation();
  const [resendResetOtp] = useResendResetOtpMutation();
  const { notify } = useNotification();

  const [email, setEmail] = useState(typeof emailParam === 'string' ? emailParam.trim() : '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => parseResendParam(resendInParam));

  const backgroundColor = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  useEffect(() => {
    if (!email) {
      void getPasswordResetEmail().then((stored) => {
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
      setError('Missing email. Go back and enter your email again.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const result = await resendResetOtp({ email }).unwrap();
      notifySuccess(notify, result.message || 'Reset code sent to your email.', {
        title: 'Reset password',
      });
      setSecondsLeft(result.resendAvailableInSeconds);
    } catch (err) {
      if (isResendCooldownError(err)) {
        setSecondsLeft(getResendCooldownSeconds(err));
        notifyApiFailure(notify, err, 'Please wait before resending.', {
          title: 'Reset password',
          context: 'POST /api/auth/resend-reset-otp',
        });
      } else {
        notifyApiFailure(notify, err, 'Could not resend reset code.', {
          title: 'Reset password',
          context: 'POST /api/auth/resend-reset-otp',
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!email) {
      setError('Missing email. Go back and enter your email again.');
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
      const result = await verifyResetOtp({ email, code: entered }).unwrap();
      if (!result.resetToken) {
        setError('Invalid server response. Please request a new code.');
        return;
      }
      await savePasswordResetSession(email, result.resetToken);
      router.replace('/reset-password');
    } catch (err) {
      notifyApiFailure(notify, err, 'Invalid or expired code. Please try again.', {
        title: 'Reset password',
        context: 'POST /api/auth/verify-reset-otp',
      });
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
          <ScreenHeader title="Verify Code" />
          <ThemedText style={{ color: danger }}>No email provided.</ThemedText>
          <ThemedButton variant="primary" label="Start over" onPress={() => router.replace('/forgot-password')} />
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
              <ScreenHeader title="Verify Code" showBack={false} />
              <ThemedText style={[styles.helperText, { color: muted }]}>
                Enter the {FIELD_LIMITS.verificationCode}-digit reset code sent to {email}.
              </ThemedText>

              <ValidatingTextInput
                label="Reset code"
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

              <ApiErrorBanner title="Reset password" message={error || null} />

              <ThemedButton
                variant="primary"
                label="Continue"
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

              <Pressable onPress={() => router.replace('/forgot-password')}>
                <ThemedText type="link">Use a different email</ThemedText>
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
  helperText: { lineHeight: 20 },
});
