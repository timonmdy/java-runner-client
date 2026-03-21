// API type is fully inferred from the route definitions
import type { API, Environment } from '../main/ipc/_index';

declare global {
  interface Window {
    api: API;
    env: Environment;
  }
}
