import { Client } from "~backend/client";

const backend = new Client("https://gaming-top-up-platform-d3pg4ec82vjikj791feg.api.lp.dev", {
  requestInit: {
    credentials: 'include',
  }
});

export default backend;
