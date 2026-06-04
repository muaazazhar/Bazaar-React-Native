import { useMemo } from 'react';

import { getApiErrorDetails } from '@/utils/apiError';

type QueryLoadInput = {
  isError: boolean;
  error: unknown;
  fallback: string;
  isLoading: boolean;
};

export function useQueryLoadState({ isError, error, fallback, isLoading }: QueryLoadInput) {
  const errorMessage = useMemo(
    () => (isError ? getApiErrorDetails(error, fallback).message : null),
    [isError, error, fallback],
  );

  return {
    errorMessage,
    showSpinner: isLoading,
    showContent: !isLoading && !errorMessage,
  };
}

type MergedQueryInput = {
  queries: { isError: boolean; error: unknown }[];
  fallback: string;
  isLoading: boolean;
};

/** For screens that depend on multiple parallel queries (e.g. home catalog). */
export function useMergedQueryLoadState({ queries, fallback, isLoading }: MergedQueryInput) {
  const failed = queries.find((q) => q.isError);
  const errorMessage = useMemo(
    () => (failed ? getApiErrorDetails(failed.error, fallback).message : null),
    [failed, fallback],
  );

  return {
    errorMessage,
    showSpinner: isLoading,
    showContent: !isLoading && !errorMessage,
  };
}
