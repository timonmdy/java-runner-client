import { app } from 'electron'
import type { RouteMap } from '../shared/IPCController'
import { getSettings } from '../store'

// Injected from main.ts — avoids a circular import on mainWindow/forceQuit
let getWindow: () => Electron.BrowserWindow | null = () => null
let setForceQuit: () => void = () => { }

export function initWindowIPC(
  windowGetter: () => Electron.BrowserWindow | null,
  forceQuitSetter: () => void,
) {
  getWindow = windowGetter
  setForceQuit = forceQuitSetter
}

export const WindowIPC = {
  minimizeWindow: { type: 'send', channel: 'window:minimize', handler: () => getWindow()?.minimize() },

  closeWindow: {
    type: 'send',
    channel: 'window:close',
    handler: () => {
      if (getSettings().minimizeToTray) getWindow()?.hide()
      else { setForceQuit(); app.quit() }
    },
  },
} satisfies RouteMap
