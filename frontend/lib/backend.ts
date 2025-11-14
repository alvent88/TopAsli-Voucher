import { Client } from "~backend/client";

const getBaseURL = () => {
  if (import.meta.env.VITE_CLIENT_TARGET) {
    return import.meta.env.VITE_CLIENT_TARGET;
  }
  
  if (typeof window !== 'undefined') {
    return window.location.origin.replace('.lp.dev', '.api.lp.dev');
  }
  
  return 'http://localhost:4000';
};

const backend = new Client(getBaseURL(), {
  requestInit: {
    credentials: 'omit',
  }
});

export default backend;
