import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = 'store_auth_session';

export type StoredAuthSession = {
  token: string;
  user: {
    id: string;
    email: string;
    username?: string;
    role: 'admin' | 'user';
  };
};

export async function persistAuthSession(session: StoredAuthSession) {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage issues so auth flow still works in-memory.
  }
}

export async function getStoredAuthSession(): Promise<StoredAuthSession | null> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
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
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore cleanup errors.
    }
    return null;
  }
}

export async function clearStoredAuthSession() {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage issues so logout still completes.
  }
}
