import { getApiBaseUrl } from '@/services/baseUrl';

const apiBaseUrl = getApiBaseUrl();

function normalizeImagePath(path: string): string {
  if (/^\/?(products|categories)\/.+\/image$/i.test(path)) {
    return path.startsWith('/') ? `/api${path}` : `/api/${path}`;
  }
  return path;
}

function bytesToBase64(bytes: number[]): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;

    output += chars[(triple >> 18) & 63];
    output += chars[(triple >> 12) & 63];
    output += i + 1 < bytes.length ? chars[(triple >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? chars[triple & 63] : '=';
  }
  return output;
}

function blobToDataUri(blob: unknown, mime: unknown): string | null {
  const mimeType = typeof mime === 'string' && mime.trim() ? mime.trim() : 'image/jpeg';

  if (typeof blob === 'string' && blob.trim()) {
    const value = blob.trim();
    if (value.startsWith('data:image/')) return value;
    return `data:${mimeType};base64,${value}`;
  }

  if (
    blob &&
    typeof blob === 'object' &&
    'type' in (blob as Record<string, unknown>) &&
    (blob as Record<string, unknown>).type === 'Buffer' &&
    Array.isArray((blob as Record<string, unknown>).data)
  ) {
    const bytes = (blob as { data: number[] }).data;
    if (!bytes.length) return null;
    return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
  }

  if (Array.isArray(blob) && blob.length > 0 && typeof blob[0] === 'number') {
    return `data:${mimeType};base64,${bytesToBase64(blob as number[])}`;
  }

  return null;
}

export function resolveEntityImageUrl(raw: Record<string, unknown>): string | null {
  const imageFromBlob = blobToDataUri(raw.imageBlob ?? raw.image_blob, raw.imageMime ?? raw.image_mime);
  const imageValue =
    imageFromBlob ??
    raw.imageUrl ??
    raw.image_url ??
    raw.image ??
    raw.imagePath ??
    raw.image_path ??
    null;
  return toAbsoluteImageUrl(imageValue);
}

export function toAbsoluteImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = normalizeImagePath(value.trim());
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const originMatch = apiBaseUrl.match(/^(https?:\/\/[^/]+)/);
  const origin = originMatch?.[1] ?? apiBaseUrl;
  return `${origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}
