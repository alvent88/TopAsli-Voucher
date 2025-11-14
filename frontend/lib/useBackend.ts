import backend from "~backend/client";

const customFetcher: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  const options = typeof input === 'string' ? init : input;
  
  const headers = new Headers(options?.headers || {});
  headers.set('Accept', 'application/json');
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    mode: 'cors',
  });
  
  return response;
};

export function useBackend() {
  const token = sessionStorage.getItem("authToken");
  
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
}
