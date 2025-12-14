import { useCallback, useEffect, useState } from 'react';
import debounce from 'debounce';
import { httpErrorToHuman } from '@/api/axios.ts';
import { useToast } from '@/providers/ToastProvider.tsx';

interface UseSearchableResourceOptions<T> {
  fetcher: (search: string) => Promise<ResponseMeta<T>>;
  defaultSearchValue?: string;
  deps?: unknown[];
  debounceMs?: number;
}

export function useSearchableResource<T>({
  fetcher,
  defaultSearchValue = '',
  deps = [],
  debounceMs = 150,
}: UseSearchableResourceOptions<T>) {
  const { addToast } = useToast();

  const [items, setItems] = useState<T[]>([]);
  const [search, setSearch] = useState(defaultSearchValue);

  const fetchData = (searchValue: string) => {
    fetcher(searchValue)
      .then((response) => {
        setItems(response.data);
      })
      .catch((err) => {
        addToast(httpErrorToHuman(err), 'error');
      });
  };

  const setDebouncedSearch = useCallback(
    debounce((s: string) => fetchData(s), debounceMs),
    deps,
  );

  useEffect(() => {
    setDebouncedSearch(search);
  }, [search, setDebouncedSearch]);

  useEffect(() => {
    if (deps.filter((d) => !!d).length !== deps.length) {
      return;
    }

    fetchData(defaultSearchValue);
  }, deps);

  return { items, search, setSearch, refetch: () => fetchData(search) };
}
