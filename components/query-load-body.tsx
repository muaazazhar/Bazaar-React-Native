import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedLoader } from '@/components/themed-loader';

type Props = {
  isLoading: boolean;
  hasError: boolean;
  children: ReactNode;
  label?: string;
  skeleton?: ReactNode;
};

export function QueryLoadBody({ isLoading, hasError, children, label, skeleton }: Props) {
  if (isLoading) {
    return (
      <View style={styles.wrap}>
        {skeleton ?? <ThemedLoader label={label ?? 'Loading…'} />}
      </View>
    );
  }

  if (hasError) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
});
