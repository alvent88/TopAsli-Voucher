import backend from "~backend/client";

export function useBackend() {
  const token = sessionStorage.getItem("authToken");
  
  if (!token) {
    return backend;
  }
  
  return backend.with({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
