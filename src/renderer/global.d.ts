// API type is fully inferred from the route definitions
import type { API, Environment } from '../main/ipc/_index';

declare global {
  interface Window {
    jrc: { api: API; env: Environment };
  }

  const jrc: { api: API; env: Environment };
}
