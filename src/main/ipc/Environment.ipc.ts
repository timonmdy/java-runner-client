import { BrowserWindow } from 'electron'
import { getEnvironment, loadEnvironment } from '../JRCEnvironment'
import { RouteMap } from '../IPCController'
import { JRCEnvironment } from '../shared/types/App.types'
import { toggleDevMode } from '../Store'

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
      const win = BrowserWindow.getAllWindows()[0]
      if (!win) return

      toggleDevMode(enabled)
      loadEnvironment()

      if (!enabled) {
        win.webContents.closeDevTools()
      }
    },
  },
} satisfies RouteMap
