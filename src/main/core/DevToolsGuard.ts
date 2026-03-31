import { BrowserWindow, Input } from 'electron';
import { getEnvironment } from './JRCEnvironment';

const REQUIRED_PRESSES = 7;
const RESET_DELAY_MS = 1000;

let pressCount = 0;
let timer: NodeJS.Timeout | null = null;

function isDevToolsShortcut(input: Input): boolean {
  return (
    input.key === 'F12' ||
    (input.control && input.shift && input.key.toUpperCase() === 'I') ||
    (input.meta && input.alt && input.key.toUpperCase() === 'I')
  );
}

function isInspectElementShortcut(input: Input): boolean {
  return (
    (input.control && input.shift && input.key.toUpperCase() === 'C') ||
    (input.meta && input.alt && input.key.toUpperCase() === 'C')
  );
}

function toggleDevTools(window: BrowserWindow): void {
  if (window.webContents.isDevToolsOpened()) {
    window.webContents.closeDevTools();
  } else {
    window.webContents.openDevTools();
  }
}

export function handleBeforeInput(
  event: Electron.Event,
  input: Input,
  window: BrowserWindow
): void {
  // Ctrl+Shift+C — toggle devtools with element-select mode (devMode only)
  if (isInspectElementShortcut(input)) {
    if (!getEnvironment().devMode) return;
    event.preventDefault();

    if (window.webContents.isDevToolsOpened()) {
      window.webContents.devToolsWebContents?.executeJavaScript(
        'DevToolsAPI.enterInspectElementMode()'
      );
    } else {
      window.webContents.once('devtools-opened', () => {
        window.webContents.devToolsWebContents?.executeJavaScript(
          'DevToolsAPI.enterInspectElementMode()'
        );
      });
      window.webContents.openDevTools();
    }

    return;
  }

  if (!isDevToolsShortcut(input)) return;

  event.preventDefault();

  pressCount++;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => (pressCount = 0), RESET_DELAY_MS);

  // 7x press — force open detached (even without devMode)
  if (pressCount >= REQUIRED_PRESSES) {
    pressCount = 0;
    window.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  if (getEnvironment().devMode) {
    toggleDevTools(window);
  }
}
