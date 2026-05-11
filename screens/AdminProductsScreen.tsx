import { useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCreateProductMutation, useDeleteProductMutation, useGetCategoriesQuery, useGetProductsQuery, useUpdateProductMutation } from '@/store/api/catalogApi';

function getImagePart(uri: string) {
  const fileName = uri.split('/').pop() ?? 'upload.jpg';
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mime = ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'image/jpeg';
  return { uri, name: fileName, type: mime } as const;
}

export default function AdminProductsScreen() {
  const {
    data: categories = [],
    isFetching: categoriesFetching,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const { data: products = [], isFetching, refetch } = useGetProductsQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
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

  const categoryMap = useMemo(() => new Map(categories.map((cat) => [String(cat.id), cat.name])), [categories]);

  const pickImage = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setter(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newPrice.trim()) {
      alert('Product name and price are required.');
      return;
    }
    const price = Number(newPrice);
    if (!Number.isFinite(price) || price <= 0) {
      alert('Price must be a positive number.');
      return;
    }
    if (!newCategoryId) {
      alert('Category is mandatory for a product.');
      return;
    }
    if (!newImageUri) {
      alert('Product image is required.');
      return;
    }

    const formData = new FormData();
    formData.append('name', newName.trim());
    formData.append('price', String(price));
    formData.append('categoryId', newCategoryId);
    formData.append('image', getImagePart(newImageUri) as any);

    setBusy(true);
    try {
      await createProduct(formData).unwrap();
      setNewName('');
      setNewPrice('');
      setNewCategoryId(null);
      setNewImageUri(null);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (productId: string) => {
    const product = products.find((item) => String(item.id) === productId);
    if (!product) return;
    setEditingId(productId);
    setEditName(product.name);
    setEditPrice(String(product.price));
    setEditCategoryId(product.categoryId ? String(product.categoryId) : null);
    setEditImageUri(null);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editName.trim() || !editPrice.trim()) {
      alert('Product name and price are required.');
      return;
    }
    const price = Number(editPrice);
    if (!Number.isFinite(price) || price <= 0) {
      alert('Price must be a positive number.');
      return;
    }
    if (!editCategoryId) {
      alert('Category is mandatory for a product.');
      return;
    }

    const formData = new FormData();
    formData.append('name', editName.trim());
    formData.append('price', String(price));
    formData.append('categoryId', editCategoryId);
    if (editImageUri) {
      formData.append('image', getImagePart(editImageUri) as any);
    }

    setBusy(true);
    try {
      await updateProduct({ id: editingId, body: formData }).unwrap();
      setEditingId(null);
      setEditName('');
      setEditPrice('');
      setEditCategoryId(null);
      setEditImageUri(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (productId: string) => {
    setBusy(true);
    try {
      await deleteProduct({ id: productId }).unwrap();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Product Management" />
        <ThemedText style={[styles.helperText, { color: muted }]}>
          Product creation requires category and image attachment.
        </ThemedText>

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="subtitle">Create Product</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
            placeholder="Product name"
            placeholderTextColor={muted}
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
            placeholder="Price"
            placeholderTextColor={muted}
            keyboardType="numeric"
            value={newPrice}
            onChangeText={setNewPrice}
          />

          <ThemedText type="defaultSemiBold">Select Category *</ThemedText>
          {categoriesFetching ? (
            <ThemedText style={{ color: muted }}>Loading categories...</ThemedText>
          ) : null}
          {!categoriesFetching && categories.length === 0 ? (
            <View style={styles.categoryEmptyState}>
              <ThemedText style={{ color: muted }}>
                No categories found. Create at least one category first.
              </ThemedText>
              <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={refetchCategories}>
                <ThemedText>{categoriesError ? 'Retry Categories' : 'Refresh Categories'}</ThemedText>
              </Pressable>
              <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => router.push('/admin-categories')}>
                <ThemedText>Go to Category Management</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.chipsRow}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    { borderColor },
                    newCategoryId === String(category.id) && { backgroundColor: primary, borderColor: primary },
                  ]}
                  onPress={() => setNewCategoryId(String(category.id))}
                  disabled={busy}>
                  <ThemedText style={newCategoryId === String(category.id) ? { color: primaryText } : undefined}>{category.name}</ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable style={[styles.button, { backgroundColor: primary }]} onPress={() => pickImage(setNewImageUri)} disabled={busy}>
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>Select Product Image</ThemedText>
          </Pressable>
          {newImageUri ? <Image source={{ uri: newImageUri }} style={styles.preview} /> : null}

          <Pressable style={[styles.button, { backgroundColor: primary }, busy && styles.buttonDisabled]} onPress={handleCreate} disabled={busy}>
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>Create Product</ThemedText>
          </Pressable>
        </ThemedView>

        <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={refetch}>
          <ThemedText>{isFetching ? 'Refreshing...' : 'Refresh Products'}</ThemedText>
        </Pressable>

        {products.map((product) => (
          <ThemedView key={String(product.id)} style={[styles.card, { borderColor, backgroundColor: surface }]}>
            <ThemedText type="defaultSemiBold">{product.name}</ThemedText>
            <ThemedText>Rs {product.price}</ThemedText>
            <ThemedText>Category: {product.category?.name ?? categoryMap.get(String(product.categoryId ?? '')) ?? 'N/A'}</ThemedText>
            {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.preview} /> : null}
            <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => startEdit(String(product.id))} disabled={busy}>
              <ThemedText>Edit Product</ThemedText>
            </Pressable>
            <Pressable style={[styles.secondaryButton, { borderColor: danger }]} onPress={() => handleDelete(String(product.id))} disabled={busy}>
              <ThemedText style={{ color: danger }}>Delete Product</ThemedText>
            </Pressable>
          </ThemedView>
        ))}

        {editingId ? (
          <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
            <ThemedText type="subtitle">Edit Product</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
              placeholder="Product name"
              placeholderTextColor={muted}
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
              placeholder="Price"
              placeholderTextColor={muted}
              keyboardType="numeric"
              value={editPrice}
              onChangeText={setEditPrice}
            />
            <ThemedText type="defaultSemiBold">Select Category *</ThemedText>
            {!categoriesFetching && categories.length === 0 ? (
              <View style={styles.categoryEmptyState}>
                <ThemedText style={{ color: muted }}>No categories available.</ThemedText>
                <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => router.push('/admin-categories')}>
                  <ThemedText>Go to Category Management</ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.chipsRow}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      { borderColor },
                      editCategoryId === String(category.id) && { backgroundColor: primary, borderColor: primary },
                    ]}
                    onPress={() => setEditCategoryId(String(category.id))}
                    disabled={busy}>
                    <ThemedText style={editCategoryId === String(category.id) ? { color: primaryText } : undefined}>{category.name}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
            <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => pickImage(setEditImageUri)} disabled={busy}>
              <ThemedText>Select New Image (optional)</ThemedText>
            </Pressable>
            {editImageUri ? <Image source={{ uri: editImageUri }} style={styles.preview} /> : null}
            <Pressable style={[styles.button, { backgroundColor: primary }, busy && styles.buttonDisabled]} onPress={handleUpdate} disabled={busy}>
              <ThemedText style={[styles.buttonText, { color: primaryText }]}>Save Product</ThemedText>
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
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryEmptyState: {
    gap: 8,
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
    width: 108,
    height: 108,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
