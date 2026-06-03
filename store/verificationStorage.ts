import { getItem, removeItem, setItem } from '@/store/secureStorage';

const KEYS = {
  email: 'verification.pending.email',
  password: 'verification.pending.password',
} as const;

export async function savePendingEmail(email: string, password?: string) {
  await setItem(KEYS.email, email);
  if (password) {
    await setItem(KEYS.password, password);
  } else {
    await removeItem(KEYS.password);
  }
}

export async function getPendingEmail(): Promise<string | null> {
  return getItem(KEYS.email);
}

export async function clearVerificationStorage() {
  await Promise.all([removeItem(KEYS.email), removeItem(KEYS.password)]);
}
