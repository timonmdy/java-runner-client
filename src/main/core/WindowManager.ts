import { BrowserWindow } from 'electron';
import path from 'path';
import { ALL_THEMES, BUILTIN_THEME } from '../shared/config/themes/Theme.config';
import { getIconImage } from './AppIcon';
import { getEnvironment, shouldStartMinimized } from './JRCEnvironment';
import { getSettings } from './Store';

export function createWindow(onClose: (e: Electron.Event) => void): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: (ALL_THEMES.find((t) => t.id === getSettings().themeId) ?? BUILTIN_THEME)
      .colors['base-950'],
    icon: getIconImage(),
    show: getEnvironment().startUpSource !== 'withSystem',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: true,
    },
  });

  if (getEnvironment().type === 'dev') win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '../../renderer/index.html'));

  win.once('ready-to-show', () => {
    if (shouldStartMinimized()) win.hide();
    else win.show();
  });

  win.on('close', onClose);

  return win;
}
