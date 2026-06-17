
import { setItem, getItem, removeItem } from './secureStorage';

const AUTH_STORAGE_KEY = 'store_auth_session';

export type StoredAuthSession = {
  token: string;
  user: {
    id: string;
    email: string;
    username?: string;
    phone?: string | null;
    role: 'admin' | 'user';
    isVerified?: boolean;
  };
};

export async function updateStoredAuthUser(user: StoredAuthSession['user']) {
  const session = await getStoredAuthSession();
  if (!session) return;
  await persistAuthSession({ ...session, user });
}

export async function persistAuthSession(session: StoredAuthSession) {
  try {
    await setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage issues so auth flow still works in-memory.
  }
}

export async function getStoredAuthSession(): Promise<StoredAuthSession | null> {
  let raw: string | null = null;
  try {
    raw = await getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    try {
      await removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore cleanup errors.
    }
    return null;
  }
}

export async function clearStoredAuthSession() {
  try {
    await removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage issues so logout still completes.
  }
}
