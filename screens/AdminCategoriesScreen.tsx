import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePickerField } from '@/components/image-picker-field';
import { RemoteImage } from '@/components/remote-image';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { FIELD_LIMITS, validateRequired } from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCreateCategoryMutation, useDeleteCategoryMutation, useGetCategoriesQuery, useUpdateCategoryMutation } from '@/store/api/catalogApi';
import { getApiErrorMessage, isImageSizeError } from '@/utils/apiError';
import { getImagePart, validateImageAsset } from '@/utils/imageUpload';

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
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [newName, setNewName] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [newImageError, setNewImageError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<NameFieldErrors>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [editImageError, setEditImageError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<NameFieldErrors>({});

  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const pickImage = async (
    setter: (uri: string) => void,
    setImageError: (message: string | null) => void,
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const sizeError = validateImageAsset(asset);
      if (sizeError) {
        setImageError(sizeError);
        return;
      }
      setImageError(null);
      setter(asset.uri);
    }
  };

  const showUploadError = (error: unknown, fallback: string) => {
    const message = getApiErrorMessage(error, fallback);
    setFormError(message);
    if (isImageSizeError(message)) {
      if (editingId) {
        setEditImageError(message);
      } else {
        setNewImageError(message);
      }
    }
    alert(message);
  };

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
    setFormError(null);
    try {
      await createCategory(formData).unwrap();
      setNewName('');
      setNewImageUri(null);
      setNewImageError(null);
      setCreateFieldErrors({});
    } catch (error) {
      showUploadError(error, 'Could not create category. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
    setEditImageUri(null);
    setEditImageError(null);
    setEditFieldErrors({});
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const errors: NameFieldErrors = {};
    const nameError = validateRequired(editName, 'Category name');
    if (nameError) errors.name = nameError;
    setEditFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append('name', editName.trim());
    if (editImageUri) {
      formData.append('image', getImagePart(editImageUri) as any);
    }

    setBusy(true);
    setFormError(null);
    try {
      await updateCategory({ id: editingId, body: formData }).unwrap();
      setEditingId(null);
      setEditName('');
      setEditImageUri(null);
      setEditImageError(null);
      setEditFieldErrors({});
    } catch (error) {
      showUploadError(error, 'Could not update category. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    setFormError(null);
    try {
      await deleteCategory({ id }).unwrap();
    } catch (error) {
      showUploadError(error, 'Could not delete category. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Category Management" />
        {formError ? <ThemedText style={{ color: danger }}>{formError}</ThemedText> : null}
        {categoriesLoadError ? (
          <ThemedText style={{ color: danger }}>
            {getApiErrorMessage(categoriesQueryError, 'Could not load categories.')}
          </ThemedText>
        ) : null}
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
            label="Select Category Image"
            onPress={() => pickImage(setNewImageUri, setNewImageError)}
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
            <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => startEdit(String(category.id), category.name)} disabled={busy}>
              <ThemedText>Edit Category</ThemedText>
            </Pressable>
            <Pressable style={[styles.secondaryButton, { borderColor: danger }]} onPress={() => handleDelete(String(category.id))} disabled={busy}>
              <ThemedText style={{ color: danger }}>Delete Category</ThemedText>
            </Pressable>
          </ThemedView>
        ))}

        {editingId ? (
          <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
            <ThemedText type="subtitle">Edit Category</ThemedText>
            <ValidatingTextInput
              label="Category name"
              placeholder="Category name"
              value={editName}
              onChangeText={(text) => {
                setEditName(text);
                if (editFieldErrors.name) {
                  setEditFieldErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              maxLength={FIELD_LIMITS.categoryName}
              error={editFieldErrors.name}
            />
            <ImagePickerField
              label="Select New Image (optional)"
              variant="secondary"
              onPress={() => pickImage(setEditImageUri, setEditImageError)}
              onRemove={() => {
                setEditImageUri(null);
                setEditImageError(null);
              }}
              imageUri={editImageUri}
              imageError={editImageError}
              disabled={busy}
              recyclingKey={editImageUri ? `edit-${editImageUri}` : undefined}
              previewStyle={styles.preview}
            />
            <Pressable style={[styles.button, { backgroundColor: primary }, busy && styles.buttonDisabled]} onPress={handleUpdate} disabled={busy}>
              <ThemedText style={[styles.buttonText, { color: primaryText }]}>Save Category</ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}
      </ScrollView>
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
