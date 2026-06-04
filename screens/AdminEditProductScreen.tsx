import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { useNotification } from '@/context/NotificationContext';
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
import {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useUpdateProductMutation,
} from '@/store/api/catalogApi';
import { notifyAdminApiFailure } from '@/utils/inAppNotify';
import { productUpdatedMessage } from '@/utils/notificationMessages';
import { getImagePart, pickImageFromLibrary } from '@/utils/imageUpload';
import { resolveProductCategoryId } from '@/utils/productCategory';

type ProductFieldErrors = {
  name?: string;
  price?: string;
  discount?: string;
  category?: string;
};

export default function AdminEditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = typeof id === 'string' ? id : '';

  const { data: products = [], isLoading: productsLoading } = useGetProductsQuery();
  const { data: categories = [], isFetching: categoriesFetching } = useGetCategoriesQuery();
  const [updateProduct] = useUpdateProductMutation();
  const { notify } = useNotification();

  const product = products.find((item) => String(item.id) === productId);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});
  const [busy, setBusy] = useState(false);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const hydratedProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    hydratedProductIdRef.current = null;
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    if (hydratedProductIdRef.current === productId) return;

    setName(product.name);
    setPrice(String(product.price));
    setDiscountPercent(String(product.discountPercent ?? 0));
    setCategoryId(resolveProductCategoryId(product, categories));
    hydratedProductIdRef.current = productId;
  }, [product, productId, categories]);

  useEffect(() => {
    if (!product || categoryId) return;
    const resolved = resolveProductCategoryId(product, categories);
    if (resolved) {
      setCategoryId(resolved);
    }
  }, [product, categories, categoryId]);

  const pickImage = () =>
    pickImageFromLibrary({
      aspect: [4, 3],
      onUri: (uri) => {
        setImageError(null);
        setNewImageUri(uri);
      },
      onSizeError: setImageError,
    });

  const handleUpdate = async () => {
    const errors: ProductFieldErrors = {};
    const nameError = validateRequired(name, 'Product name');
    if (nameError) errors.name = nameError;
    const priceError = validatePrice(price);
    if (priceError) errors.price = priceError;
    const discountError = validateDiscount(discountPercent);
    if (discountError) errors.discount = discountError;
    const effectiveCategoryId =
      categoryId ?? resolveProductCategoryId(product, categories);
    if (!effectiveCategoryId) {
      errors.category = 'Category is mandatory for a product.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('price', String(Number(price)));
      formData.append('discountPercent', String(Number(discountPercent || 0)));
      formData.append('categoryId', effectiveCategoryId!);
      if (newImageUri) {
        formData.append('image', getImagePart(newImageUri) as any);
      }
      await updateProduct({ id: productId, body: formData }).unwrap();
      notify(productUpdatedMessage(name.trim()));
      router.back();
    } catch (error) {
      notifyAdminApiFailure(notify, error, 'Could not update product. Please try again.', {
        title: 'Update failed',
        context: `PATCH /api/products/${productId}`,
        onImageSizeError: setImageError,
      });
    } finally {
      setBusy(false);
    }
  };

  if (productsLoading && !product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ActivityIndicator style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit Product" />
        <ThemedText style={{ color: danger, padding: 16 }}>Product not found.</ThemedText>
        <Pressable style={[styles.secondaryButton, { borderColor, marginHorizontal: 16 }]} onPress={() => router.back()}>
          <ThemedText>Go back</ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title={product ? `Edit: ${product.name}` : 'Edit product'} />
        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ValidatingTextInput
            label="Product name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
            }}
            maxLength={FIELD_LIMITS.productName}
            error={fieldErrors.name}
          />
          <ValidatingTextInput
            label="Price"
            value={price}
            onChangeText={(text) => {
              setPrice(text.replace(/[^0-9.]/g, ''));
              if (fieldErrors.price) setFieldErrors((p) => ({ ...p, price: undefined }));
            }}
            maxLength={FIELD_LIMITS.price}
            keyboardType="numeric"
            error={fieldErrors.price}
          />
          <ValidatingTextInput
            label="Discount %"
            optional
            value={discountPercent}
            onChangeText={(text) => {
              setDiscountPercent(text.replace(/[^0-9]/g, ''));
              if (fieldErrors.discount) setFieldErrors((p) => ({ ...p, discount: undefined }));
            }}
            maxLength={FIELD_LIMITS.discountPercent}
            keyboardType="numeric"
            error={fieldErrors.discount}
          />

          <ThemedText type="defaultSemiBold">Category</ThemedText>
          {fieldErrors.category ? (
            <ThemedText style={{ color: danger, fontSize: 12 }}>{fieldErrors.category}</ThemedText>
          ) : null}
          {categoriesFetching ? (
            <ThemedText style={{ color: muted }}>Loading categories...</ThemedText>
          ) : (
            <View style={styles.chipsRow}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    { borderColor },
                    categoryId != null &&
                      String(categoryId) === String(category.id) && {
                        backgroundColor: primary,
                        borderColor: primary,
                      },
                  ]}
                  onPress={() => {
                    setCategoryId(String(category.id));
                    if (fieldErrors.category) setFieldErrors((p) => ({ ...p, category: undefined }));
                  }}
                  disabled={busy}>
                  <ThemedText
                    style={
                      categoryId != null && String(categoryId) === String(category.id)
                        ? { color: primaryText }
                        : undefined
                    }>
                    {category.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          {product.imageUrl && !newImageUri ? (
            <View style={styles.currentImageBlock}>
              <ThemedText style={{ color: muted }}>Current image</ThemedText>
              <RemoteImage uri={product.imageUrl} style={styles.preview} recyclingKey={`product-${product.id}`} />
            </View>
          ) : null}

          <ImagePickerField
            label="Product image"
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
              <ThemedText style={[styles.buttonText, { color: primaryText }]}>Update Product</ThemedText>
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
  currentImageBlock: {
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
