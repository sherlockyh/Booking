import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PageState {
  pageNo: number;
  pageSize: number;
}

interface PageResponse<T> {
  list: T[];
  total: number;
}

export function usePageRequest<TItem, TSearch extends object>(
  service: (params: PageState & TSearch) => Promise<PageResponse<TItem>>,
  initialSearch = {} as TSearch,
) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState<PageState>({ pageNo: 1, pageSize: 10 });
  const [search, setSearch] = useState<TSearch>(initialSearch);

  // 用 ref 持有 service，避免 service 引用变化导致 load 重建、useEffect 重复触发
  const serviceRef = useRef(service);
  serviceRef.current = service;

  const params = useMemo<PageState & TSearch>(
    () => ({ ...page, ...search }),
    [page, search],
  );

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const result = await serviceRef.current(params);
      setItems(result.list);
      setTotal(result.total);
    } catch {
      // 错误已由请求拦截器统一处理（弹 message 等）
    } finally {
      setLoading(false);
    }
  }, [params]);

  const submitSearch = useCallback((nextSearch: TSearch) => {
    setSearch(nextSearch);
    setPage((current) => ({ ...current, pageNo: 1 }));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    items,
    total,
    page,
    search,
    setPage,
    submitSearch,
    reload: load,
  };
}
