import { useCallback, useRef, useState } from 'react';

interface UseRequestOptions<TData> {
  manual?: boolean;
  onSuccess?: (data: TData) => void;
}

export function useRequest<TData, TParams extends unknown[]>(
  service: (...params: TParams) => Promise<TData>,
  options?: UseRequestOptions<TData>,
) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TData>();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // 用 ref 持有 service，避免 service 引用变化导致 run 重建
  const serviceRef = useRef(service);
  serviceRef.current = service;

  const run = useCallback(
    async (...params: TParams) => {
      setLoading(true);

      try {
        const result = await serviceRef.current(...params);
        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    data,
    loading,
    run,
  };
}
