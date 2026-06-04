import * as ImagePicker from 'expo-image-picker';
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

type PickImageOptions = {
  aspect: [number, number];
  quality?: number;
  onUri: (uri: string) => void;
  onSizeError: (message: string) => void;
};

export async function pickImageFromLibrary({
  aspect,
  quality = 0.8,
  onUri,
  onSizeError,
}: PickImageOptions): Promise<void> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect,
    quality,
  });
  if (result.canceled || !result.assets.length) {
    return;
  }
  const asset = result.assets[0];
  const sizeError = validateImageAsset(asset);
  if (sizeError) {
    onSizeError(sizeError);
    return;
  }
  onUri(asset.uri);
}
