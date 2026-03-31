import { BrowserWindow, Menu, Tray } from 'electron';
import { getIconImage } from './AppIcon';
import { processManager } from './process/ProcessManager';
import { getAllProfiles } from './Store';

let tray: Tray | null = null;

export function createTray(getWindow: () => BrowserWindow | null, onQuit: () => void): void {
  tray = new Tray(getIconImage().resize({ width: 16, height: 16 }));
  tray.setToolTip('Java Runner Client');
  updateTrayMenu(getWindow, onQuit);
  tray.on('double-click', () => {
    const win = getWindow();
    win?.show();
    win?.focus();
  });
}

export function updateTrayMenu(getWindow: () => BrowserWindow | null, onQuit: () => void): void {
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
          const win = getWindow();
          win?.show();
          win?.focus();
        },
      },
      { type: 'separator' },
      ...(items.length > 0
        ? [...items, { type: 'separator' as const }]
        : [{ label: 'No processes running', enabled: false }, { type: 'separator' as const }]),
      {
        label: 'Quit',
        click: onQuit,
      },
    ])
  );
}
