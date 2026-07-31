import { useState, useCallback } from "react";
import { normalizeError, type AppError } from "../lib/errors.js";

export function useApi<T, Args extends any[]>(
  apiFn: (...args: Args) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args: Args): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFn(...args);
        setData(res);
        return res;
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [apiFn]
  );

  return {
    data,
    error,
    loading,
    execute,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    },
  };
}
