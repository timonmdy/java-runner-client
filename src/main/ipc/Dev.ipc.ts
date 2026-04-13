import { app, BrowserWindow, shell } from 'electron';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { RouteMap } from '../core/IPCController';
import { getAllProfiles } from '../core/Store';
import { DEFAULT_SETTINGS } from '../shared/config/Settings.config';

let getWindow: () => BrowserWindow | null = () => null;

export function initDevIPC(windowGetter: () => BrowserWindow | null) {
  getWindow = windowGetter;
}

export const DevIPC = {
  getSysInfo: {
    type: 'invoke',
    channel: 'dev:getSysInfo',
    handler: () => ({
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      argv: process.argv,
      chromeVersion: process.versions.chrome,
      uptime: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    }),
  },

  resetStore: {
    type: 'invoke',
    channel: 'dev:resetStore',
    handler: async () => {
      // Remove all profiles and reset settings to defaults
      const profiles = getAllProfiles();
      const Store = (await import('electron-store')).default;
      const store = new Store({ name: 'java-runner-config' });
      store.set('profiles', []);
      store.set('settings', DEFAULT_SETTINGS);
    },
  },

  getStoreJson: {
    type: 'invoke',
    channel: 'dev:getStoreJson',
    handler: () => {
      const storePath = join(app.getPath('userData'), 'java-runner-config.json');
      try {
        return readFileSync(storePath, 'utf-8');
      } catch {
        return '{}';
      }
    },
  },

  openStoreFile: {
    type: 'invoke',
    channel: 'dev:openStoreFile',
    handler: () => {
      const storePath = join(app.getPath('userData'), 'java-runner-config.json');
      shell.showItemInFolder(storePath);
    },
  },
} satisfies RouteMap;
