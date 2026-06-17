import { getItem, removeItem, setItem } from '@/store/secureStorage';

const KEYS = {
  email: 'passwordReset.pending.email',
  resetToken: 'passwordReset.pending.token',
} as const;

export async function savePasswordResetSession(email: string, resetToken?: string) {
  await setItem(KEYS.email, email);
  if (resetToken) {
    await setItem(KEYS.resetToken, resetToken);
  } else {
    await removeItem(KEYS.resetToken);
  }
}

export async function getPasswordResetEmail(): Promise<string | null> {
  return getItem(KEYS.email);
}

export async function getPasswordResetToken(): Promise<string | null> {
  return getItem(KEYS.resetToken);
}

export async function clearPasswordResetStorage() {
  await Promise.all([removeItem(KEYS.email), removeItem(KEYS.resetToken)]);
}
