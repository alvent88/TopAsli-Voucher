import backend from "~backend/client";
import { useMemo } from "react";

export function useBackend() {
  const token = sessionStorage.getItem("authToken");
  
  return useMemo(() => {
    if (!token) {
      return backend;
    }
    
    return backend.with({
      auth: async () => {
        return { authorization: `Bearer ${token}` };
      },
    });
  }, [token]);
}
