import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { CategoryRowSkeleton } from '@/components/catalog-skeletons';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetCategoryOptionsQuery } from '@/store/api/catalogApi';
import type { Category } from '@/types/domain';

type CategoryChipPickerProps = {
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
  disabled?: boolean;
  error?: string | null;
  /** Keeps the current category visible when it is not on the first options page. */
  pinnedCategory?: Pick<Category, 'id' | 'name'> | null;
};

export function CategoryChipPicker({
  selectedId,
  onSelect,
  disabled,
  error,
  pinnedCategory,
}: CategoryChipPickerProps) {
  const { data: categories = [], isLoading, isError, refetch } = useGetCategoryOptionsQuery();

  const borderColor = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const options = useMemo(() => {
    if (!pinnedCategory) {
      return categories;
    }
    const pinnedId = String(pinnedCategory.id);
    if (categories.some((category) => String(category.id) === pinnedId)) {
      return categories;
    }
    return [{ ...pinnedCategory, imageUrl: null } as Category, ...categories];
  }, [categories, pinnedCategory]);

  return (
    <View style={styles.wrap}>
      {error ? <ThemedText style={{ color: danger, fontSize: 12 }}>{error}</ThemedText> : null}
      {isLoading ? <CategoryRowSkeleton count={4} /> : null}
      {!isLoading && options.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={{ color: muted }}>No categories found. Create at least one category first.</ThemedText>
          <ThemedButton
            variant="secondary"
            label={isError ? 'Retry categories' : 'Refresh categories'}
            onPress={() => void refetch()}
          />
          <ThemedButton
            variant="secondary"
            label="Go to Category Management"
            onPress={() => router.push('/admin-categories')}
          />
        </View>
      ) : null}
      {!isLoading && options.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {options.map((category) => {
            const isSelected = selectedId === String(category.id);
            return (
              <Pressable
                key={category.id}
                style={[
                  styles.chip,
                  { borderColor },
                  isSelected && { backgroundColor: primary, borderColor: primary },
                ]}
                onPress={() => onSelect(String(category.id))}
                disabled={disabled}>
                <ThemedText style={isSelected ? { color: primaryText } : undefined}>{category.name}</ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  chipRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  emptyState: {
    gap: 8,
  },
});
