import { contextBridge } from 'electron';
import { allRoutes } from './ipc/_index';
import { EnvironmentIPC } from './ipc/Environment.ipc';
import { buildPreloadAPI } from './IPCController';

// Apply the stored theme background before React renders to avoid a flash of the wrong color.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  const bg = g.localStorage?.getItem('jrc:theme-bg');
  if (bg) g.document.documentElement.style.background = bg;
} catch {
  /* ignore */
}

contextBridge.exposeInMainWorld('api', buildPreloadAPI([...allRoutes]));

contextBridge.exposeInMainWorld('env', buildPreloadAPI([EnvironmentIPC]));
