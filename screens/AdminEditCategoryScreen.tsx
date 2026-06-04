import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { useNotification } from '@/context/NotificationContext';
import { ImagePickerField } from '@/components/image-picker-field';
import { RemoteImage } from '@/components/remote-image';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { FIELD_LIMITS, validateRequired } from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetCategoriesQuery, useUpdateCategoryMutation } from '@/store/api/catalogApi';
import { notifyAdminApiFailure } from '@/utils/inAppNotify';
import { categoryUpdatedMessage } from '@/utils/notificationMessages';
import { getImagePart, pickImageFromLibrary } from '@/utils/imageUpload';

type FieldErrors = { name?: string };

export default function AdminEditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = typeof id === 'string' ? id : '';

  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [updateCategory] = useUpdateCategoryMutation();
  const { notify } = useNotification();

  const category = categories.find((item) => String(item.id) === categoryId);

  const [name, setName] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  useEffect(() => {
    if (!category || initialized) return;
    setName(category.name);
    setInitialized(true);
  }, [category, initialized]);

  const pickImage = () =>
    pickImageFromLibrary({
      aspect: [1, 1],
      onUri: (uri) => {
        setImageError(null);
        setNewImageUri(uri);
      },
      onSizeError: setImageError,
    });

  const handleUpdate = async () => {
    const errors: FieldErrors = {};
    const nameError = validateRequired(name, 'Category name');
    if (nameError) errors.name = nameError;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (newImageUri) {
        formData.append('image', getImagePart(newImageUri) as any);
      }
      await updateCategory({ id: categoryId, body: formData }).unwrap();
      notify(categoryUpdatedMessage(name.trim()));
      router.back();
    } catch (error) {
      notifyAdminApiFailure(notify, error, 'Could not update category. Please try again.', {
        title: 'Update failed',
        context: `PATCH /api/categories/${categoryId}`,
        onImageSizeError: setImageError,
      });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading && !category) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ActivityIndicator style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit Category" />
        <ThemedText style={{ color: danger, padding: 16 }}>Category not found.</ThemedText>
        <Pressable style={[styles.secondaryButton, { borderColor, marginHorizontal: 16 }]} onPress={() => router.back()}>
          <ThemedText>Go back</ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title={category ? `Edit: ${category.name}` : 'Edit category'} />
        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ValidatingTextInput
            label="Category name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
            }}
            maxLength={FIELD_LIMITS.categoryName}
            error={fieldErrors.name}
          />

          {category.imageUrl && !newImageUri ? (
            <>
              <ThemedText style={{ color: muted }}>Current image</ThemedText>
              <RemoteImage uri={category.imageUrl} style={styles.preview} recyclingKey={`category-${category.id}`} />
            </>
          ) : null}

          <ImagePickerField
            label="Category image"
            optional
            variant="secondary"
            actionLabel="Change image"
            onPress={pickImage}
            onRemove={() => {
              setNewImageUri(null);
              setImageError(null);
            }}
            imageUri={newImageUri}
            imageError={imageError}
            disabled={busy}
            recyclingKey={newImageUri ? `edit-${newImageUri}` : undefined}
            previewStyle={styles.preview}
          />

          <Pressable
            style={[styles.button, { backgroundColor: primary }, busy && styles.buttonDisabled]}
            onPress={handleUpdate}
            disabled={busy}>
            {busy ? (
              <ActivityIndicator color={primaryText} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: primaryText }]}>Update Category</ThemedText>
            )}
          </Pressable>
        </ThemedView>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '700',
  },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
