import { app, BrowserWindow, Input, Menu, nativeImage, Tray } from 'electron';
import fs from 'fs';
import path from 'path';
import { allRoutes, initDevIPC, initSystemIPC, initWindowIPC } from './ipc/_index';
import { EnvironmentIPC } from './ipc/Environment.ipc';
import { getEnvironment, loadEnvironment, shouldStartMinimized } from './JRCEnvironment';
import { processManager } from './ProcessManager';
import { restApiServer } from './RestAPI';
import { registerIPC } from './IPCController';
import { getAllProfiles, getSettings, syncLoginItem } from './Store';

loadEnvironment();

const RESOURCES =
  getEnvironment().type === 'dev'
    ? path.join(__dirname, '../../resources')
    : path.join(app.getAppPath(), 'resources');

function getIconImage(): Electron.NativeImage {
  const candidates =
    process.platform === 'win32' ? ['icon.ico', 'icon.png'] : ['icon.png', 'icon.ico'];
  for (const name of candidates) {
    const p = path.join(RESOURCES, name);
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) return img;
    }
  }
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  );
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let forceQuit = false;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#08090d',
    icon: getIconImage(),
    show: getEnvironment().startUpSource !== 'withSystem',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: true,
    },
  });

  if (getEnvironment().type === 'dev') mainWindow.loadURL('http://localhost:5173');
  else mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    const shouldStartHidden = shouldStartMinimized();
    if (shouldStartHidden) mainWindow?.hide();
    else mainWindow?.show();
  });

  mainWindow.on('close', (e) => {
    if (forceQuit) return;
    if (getSettings().minimizeToTray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  processManager.setWindow(mainWindow);
}

function createTray(): void {
  tray = new Tray(getIconImage().resize({ width: 16, height: 16 }));
  tray.setToolTip('Java Runner Client');
  updateTrayMenu();
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function updateTrayMenu(): void {
  if (!tray) return;
  const states = processManager.getStates();
  const profiles = getAllProfiles();
  const items = states.map((s) => ({
    label: `  ${profiles.find((p) => p.id === s.profileId)?.name ?? s.profileId}  (PID ${s.pid ?? '?'})`,
    enabled: false,
  }));
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open Java Runner Client',
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { type: 'separator' },
      ...(items.length > 0
        ? [...items, { type: 'separator' as const }]
        : [{ label: 'No processes running', enabled: false }, { type: 'separator' as const }]),
      {
        label: 'Quit',
        click: () => {
          forceQuit = true;
          app.quit();
        },
      },
    ])
  );
}

let devToolsPressCount = 0;
let devToolsTimer: NodeJS.Timeout | null = null;

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // If launched by the OS at login but the user has since disabled autostart, bail out.
    // This handles the edge case where the registry entry outlives the setting.
    if (getEnvironment().startUpSource === 'withSystem' && !getSettings().launchOnStartup) return;

    // Ensure the OS login item always reflects the stored setting
    syncLoginItem(getSettings().launchOnStartup, getSettings().startMinimized);

    createWindow();
    createTray();

    mainWindow?.webContents.on('before-input-event', handleBeforeInputEvent);

    // ── IPC ────────────────────────────────────────────────────────────────────
    initSystemIPC(() => mainWindow);
    initWindowIPC(
      () => mainWindow,
      () => {
        forceQuit = true;
      }
    );
    initDevIPC(() => mainWindow);
    registerIPC([...allRoutes]);
    registerIPC([EnvironmentIPC]);
    // ──────────────────────────────────────────────────────────────────────────

    const settings = getSettings();
    if (settings.restApiEnabled) restApiServer.start(settings.restApiPort);
    for (const p of getAllProfiles()) if (p.autoStart && p.jarPath) processManager.start(p);

    mainWindow?.webContents.on('did-finish-load', updateTrayMenu);
    processManager.setTrayUpdater(updateTrayMenu);
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

const handleBeforeInputEvent = (event: Electron.Event, input: Input) => {
  const isDevToolsShortcut =
    input.key === 'F12' ||
    (input.control && input.shift && input.key.toUpperCase() === 'I') ||
    (input.meta && input.alt && input.key.toUpperCase() === 'I');

  if (!isDevToolsShortcut) return;

  event.preventDefault();

  devToolsPressCount++;

  if (devToolsTimer) clearTimeout(devToolsTimer);
  devToolsTimer = setTimeout(() => (devToolsPressCount = 0), 1000);

  if (devToolsPressCount >= 7) {
    devToolsPressCount = 0;
    mainWindow?.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  if (getEnvironment().devMode) {
    mainWindow?.webContents.openDevTools();
  }
};
