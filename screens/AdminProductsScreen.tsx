import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminProductCard } from '@/components/admin-product-card';
import { ApiErrorBanner } from '@/components/api-feedback';
import { ProductListSkeleton } from '@/components/catalog-skeletons';
import { CategoryChipPicker } from '@/components/category-chip-picker';
import { ListEmptyPlaceholder } from '@/components/list-empty-placeholder';
import { PaginatedFlatList, paginatedListStyles } from '@/components/paginated-flat-list';
import { useNotification } from '@/context/NotificationContext';
import { ImagePickerField } from '@/components/image-picker-field';
import { ScreenHeader } from '@/components/screen-header';
import { SurfaceCard } from '@/components/surface-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ValidatingTextInput } from '@/components/validating-text-input';
import {
  FIELD_LIMITS,
  validateDiscount,
  validatePrice,
  validateRequired,
} from '@/constants/fieldLimits';
import { usePaginatedInfiniteList } from '@/hooks/use-paginated-infinite-list';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetProductPagesInfiniteQuery,
} from '@/store/api/catalogApi';
import type { Product } from '@/types/domain';
import { getApiErrorDetails } from '@/utils/apiError';
import { notifyAdminApiFailure } from '@/utils/inAppNotify';
import { productCreatedMessage, productDeletedMessage } from '@/utils/notificationMessages';
import { getImagePart, pickImageFromLibrary } from '@/utils/imageUpload';

type ProductFieldErrors = {
  name?: string;
  price?: string;
  discount?: string;
  category?: string;
  image?: string;
};

export default function AdminProductsScreen() {
  const productsQuery = useGetProductPagesInfiniteQuery();
  const { items, isInitialLoading, loadMore, isFetchingNextPage } = usePaginatedInfiniteList(productsQuery);

  const [createProduct] = useCreateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const { notify } = useNotification();

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [newImageError, setNewImageError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<ProductFieldErrors>({});
  const [busy, setBusy] = useState(false);

  const muted = useThemeColor({}, 'muted');

  const pickImage = () =>
    pickImageFromLibrary({
      aspect: [4, 3],
      onUri: (uri) => {
        setNewImageError(null);
        setNewImageUri(uri);
      },
      onSizeError: setNewImageError,
    });

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
    try {
      await createProduct(formData).unwrap();
      notify(productCreatedMessage(newName.trim()));
      setNewName('');
      setNewPrice('');
      setNewDiscountPercent('');
      setNewCategoryId(null);
      setNewImageUri(null);
      setNewImageError(null);
      setCreateFieldErrors({});
    } catch (error) {
      notifyAdminApiFailure(notify, error, 'Could not create product. Please try again.', {
        title: 'Create failed',
        context: 'POST /api/products',
        onImageSizeError: setNewImageError,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = useCallback(
    async (productId: string) => {
      const productName = items.find((item) => String(item.id) === productId)?.name ?? 'Product';
      setBusy(true);
      try {
        await deleteProduct({ id: productId }).unwrap();
        notify(productDeletedMessage(productName));
      } catch (error) {
        notifyAdminApiFailure(notify, error, 'Could not delete product. Please try again.', {
          title: 'Delete failed',
          context: `DELETE /api/products/${productId}`,
        });
      } finally {
        setBusy(false);
      }
    },
    [deleteProduct, items, notify],
  );

  const renderProduct = useCallback(
    ({ item: product }: { item: Product }) => (
      <AdminProductCard
        product={product}
        categoryLabel={product.category?.name ?? 'N/A'}
        busy={busy}
        onDelete={handleDelete}
      />
    ),
    [busy, handleDelete],
  );

  const listHeader = (
    <>
      <ScreenHeader title="Product Management" />
      <ApiErrorBanner
        title="Could not load products"
        message={
          productsQuery.isError
            ? getApiErrorDetails(productsQuery.error, 'Could not load products.').message
            : null
        }
        onRetry={() => void productsQuery.refetch()}
      />
      <ThemedText style={[styles.helperText, { color: muted }]}>
        Product creation requires category and image attachment.
      </ThemedText>

      <SurfaceCard>
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
          label="Discount %"
          optional
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
        <CategoryChipPicker
          selectedId={newCategoryId}
          onSelect={(id) => {
            setNewCategoryId(id);
            if (createFieldErrors.category) setCreateFieldErrors((p) => ({ ...p, category: undefined }));
          }}
          disabled={busy}
          error={createFieldErrors.category}
        />

        <ImagePickerField
          label="Product image"
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

        <ThemedButton variant="primary" label="Create Product" onPress={handleCreate} loading={busy} disabled={busy} />
      </SurfaceCard>

      <ThemedButton
        variant="secondary"
        label={productsQuery.isFetching && !productsQuery.isLoading ? 'Refreshing...' : 'Refresh Products'}
        loading={productsQuery.isFetching && !isInitialLoading}
        onPress={() => void productsQuery.refetch()}
        disabled={busy}
      />

      {!isInitialLoading ? (
        <ThemedText type="subtitle" style={styles.listSectionTitle}>
          Existing products
        </ThemedText>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PaginatedFlatList
        data={items}
        renderItem={renderProduct}
        ListHeaderComponent={listHeader}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={loadMore}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={paginatedListStyles.contentWide}
        ListEmptyComponent={
          <ListEmptyPlaceholder
            isLoading={isInitialLoading}
            isError={productsQuery.isError}
            loadingSkeleton={<ProductListSkeleton count={2} />}
            emptyLabel="No products yet."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  helperText: {
    marginBottom: 2,
  },
  listSectionTitle: {
    marginTop: 4,
  },
  preview: {
    width: 108,
    height: 108,
    borderRadius: 12,
  },
});
