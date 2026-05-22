import { useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePickerField } from '@/components/image-picker-field';
import { RemoteImage } from '@/components/remote-image';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ValidatingTextInput } from '@/components/validating-text-input';
import {
  FIELD_LIMITS,
  validateDiscount,
  validatePrice,
  validateRequired,
} from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCreateProductMutation, useDeleteProductMutation, useGetCategoriesQuery, useGetProductsQuery, useUpdateProductMutation } from '@/store/api/catalogApi';
import { getApiErrorMessage, isImageSizeError } from '@/utils/apiError';
import { getImagePart, validateImageAsset } from '@/utils/imageUpload';

type ProductFieldErrors = {
  name?: string;
  price?: string;
  discount?: string;
  category?: string;
  image?: string;
};

export default function AdminProductsScreen() {
  const {
    data: categories = [],
    isFetching: categoriesFetching,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const {
    data: products = [],
    isFetching,
    isError: productsLoadError,
    error: productsQueryError,
    refetch,
  } = useGetProductsQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [newImageError, setNewImageError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<ProductFieldErrors>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDiscountPercent, setEditDiscountPercent] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [editImageError, setEditImageError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<ProductFieldErrors>({});

  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const categoryMap = useMemo(() => new Map(categories.map((cat) => [String(cat.id), cat.name])), [categories]);

  const pickImage = async (
    setter: (uri: string) => void,
    setImageError: (message: string | null) => void,
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
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

  const validateCreateForm = (): ProductFieldErrors => {
    const errors: ProductFieldErrors = {};
    const nameError = validateRequired(newName, 'Product name');
    if (nameError) errors.name = nameError;
    const priceError = validatePrice(newPrice);
    if (priceError) errors.price = priceError;
    const discountError = validateDiscount(newDiscountPercent);
    if (discountError) errors.discount = discountError;
    if (!newCategoryId) errors.category = 'Category is mandatory for a product.';
    if (!newImageUri) errors.image = 'Product image is required.';
    return errors;
  };

  const validateEditForm = (): ProductFieldErrors => {
    const errors: ProductFieldErrors = {};
    const nameError = validateRequired(editName, 'Product name');
    if (nameError) errors.name = nameError;
    const priceError = validatePrice(editPrice);
    if (priceError) errors.price = priceError;
    const discountError = validateDiscount(editDiscountPercent);
    if (discountError) errors.discount = discountError;
    if (!editCategoryId) errors.category = 'Category is mandatory for a product.';
    return errors;
  };

  const handleCreate = async () => {
    const errors = validateCreateForm();
    setCreateFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append('name', newName.trim());
    formData.append('price', String(Number(newPrice)));
    formData.append('discountPercent', String(Number(newDiscountPercent || 0)));
    formData.append('categoryId', newCategoryId!);
    formData.append('image', getImagePart(newImageUri!) as any);

    setBusy(true);
    setFormError(null);
    try {
      await createProduct(formData).unwrap();
      setNewName('');
      setNewPrice('');
      setNewDiscountPercent('');
      setNewCategoryId(null);
      setNewImageUri(null);
      setNewImageError(null);
      setCreateFieldErrors({});
    } catch (error) {
      showUploadError(error, 'Could not create product. Please try again.');
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
    setEditDiscountPercent(String(product.discountPercent ?? 0));
    setEditCategoryId(product.categoryId ? String(product.categoryId) : null);
    setEditImageUri(null);
    setEditImageError(null);
    setEditFieldErrors({});
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const errors = validateEditForm();
    setEditFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append('name', editName.trim());
    formData.append('price', String(Number(editPrice)));
    formData.append('discountPercent', String(Number(editDiscountPercent || 0)));
    formData.append('categoryId', editCategoryId!);
    if (editImageUri) {
      formData.append('image', getImagePart(editImageUri) as any);
    }

    setBusy(true);
    setFormError(null);
    try {
      await updateProduct({ id: editingId, body: formData }).unwrap();
      setEditingId(null);
      setEditName('');
      setEditPrice('');
      setEditDiscountPercent('');
      setEditCategoryId(null);
      setEditImageUri(null);
      setEditImageError(null);
      setEditFieldErrors({});
    } catch (error) {
      showUploadError(error, 'Could not update product. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (productId: string) => {
    setBusy(true);
    setFormError(null);
    try {
      await deleteProduct({ id: productId }).unwrap();
    } catch (error) {
      showUploadError(error, 'Could not delete product. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Product Management" />
        {formError ? <ThemedText style={{ color: danger }}>{formError}</ThemedText> : null}
        {productsLoadError ? (
          <ThemedText style={{ color: danger }}>
            {getApiErrorMessage(productsQueryError, 'Could not load products.')}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.helperText, { color: muted }]}>
          Product creation requires category and image attachment.
        </ThemedText>

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="subtitle">Create Product</ThemedText>
          <ValidatingTextInput
            label="Product name"
            placeholder="Product name"
            value={newName}
            onChangeText={(text) => {
              setNewName(text);
              if (createFieldErrors.name) setCreateFieldErrors((p) => ({ ...p, name: undefined }));
            }}
            maxLength={FIELD_LIMITS.productName}
            error={createFieldErrors.name}
          />
          <ValidatingTextInput
            label="Price"
            placeholder="Price"
            value={newPrice}
            onChangeText={(text) => {
              setNewPrice(text.replace(/[^0-9.]/g, ''));
              if (createFieldErrors.price) setCreateFieldErrors((p) => ({ ...p, price: undefined }));
            }}
            maxLength={FIELD_LIMITS.price}
            keyboardType="numeric"
            error={createFieldErrors.price}
          />
          <ValidatingTextInput
            label="Discount % (optional)"
            placeholder="0"
            value={newDiscountPercent}
            onChangeText={(text) => {
              setNewDiscountPercent(text.replace(/[^0-9]/g, ''));
              if (createFieldErrors.discount) setCreateFieldErrors((p) => ({ ...p, discount: undefined }));
            }}
            maxLength={FIELD_LIMITS.discountPercent}
            keyboardType="numeric"
            error={createFieldErrors.discount}
          />

          <ThemedText type="defaultSemiBold">Select Category *</ThemedText>
          {createFieldErrors.category ? (
            <ThemedText style={{ color: danger, fontSize: 12 }}>{createFieldErrors.category}</ThemedText>
          ) : null}
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
                  onPress={() => {
                    setNewCategoryId(String(category.id));
                    if (createFieldErrors.category) setCreateFieldErrors((p) => ({ ...p, category: undefined }));
                  }}
                  disabled={busy}>
                  <ThemedText style={newCategoryId === String(category.id) ? { color: primaryText } : undefined}>{category.name}</ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          <ImagePickerField
            label="Select Product Image"
            onPress={() => pickImage(setNewImageUri, setNewImageError)}
            imageUri={newImageUri}
            imageError={newImageError ?? createFieldErrors.image}
            disabled={busy}
            recyclingKey={newImageUri ? `new-${newImageUri}` : undefined}
            previewStyle={styles.preview}
          />

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
            <ThemedText>
              Rs {product.price}
              {Number(product.discountPercent ?? 0) > 0 ? `  (${product.discountPercent}% off)` : ''}
            </ThemedText>
            <ThemedText>Category: {product.category?.name ?? categoryMap.get(String(product.categoryId ?? '')) ?? 'N/A'}</ThemedText>
            {product.imageUrl ? (
              <RemoteImage uri={product.imageUrl} style={styles.preview} recyclingKey={`product-${product.id}`} />
            ) : null}
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
            <ValidatingTextInput
              label="Product name"
              placeholder="Product name"
              value={editName}
              onChangeText={(text) => {
                setEditName(text);
                if (editFieldErrors.name) setEditFieldErrors((p) => ({ ...p, name: undefined }));
              }}
              maxLength={FIELD_LIMITS.productName}
              error={editFieldErrors.name}
            />
            <ValidatingTextInput
              label="Price"
              placeholder="Price"
              value={editPrice}
              onChangeText={(text) => {
                setEditPrice(text.replace(/[^0-9.]/g, ''));
                if (editFieldErrors.price) setEditFieldErrors((p) => ({ ...p, price: undefined }));
              }}
              maxLength={FIELD_LIMITS.price}
              keyboardType="numeric"
              error={editFieldErrors.price}
            />
            <ValidatingTextInput
              label="Discount %"
              placeholder="0"
              value={editDiscountPercent}
              onChangeText={(text) => {
                setEditDiscountPercent(text.replace(/[^0-9]/g, ''));
                if (editFieldErrors.discount) setEditFieldErrors((p) => ({ ...p, discount: undefined }));
              }}
              maxLength={FIELD_LIMITS.discountPercent}
              keyboardType="numeric"
              error={editFieldErrors.discount}
            />
            <ThemedText type="defaultSemiBold">Select Category *</ThemedText>
            {editFieldErrors.category ? (
              <ThemedText style={{ color: danger, fontSize: 12 }}>{editFieldErrors.category}</ThemedText>
            ) : null}
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
                    onPress={() => {
                      setEditCategoryId(String(category.id));
                      if (editFieldErrors.category) setEditFieldErrors((p) => ({ ...p, category: undefined }));
                    }}
                    disabled={busy}>
                    <ThemedText style={editCategoryId === String(category.id) ? { color: primaryText } : undefined}>{category.name}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
            <ImagePickerField
              label="Select New Image (optional)"
              variant="secondary"
              onPress={() => pickImage(setEditImageUri, setEditImageError)}
              imageUri={editImageUri}
              imageError={editImageError}
              disabled={busy}
              recyclingKey={editImageUri ? `edit-${editImageUri}` : undefined}
              previewStyle={styles.preview}
            />
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
