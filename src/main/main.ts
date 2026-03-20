import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import { getAllProfiles, getSettings } from './Store'
import { processManager } from './ProcessManager'
import { restApiServer } from './RestAPI'
import { registerIPC } from './shared/IPCController'
import { allRoutes, initSystemIPC, initWindowIPC } from './ipc/_index'

const IS_DEV = !app.isPackaged
const RESOURCES = IS_DEV
  ? path.join(__dirname, '../../resources')
  : path.join(app.getAppPath(), 'resources')
const isActiveLaunch =
  !process.argv.includes('--hidden') && !process.argv.includes('--squirrel-firstrun')
const DEBUG = true

const actualLog = console.log
console.log =
  IS_DEV && DEBUG ? (...args) => actualLog(`[${new Date().toISOString()}]`, ...args) : () => {}

function getIconImage(): Electron.NativeImage {
  const candidates =
    process.platform === 'win32' ? ['icon.ico', 'icon.png'] : ['icon.png', 'icon.ico']
  for (const name of candidates) {
    const p = path.join(RESOURCES, name)
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p)
      if (!img.isEmpty()) return img
    }
  }
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  )
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let forceQuit = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#08090d',
    icon: getIconImage(),
    show: IS_DEV ? true : false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (IS_DEV) mainWindow.loadURL('http://localhost:5173')
  else mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  mainWindow.once('ready-to-show', () => {
    const shouldStartHidden = getSettings().startMinimized && !IS_DEV && !isActiveLaunch
    if (shouldStartHidden) mainWindow?.hide()
    else mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    if (forceQuit) return
    if (getSettings().minimizeToTray && !isActiveLaunch) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  processManager.setWindow(mainWindow)
}

function createTray(): void {
  tray = new Tray(getIconImage().resize({ width: 16, height: 16 }))
  tray.setToolTip('Java Runner Client')
  updateTrayMenu()
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

function updateTrayMenu(): void {
  if (!tray) return
  const states = processManager.getStates()
  const profiles = getAllProfiles()
  const items = states.map((s) => ({
    label: `  ${profiles.find((p) => p.id === s.profileId)?.name ?? s.profileId}  (PID ${s.pid ?? '?'})`,
    enabled: false,
  }))
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open Java Runner Client',
        click: () => {
          mainWindow?.show()
          mainWindow?.focus()
        },
      },
      { type: 'separator' },
      ...(items.length > 0
        ? [...items, { type: 'separator' as const }]
        : [{ label: 'No processes running', enabled: false }, { type: 'separator' as const }]),
      {
        label: 'Quit',
        click: () => {
          forceQuit = true
          app.quit()
        },
      },
    ])
  )
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    createWindow()
    createTray()

    // ── IPC ────────────────────────────────────────────────────────────────────
    initSystemIPC(() => mainWindow)
    initWindowIPC(
      () => mainWindow,
      () => {
        forceQuit = true
      }
    )
    registerIPC([...allRoutes])
    // ──────────────────────────────────────────────────────────────────────────

    const settings = getSettings()
    if (settings.restApiEnabled) restApiServer.start(settings.restApiPort)
    for (const p of getAllProfiles()) if (p.autoStart && p.jarPath) processManager.start(p)

    mainWindow?.webContents.on('did-finish-load', updateTrayMenu)
    processManager.setTrayUpdater(updateTrayMenu)
  })
}

app.on('window-all-closed', () => {
  /* keep alive in tray */
})
app.on('before-quit', () => {
  forceQuit = true
})
app.on('activate', () => {
  mainWindow?.show()
})
