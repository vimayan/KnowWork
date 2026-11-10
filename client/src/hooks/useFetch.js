import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch — generic async data loader
 * @param {Function} fn     — async fetcher, re-runs when deps change
 * @param {Array}    deps
 * @param {Object}   opts   — { skip: bool }
 */
export function useFetch(fn, deps = [], opts = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(!opts.skip);
  const [error,   setError]   = useState(null);
  const ctrl = useRef(null);

  const run = useCallback(async (...args) => {
    if (ctrl.current) ctrl.current.abort();
    ctrl.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      setData(result?.data ?? result ?? null);
      setLoading(false);
      return result;
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message || 'Something went wrong');
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!opts.skip) run();
    return () => ctrl.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run };
}

export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
