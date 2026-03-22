import { app, BrowserWindow } from 'electron';
import { EnvironmentIPC } from './ipc/Environment.ipc';
import { JRCEnvironment } from './shared/types/App.types';
import { getSettings } from './Store';

let env: JRCEnvironment = {
  isReady: false,
  devMode: null as unknown as JRCEnvironment['devMode'],
  type: null as unknown as JRCEnvironment['type'],
  startUpSource: null as unknown as JRCEnvironment['startUpSource'],
};

export function loadEnvironment() {
  env = {
    isReady: true,
    devMode: getSettings().devModeEnabled,
    type: app.isPackaged ? 'prod' : 'dev',
    startUpSource: detectStartupSource(),
  };

  broadcast();
}

export function getEnvironment() {
  return env;
}

export function shouldStartMinimized(): boolean {
  return process.argv.includes('--minimized');
}

function broadcast(channel: string = EnvironmentIPC.change.channel) {
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(channel, env));
}

function detectStartupSource(): JRCEnvironment['startUpSource'] {
  if (!app.isPackaged) return 'development';

  const login = app.getLoginItemSettings();

  if (login.wasOpenedAtLogin || process.argv.includes('--autostart')) return 'withSystem';

  return 'userRequest';
}
