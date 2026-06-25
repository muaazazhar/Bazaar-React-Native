import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton-block';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedView } from '@/components/themed-view';

function SkeletonCards({
  count,
  cardStyle,
  renderCard,
  listStyle,
}: {
  count: number;
  cardStyle: StyleProp<ViewStyle>;
  renderCard: (index: number) => ReactNode;
  listStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={listStyle}>
      {Array.from({ length: count }, (_, index) => (
        <ThemedView key={index} style={cardStyle}>
          {renderCard(index)}
        </ThemedView>
      ))}
    </View>
  );
}

export function CategoryRowSkeleton({ count = 4 }: { count?: number }) {
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
      {Array.from({ length: count }, (_, index) => (
        <ThemedView
          key={`category-skeleton-${index}`}
          style={[styles.categoryCard, { borderColor, backgroundColor: surface }]}>
          <SkeletonBlock width={92} height={72} borderRadius={8} />
          <SkeletonBlock width={72} height={12} borderRadius={6} />
        </ThemedView>
      ))}
    </ScrollView>
  );
}

export function CategoryListSkeleton({ count = 3 }: { count?: number }) {
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');

  return (
    <SkeletonCards
      count={count}
      listStyle={styles.productList}
      cardStyle={[styles.adminCategoryCard, { borderColor, backgroundColor: surface }]}
      renderCard={() => (
        <>
          <SkeletonBlock width="50%" height={16} />
          <SkeletonBlock width={96} height={96} borderRadius={12} />
          <SkeletonBlock width="100%" height={44} borderRadius={10} />
          <SkeletonBlock width="100%" height={44} borderRadius={10} />
        </>
      )}
    />
  );
}

export function ProductListSkeleton({ count = 4 }: { count?: number }) {
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');

  return (
    <SkeletonCards
      count={count}
      listStyle={styles.productList}
      cardStyle={[styles.productCard, { borderColor, backgroundColor: surface }]}
      renderCard={() => (
        <>
          <View style={styles.productRow}>
            <SkeletonBlock width={74} height={74} borderRadius={10} />
            <View style={styles.productInfo}>
              <SkeletonBlock width="70%" height={14} />
              <SkeletonBlock width="40%" height={14} />
              <SkeletonBlock width="55%" height={12} />
            </View>
          </View>
          <SkeletonBlock width="100%" height={44} borderRadius={10} />
        </>
      )}
    />
  );
}

export function ProfileFormSkeleton() {
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');

  return (
    <View style={styles.profileFormWrap}>
      <ThemedView style={[styles.profileFormCard, { borderColor, backgroundColor: surface }]}>
        <SkeletonBlock width="100%" height={44} borderRadius={10} />
        <View style={styles.profileNameRow}>
          <SkeletonBlock width="48%" height={44} borderRadius={10} />
          <SkeletonBlock width="48%" height={44} borderRadius={10} />
        </View>
        <SkeletonBlock width="100%" height={44} borderRadius={10} />
        <SkeletonBlock width="100%" height={44} borderRadius={10} />
        <SkeletonBlock width="100%" height={44} borderRadius={10} />
      </ThemedView>
      <SkeletonBlock width="100%" height={44} borderRadius={10} />
      <SkeletonBlock width="100%" height={44} borderRadius={10} />
    </View>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');

  return (
    <SkeletonCards
      count={count}
      listStyle={styles.productList}
      cardStyle={[styles.orderCard, { borderColor, backgroundColor: surface }]}
      renderCard={() => (
        <>
          <SkeletonBlock width="55%" height={16} />
          <SkeletonBlock width="35%" height={12} />
          <SkeletonBlock width="45%" height={12} />
          <SkeletonBlock width="80%" height={12} />
          <SkeletonBlock width="100%" height={36} borderRadius={8} />
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    gap: 10,
    paddingRight: 10,
  },
  categoryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    width: 108,
    gap: 8,
  },
  productList: {
    gap: 10,
  },
  productCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  productRow: {
    flexDirection: 'row',
    gap: 10,
  },
  productInfo: {
    flex: 1,
    gap: 8,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  profileFormWrap: {
    gap: 12,
    width: '100%',
  },
  profileFormCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  profileNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adminCategoryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
});
