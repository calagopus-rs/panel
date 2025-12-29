import debounce from 'debounce';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { httpErrorToHuman } from '@/api/axios.ts';
import { useToast } from '@/providers/ToastProvider.tsx';

interface UseSearchablePaginatedTableOptions<T> {
  fetcher: (page: number, search: string) => Promise<ResponseMeta<T>>;
  setStoreData: (data: ResponseMeta<T>) => void;
  deps?: unknown[];
  debounceMs?: number;
  initialPage?: number;
  modifyParams?: boolean;
}

export function useSearchablePaginatedTable<T>({
  fetcher,
  setStoreData,
  deps = [],
  debounceMs = 150,
  initialPage = 1,
  modifyParams = true,
}: UseSearchablePaginatedTableOptions<T>) {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(modifyParams ? searchParams.get('search') || '' : '');
  const [page, setPage] = useState(modifyParams ? Number(searchParams.get('page')) || initialPage : initialPage);

  useEffect(() => {
    if (modifyParams) {
      setSearchParams({ page: page.toString(), search });
    }
  }, [modifyParams, page, search]);

  const fetchData = useCallback(
    (p: number, s: string) => {
      setLoading(true);
      fetcher(p, s)
        .then((res) => {
          setStoreData(res);
        })
        .catch((err) => {
          addToast(httpErrorToHuman(err), 'error');
        })
        .finally(() => setLoading(false));
    },
    [addToast, setStoreData, ...deps],
  );

  const debouncedSearch = useCallback(
    debounce((search: string) => fetchData(page, search), debounceMs),
    [page, fetchData],
  );

  useEffect(() => {
    if (search) {
      debouncedSearch(search);
    } else {
      fetchData(page, '');
    }
  }, [page, search, debouncedSearch]);

  return {
    loading,
    search,
    setSearch,
    page,
    setPage,
    refetch: () => fetchData(page, search),
  };
}
