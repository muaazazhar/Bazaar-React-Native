import { useCallback, useMemo } from 'react';

import { flattenPaginatedPages, type PaginatedPage } from '@/utils/pagination';

type InfiniteListQuery<T> = {
  data?: { pages?: PaginatedPage<T>[] };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isUninitialized?: boolean;
  fetchNextPage: () => void | Promise<unknown>;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
};

export function usePaginatedInfiniteList<T>(query: InfiniteListQuery<T>) {
  const items = useMemo(() => flattenPaginatedPages(query.data?.pages), [query.data?.pages]);
  const isInitialLoading =
    Boolean(query.isUninitialized) ||
    query.isLoading ||
    (query.isFetching && items.length === 0 && !query.isError);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  return {
    items,
    isInitialLoading,
    loadMore,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
