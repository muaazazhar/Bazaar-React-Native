import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { RemoteImage } from '@/components/remote-image';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Category } from '@/types/domain';

type AdminCategoryCardProps = {
  category: Category;
  busy?: boolean;
  onDelete: (categoryId: string) => void;
};

export function AdminCategoryCard({ category, busy, onDelete }: AdminCategoryCardProps) {
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');

  return (
    <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
      <ThemedText type="defaultSemiBold">{category.name}</ThemedText>
      {category.imageUrl ? (
        <RemoteImage uri={category.imageUrl} style={styles.preview} recyclingKey={`category-${category.id}`} />
      ) : null}
      <ThemedButton
        variant="secondary"
        label="Edit Category"
        onPress={() => router.push(`/admin-categories/edit/${category.id}`)}
        disabled={busy}
      />
      <ThemedButton
        variant="danger"
        label="Delete Category"
        onPress={() => onDelete(String(category.id))}
        loading={busy}
        disabled={busy}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
