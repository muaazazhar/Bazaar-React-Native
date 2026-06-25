import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminCategoryCard } from '@/components/admin-category-card';
import { ApiErrorBanner } from '@/components/api-feedback';
import { CategoryListSkeleton } from '@/components/catalog-skeletons';
import { ListEmptyPlaceholder } from '@/components/list-empty-placeholder';
import { PaginatedFlatList, paginatedListStyles } from '@/components/paginated-flat-list';
import { useNotification } from '@/context/NotificationContext';
import { ImagePickerField } from '@/components/image-picker-field';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { FIELD_LIMITS, validateRequired } from '@/constants/fieldLimits';
import { usePaginatedInfiniteList } from '@/hooks/use-paginated-infinite-list';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoryPagesInfiniteQuery,
} from '@/store/api/catalogApi';
import type { Category } from '@/types/domain';
import { getApiErrorDetails } from '@/utils/apiError';
import { notifyAdminApiFailure } from '@/utils/inAppNotify';
import { categoryCreatedMessage, categoryDeletedMessage } from '@/utils/notificationMessages';
import { getImagePart, pickImageFromLibrary } from '@/utils/imageUpload';

type NameFieldErrors = { name?: string; image?: string };

export default function AdminCategoriesScreen() {
  const query = useGetCategoryPagesInfiniteQuery();
  const { items, isInitialLoading, loadMore, isFetchingNextPage } = usePaginatedInfiniteList(query);
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
  const muted = useThemeColor({}, 'muted');

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

  const handleDelete = useCallback(
    async (id: string) => {
      const categoryName = items.find((item) => String(item.id) === id)?.name ?? 'Category';
      setBusy(true);
      try {
        await deleteCategory({ id }).unwrap();
        notify(categoryDeletedMessage(categoryName));
      } catch (error) {
        notifyAdminApiFailure(notify, error, 'Could not delete category. Please try again.', {
          title: 'Delete failed',
          context: `DELETE /api/categories/${id}`,
        });
      } finally {
        setBusy(false);
      }
    },
    [deleteCategory, items, notify],
  );

  const renderCategory = useCallback(
    ({ item: category }: { item: Category }) => (
      <AdminCategoryCard category={category} busy={busy} onDelete={handleDelete} />
    ),
    [busy, handleDelete],
  );

  const listHeader = (
    <>
      <ScreenHeader title="Category Management" />
      <ApiErrorBanner
        title="Could not load categories"
        message={
          query.isError
            ? getApiErrorDetails(query.error, 'Could not load categories.').message
            : null
        }
        onRetry={() => void query.refetch()}
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
        <ThemedButton variant="primary" label="Create Category" onPress={handleCreate} loading={busy} disabled={busy} />
      </ThemedView>

      <ThemedButton
        variant="secondary"
        label={query.isFetching && !query.isLoading ? 'Refreshing...' : 'Refresh Categories'}
        loading={query.isFetching && !isInitialLoading}
        onPress={() => void query.refetch()}
        disabled={busy}
      />

      {!isInitialLoading ? (
        <ThemedText type="subtitle" style={styles.listSectionTitle}>
          Existing categories
        </ThemedText>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PaginatedFlatList
        data={items}
        renderItem={renderCategory}
        ListHeaderComponent={listHeader}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={loadMore}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={paginatedListStyles.contentWide}
        ListEmptyComponent={
          <ListEmptyPlaceholder
            isLoading={isInitialLoading}
            isError={query.isError}
            loadingSkeleton={<CategoryListSkeleton count={2} />}
            emptyLabel="No categories yet."
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
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
});
