import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
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
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
} from '@/store/api/catalogApi';
import { getApiErrorDetails } from '@/utils/apiError';
import { notifyAdminApiFailure } from '@/utils/inAppNotify';
import { categoryCreatedMessage } from '@/utils/notificationMessages';
import { getImagePart, pickImageFromLibrary } from '@/utils/imageUpload';

type NameFieldErrors = { name?: string; image?: string };

export default function AdminCategoriesScreen() {
  const {
    data: categories = [],
    isFetching,
    isError: categoriesLoadError,
    error: categoriesQueryError,
    refetch,
  } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const { notify } = useNotification();

  const [newName, setNewName] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [newImageError, setNewImageError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<NameFieldErrors>({});

  const [busy, setBusy] = useState(false);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const pickImage = () =>
    pickImageFromLibrary({
      aspect: [1, 1],
      onUri: (uri) => {
        setNewImageError(null);
        setNewImageUri(uri);
      },
      onSizeError: setNewImageError,
    });

  const handleCreate = async () => {
    const errors: NameFieldErrors = {};
    const nameError = validateRequired(newName, 'Category name');
    if (nameError) errors.name = nameError;
    if (!newImageUri) errors.image = 'Category image is required.';
    setCreateFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append('name', newName.trim());
    formData.append('image', getImagePart(newImageUri!) as any);

    setBusy(true);
    try {
      await createCategory(formData).unwrap();
      notify(categoryCreatedMessage(newName.trim()));
      setNewName('');
      setNewImageUri(null);
      setNewImageError(null);
      setCreateFieldErrors({});
    } catch (error) {
      notifyAdminApiFailure(notify, error, 'Could not create category. Please try again.', {
        title: 'Create failed',
        context: 'POST /api/categories',
        onImageSizeError: setNewImageError,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await deleteCategory({ id }).unwrap();
    } catch (error) {
      notifyAdminApiFailure(notify, error, 'Could not delete category. Please try again.', {
        title: 'Delete failed',
        context: `DELETE /api/categories/${id}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Category Management" />
        <ApiErrorBanner
          title="Could not load categories"
          message={
            categoriesLoadError
              ? getApiErrorDetails(categoriesQueryError, 'Could not load categories.').message
              : null
          }
          onRetry={refetch}
        />
        <ThemedText style={[styles.helperText, { color: muted }]}>
          Create categories with image attachments and maintain them independently.
        </ThemedText>

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="subtitle">Create Category</ThemedText>
          <ValidatingTextInput
            label="Category name"
            placeholder="Category name"
            value={newName}
            onChangeText={(text) => {
              setNewName(text);
              if (createFieldErrors.name) {
                setCreateFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            maxLength={FIELD_LIMITS.categoryName}
            error={createFieldErrors.name}
          />
          <ImagePickerField
            label="Category image"
            actionLabel="Select image"
            onPress={pickImage}
            onRemove={() => {
              setNewImageUri(null);
              setNewImageError(null);
              if (createFieldErrors.image) {
                setCreateFieldErrors((p) => ({ ...p, image: undefined }));
              }
            }}
            imageUri={newImageUri}
            imageError={newImageError ?? createFieldErrors.image}
            disabled={busy}
            recyclingKey={newImageUri ? `new-${newImageUri}` : undefined}
            previewStyle={styles.preview}
          />
          <Pressable style={[styles.button, { backgroundColor: primary }, busy && styles.buttonDisabled]} onPress={handleCreate} disabled={busy}>
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>Create Category</ThemedText>
          </Pressable>
        </ThemedView>

        <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={refetch}>
          <ThemedText>{isFetching ? 'Refreshing...' : 'Refresh Categories'}</ThemedText>
        </Pressable>

        {categories.map((category) => (
          <ThemedView key={category.id} style={[styles.card, { borderColor, backgroundColor: surface }]}>
            <ThemedText type="defaultSemiBold">{category.name}</ThemedText>
            {category.imageUrl ? (
              <RemoteImage uri={category.imageUrl} style={styles.preview} recyclingKey={`category-${category.id}`} />
            ) : null}
            <Pressable
              style={[styles.secondaryButton, { borderColor }]}
              onPress={() => router.push(`/admin-categories/edit/${category.id}`)}
              disabled={busy}>
              <ThemedText>Edit Category</ThemedText>
            </Pressable>
            <Pressable style={[styles.secondaryButton, { borderColor: danger }]} onPress={() => handleDelete(String(category.id))} disabled={busy}>
              <ThemedText style={{ color: danger }}>Delete Category</ThemedText>
            </Pressable>
          </ThemedView>
        ))}
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
  helperText: {
    marginBottom: 2,
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
