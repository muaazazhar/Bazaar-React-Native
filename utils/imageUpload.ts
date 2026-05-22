import type { ImagePickerAsset } from 'expo-image-picker';

/** Matches common backend limit (10MB). Backend message is shown if upload still fails. */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export const MAX_IMAGE_SIZE_LABEL = '10MB';

export function getImagePart(uri: string) {
  const fileName = uri.split('/').pop() ?? 'upload.jpg';
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mime = ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'image/jpeg';
  return { uri, name: fileName, type: mime } as const;
}

export function validateImageAsset(asset: ImagePickerAsset): string | null {
  if (asset.fileSize != null && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    return `Image size exceeds ${MAX_IMAGE_SIZE_LABEL} limit. Please upload a file smaller than ${MAX_IMAGE_SIZE_LABEL}.`;
  }
  return null;
}
