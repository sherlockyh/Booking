import { useCallback, useRef, useState } from 'react';

interface UseRequestOptions<TData> {
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

  // 请求序号：并发/连点时只认最后一次请求，慢的旧响应不覆盖新状态
  const seqRef = useRef(0);

  const run = useCallback(
    async (...params: TParams) => {
      const seq = ++seqRef.current;
      setLoading(true);

      try {
        const result = await serviceRef.current(...params);

        if (seq !== seqRef.current) {
          // 期间又发起了新请求，本次结果已过期，只返回不落状态
          return result;
        }

        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } finally {
        if (seq === seqRef.current) {
          setLoading(false);
        }
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
