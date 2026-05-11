import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCreateCategoryMutation, useDeleteCategoryMutation, useGetCategoriesQuery, useUpdateCategoryMutation } from '@/store/api/catalogApi';

function getImagePart(uri: string) {
  const fileName = uri.split('/').pop() ?? 'upload.jpg';
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mime = ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'image/jpeg';
  return { uri, name: fileName, type: mime } as const;
}

export default function AdminCategoriesScreen() {
  const { data: categories = [], isFetching, refetch } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [newName, setNewName] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const inputBackground = useThemeColor({}, 'inputBackground');
  const inputText = useThemeColor({}, 'inputText');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const pickImage = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setter(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      alert('Category name is required.');
      return;
    }
    if (!newImageUri) {
      alert('Category image is required.');
      return;
    }
    const formData = new FormData();
    formData.append('name', newName.trim());
    formData.append('image', getImagePart(newImageUri) as any);

    setBusy(true);
    try {
      await createCategory(formData).unwrap();
      setNewName('');
      setNewImageUri(null);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
    setEditImageUri(null);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editName.trim()) {
      alert('Category name is required.');
      return;
    }
    const formData = new FormData();
    formData.append('name', editName.trim());
    if (editImageUri) {
      formData.append('image', getImagePart(editImageUri) as any);
    }

    setBusy(true);
    try {
      await updateCategory({ id: editingId, body: formData }).unwrap();
      setEditingId(null);
      setEditName('');
      setEditImageUri(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await deleteCategory({ id }).unwrap();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Category Management" />
        <ThemedText style={[styles.helperText, { color: muted }]}>
          Create categories with image attachments and maintain them independently.
        </ThemedText>

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="subtitle">Create Category</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
            placeholder="Category name"
            placeholderTextColor={muted}
            value={newName}
            onChangeText={setNewName}
          />
          <Pressable style={[styles.button, { backgroundColor: primary }]} onPress={() => pickImage(setNewImageUri)} disabled={busy}>
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>Select Category Image</ThemedText>
          </Pressable>
          {newImageUri ? <Image source={{ uri: newImageUri }} style={styles.preview} /> : null}
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
            {category.imageUrl ? <Image source={{ uri: category.imageUrl }} style={styles.preview} /> : null}
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
            <TextInput
              style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
              placeholder="Category name"
              placeholderTextColor={muted}
              value={editName}
              onChangeText={setEditName}
            />
            <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => pickImage(setEditImageUri)} disabled={busy}>
              <ThemedText>Select New Image (optional)</ThemedText>
            </Pressable>
            {editImageUri ? <Image source={{ uri: editImageUri }} style={styles.preview} /> : null}
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
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
