import { app, dialog, shell } from 'electron';
import { restApiServer } from '../RestAPI';
import type { RouteMap } from '../IPCController';
import type { AppSettings, JRCEnvironment } from '../shared/types/App.types';
import { getSettings, saveSettings } from '../Store';
import { getEnvironment } from './../JRCEnvironment';

// mainWindow is needed for dialogs — set via initSystemIPC() called from main.ts
let getWindow: () => Electron.BrowserWindow | null = () => null;
export function initSystemIPC(windowGetter: () => Electron.BrowserWindow | null) {
  getWindow = windowGetter;
}

export const SystemIPC = {
  getSettings: { type: 'invoke', channel: 'settings:get', handler: () => getSettings() },

  saveSettings: {
    type: 'invoke',
    channel: 'settings:save',
    handler: (_e: any, next: AppSettings) => {
      const prev = getSettings();
      saveSettings(next);
      if (!next.restApiEnabled && prev.restApiEnabled) restApiServer.stop();
      else if (next.restApiEnabled && !prev.restApiEnabled) restApiServer.start(next.restApiPort);
      else if (next.restApiEnabled && next.restApiPort !== prev.restApiPort) {
        restApiServer.stop();
        restApiServer.start(next.restApiPort);
      }
    },
  },

  pickJar: {
    type: 'invoke',
    channel: 'dialog:pickJar',
    handler: async () => {
      const r = await dialog.showOpenDialog(getWindow()!, {
        filters: [{ name: 'JAR', extensions: ['jar'] }],
        properties: ['openFile'],
      });
      return r.canceled ? null : r.filePaths[0];
    },
  },
  pickDir: {
    type: 'invoke',
    channel: 'dialog:pickDir',
    handler: async () => {
      const r = await dialog.showOpenDialog(getWindow()!, { properties: ['openDirectory'] });
      return r.canceled ? null : r.filePaths[0];
    },
  },
  pickJava: {
    type: 'invoke',
    channel: 'dialog:pickJava',
    handler: async () => {
      const r = await dialog.showOpenDialog(getWindow()!, {
        filters: [{ name: 'Executable', extensions: ['exe', '*'] }],
        properties: ['openFile'],
      });
      return r.canceled ? null : r.filePaths[0];
    },
  },

  openExternal: {
    type: 'invoke',
    channel: 'shell:openExternal',
    handler: (_e: any, url: string) => shell.openExternal(url),
  },

  openConfigFolder: {
    type: 'invoke',
    channel: 'shell:openConfigFolder',
    handler: () => shell.openPath(app.getPath('userData')),
  },
} satisfies RouteMap;
