import backend from "~backend/client";
import { useMemo } from "react";

const customFetcher: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
  const options: RequestInit = typeof input === 'string' ? (init || {}) : (input instanceof Request ? input : {});
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  
  const method = options.method || 'GET';
  if (!headers.has('Content-Type') && method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }
  
  const requestConfig: RequestInit = {
    ...options,
    headers: Object.fromEntries(headers.entries()),
    credentials: 'same-origin',
    mode: 'cors',
  };
  
  try {
    const response = await fetch(url, requestConfig);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export function useBackend() {
  const token = sessionStorage.getItem("authToken");
  
  return useMemo(() => {
    if (!token) {
      return backend.with({
        fetcher: customFetcher,
      });
    }
    
    return backend.with({
      fetcher: customFetcher,
      auth: async () => {
        return { authorization: `Bearer ${token}` };
      },
    });
  }, [token]);
}
