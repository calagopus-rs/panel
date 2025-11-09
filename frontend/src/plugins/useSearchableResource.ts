import { useCallback, useEffect, useState } from 'react';
import debounce from 'debounce';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';

interface UseSearchableResourceOptions<T> {
  fetcher: (search: string) => Promise<ResponseMeta<T>>;
  deps?: unknown[];
  debounceMs?: number;
}

export function useSearchableResource<T>({ fetcher, deps = [], debounceMs = 150 }: UseSearchableResourceOptions<T>) {
  const { addToast } = useToast();

  const [items, setItems] = useState<T[]>([]);
  const [search, setSearch] = useState('');
  const [doRefetch, setDoRefetch] = useState(false);

  const fetchData = (searchValue: string) => {
    fetcher(searchValue)
      .then((response) => {
        setItems(response.data);
        if (response.total > response.data.length) {
          setDoRefetch(true);
        }
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
    if (doRefetch) {
      setDebouncedSearch(search);
    }
  }, [search, doRefetch, setDebouncedSearch]);

  useEffect(() => {
    if (deps.filter((d) => !!d).length !== deps.length) {
      return;
    }

    fetchData('');
  }, deps);

  return { items, search, setSearch, doRefetch, setDoRefetch, refetch: () => fetchData(search) };
}
