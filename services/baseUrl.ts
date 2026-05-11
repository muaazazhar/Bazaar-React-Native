import { Platform } from 'react-native';
import Constants from 'expo-constants';

const envBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, '');
}

function getExpoHostIp() {
  const expoHostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;

  if (!expoHostUri) {
    return null;
  }

  return expoHostUri.split(':')[0] ?? null;
}

function getDefaultBaseUrl() {
  const expoHostIp = getExpoHostIp();
  if (expoHostIp && Platform.OS !== 'web') {
    return `http://${expoHostIp}:3000`;
  }

  // Android emulator cannot reach host machine via localhost.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

export function getApiBaseUrl() {
  if (!envBaseUrl) {
    return getDefaultBaseUrl();
  }

  // On mobile devices localhost points to the device itself, not your backend machine.
  if (Platform.OS !== 'web' && envBaseUrl.includes('localhost')) {
    const expoHostIp = getExpoHostIp();
    if (expoHostIp) {
      return normalizeUrl(envBaseUrl.replace('localhost', expoHostIp));
    }
  }

  // Android emulator fallback when Expo host IP is unavailable.
  if (Platform.OS === 'android' && envBaseUrl.includes('localhost')) {
    return normalizeUrl(envBaseUrl.replace('localhost', '10.0.2.2'));
  }

  return normalizeUrl(envBaseUrl);
}
