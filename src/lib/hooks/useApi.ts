import { useState, useEffect } from 'react';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationInfo;
}

function authHeader(): { Authorization?: string } | null {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') || '' : '';
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export function useApiCall<T>(
  url: string,
  options?: RequestInit,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const authHeaders = authHeader();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (authHeaders?.Authorization) {
          headers.Authorization = authHeaders.Authorization;
        }
        
        if (options?.headers) {
          Object.assign(headers, options.headers);
        }

        const response = await fetch(url, {
          headers,
          ...options,
        });

        const result: ApiResponse<T> = await response.json();

        if (isMounted) {
          if (result.error) {
            setError(result.error);
            setData(null);
          } else {
            setData(result.data || null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, loading, error };
}

export function useApiMutation<TData, TVariables = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    url: string,
    variables?: TVariables,
    options?: RequestInit
  ): Promise<TData | null> => {
    setLoading(true);
    setError(null);

    try {
      const authHeaders = authHeader();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authHeaders?.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      
      if (options?.headers) {
        Object.assign(headers, options.headers);
      }

      const response = await fetch(url, {
        method: options?.method || 'POST',
        headers,
        body: variables ? JSON.stringify(variables) : options?.body,
        ...options,
      });

      const result: ApiResponse<TData> = await response.json();

      if (result.error) {
        setError(result.error);
        return null;
      }

      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}