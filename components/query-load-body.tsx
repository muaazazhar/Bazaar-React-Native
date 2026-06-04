import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';

type Props = {
  isLoading: boolean;
  hasError: boolean;
  children: ReactNode;
};

export function QueryLoadBody({ isLoading, hasError, children }: Props) {
  return (
    <>
      {isLoading ? <ActivityIndicator /> : null}
      {!isLoading && !hasError ? children : null}
    </>
  );
}
