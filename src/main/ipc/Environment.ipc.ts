import { BrowserWindow } from 'electron';
import { RouteMap } from '../core/IPCController';
import { getEnvironment, loadEnvironment } from '../core/JRCEnvironment';
import { toggleDevMode } from '../core/Store';
import { JRCEnvironment } from '../shared/types/App.types';

export const EnvironmentIPC = {
  get: {
    type: 'invoke',
    channel: 'env:get',
    handler: () => getEnvironment(),
  },

  reload: {
    type: 'send',
    channel: 'env:reload',
    handler: () => loadEnvironment(),
  },

  change: {
    type: 'on',
    channel: 'env:changed',
    args: {} as (env: JRCEnvironment) => void,
  },

  toggleDevMode: {
    type: 'invoke',
    channel: 'env:toggleDevMode',
    handler: (_e: Electron.IpcMainInvokeEvent, enabled: boolean) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (!win) return;

      toggleDevMode(enabled);
      loadEnvironment();

      if (!enabled) {
        win.webContents.closeDevTools();
      }
    },
  },
} satisfies RouteMap;
