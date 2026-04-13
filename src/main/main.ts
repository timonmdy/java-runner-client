import { app, BrowserWindow } from 'electron';
import { handleBeforeInput } from './core/DevToolsGuard';
import { registerIPC } from './core/IPCController';
import { loadEnvironment } from './core/JRCEnvironment';
import { processManager } from './core/process/ProcessManager';
import { restApiServer } from './core/RestAPI';
import { getAllProfiles, getSettings, syncLoginItem } from './core/Store';
import { createTray, updateTrayMenu } from './core/TrayManager';
import { createWindow } from './core/WindowManager';
import { allRoutes, initDevIPC, initSystemIPC, initWindowIPC } from './ipc/_index';
import { EnvironmentIPC } from './ipc/Environment.ipc';
import { hasJarConfigured } from './shared/types/Profile.types';

loadEnvironment();

if (process.platform === 'win32') {
  app.setAppUserModelId('Java Runner Client');
}

let mainWindow: BrowserWindow | null = null;
let forceQuit = false;

const getWindow = () => mainWindow;
const doForceQuit = () => {
  forceQuit = true;
  app.quit();
};

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    if (argv.includes('--autostart')) return;
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    const settings = getSettings();

    // If launched by the OS at login but the user has since disabled autostart, bail out.
    if (settings.launchOnStartup === false && process.argv.includes('--autostart')) return;

    syncLoginItem(settings.launchOnStartup, settings.startMinimized);

    mainWindow = createWindow((e) => {
      if (forceQuit) return;
      if (getSettings().minimizeToTray) {
        e.preventDefault();
        mainWindow?.hide();
      }
    });

    processManager.setWindow(mainWindow);
    createTray(getWindow, doForceQuit);

    mainWindow.webContents.on('before-input-event', (event, input) => {
      handleBeforeInput(event, input, mainWindow!);
    });

    // IPC registration
    initSystemIPC(getWindow);
    initWindowIPC(getWindow, () => {
      forceQuit = true;
    });
    initDevIPC(getWindow);
    registerIPC([...allRoutes]);
    registerIPC([EnvironmentIPC]);

    // Auto-start REST API and processes
    if (settings.restApiEnabled) restApiServer.start(settings.restApiPort);
    for (const p of getAllProfiles()) {
      if (p.autoStart && hasJarConfigured(p)) processManager.start(p);
    }

    mainWindow.webContents.on('did-finish-load', () => updateTrayMenu(getWindow, doForceQuit));
    processManager.setTrayUpdater(() => updateTrayMenu(getWindow, doForceQuit));
  });
}

app.on('window-all-closed', () => {
  /* keep alive in tray */
});
app.on('before-quit', () => {
  forceQuit = true;
});
app.on('activate', () => {
  mainWindow?.show();
});
