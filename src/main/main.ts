import { app, BrowserWindow, Tray, Menu, ipcMain, dialog, nativeImage } from 'electron'
import path from 'path'
import fs   from 'fs'
import { IPC } from './shared/types'
import { getAllProfiles, saveProfile, deleteProfile, getSettings, saveSettings } from './store'
import { processManager } from './processManager'

// ── Constants ─────────────────────────────────────────────────────────────────

const IS_DEV    = !app.isPackaged
const RESOURCES = IS_DEV
  ? path.join(__dirname, '../../resources')
  : path.join(process.resourcesPath, 'resources')

/**
 * Load the best available icon.
 * Priority: .ico → .png → 1×1 transparent fallback.
 */
function getIconImage(): Electron.NativeImage {
  for (const name of ['icon.ico', 'icon.png']) {
    const p = path.join(RESOURCES, name)
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p)
      if (!img.isEmpty()) return img
    }
  }
  // 1×1 transparent PNG as last resort so Tray never throws
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  )
}

// ── State ─────────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
/** When true, the next 'close' event should actually quit (triggered from tray menu) */
let forceQuit = false

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow(): void {
  const settings = getSettings()

  mainWindow = new BrowserWindow({
    width:           1200,
    height:          760,
    minWidth:        900,
    minHeight:       600,
    frame:           false,
    backgroundColor: '#08090d',
    icon:            getIconImage(),
    // In dev mode always show the window immediately so devs don't think it hung
    show: IS_DEV ? true : !settings.startMinimized,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  if (IS_DEV) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  processManager.setWindow(mainWindow)

  mainWindow.on('close', (e) => {
    if (forceQuit) return        // let it close and quit
    if (getSettings().minimizeToTray) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function createTray(): void {
  const icon = getIconImage()
  // On Windows the tray expects a small icon; resize to 16 px
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('Java Runner Client')
  updateTrayMenu()
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus() })
}

function updateTrayMenu(): void {
  if (!tray) return

  const states    = processManager.getStates()
  const profiles  = getAllProfiles()

  const runningItems = states.map(s => {
    const profile = profiles.find(p => p.id === s.profileId)
    return {
      label:   `  ${profile?.name ?? s.profileId}  (PID ${s.pid ?? '?'})`,
      enabled: false,
    }
  })

  const menu = Menu.buildFromTemplate([
    { label: 'Open Java Runner Client', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { type:  'separator' },
    ...(runningItems.length > 0
      ? [{ label: 'Running:', enabled: false }, ...runningItems, { type: 'separator' as const }]
      : []
    ),
    {
      label: 'Quit',
      click: () => {
        forceQuit = true
        app.quit()
      },
    },
  ])
  tray.setContextMenu(menu)
}

// ── Startup (Windows) ─────────────────────────────────────────────────────────

function applyStartupSetting(enabled: boolean): void {
  app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: getSettings().startMinimized })
}

// ── IPC ───────────────────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  // Profiles
  ipcMain.handle(IPC.PROFILES_GET_ALL, () => getAllProfiles())
  ipcMain.handle(IPC.PROFILES_SAVE,    (_, p)  => { saveProfile(p);   return true })
  ipcMain.handle(IPC.PROFILES_DELETE,  (_, id) => { deleteProfile(id); return true })

  // Process control
  ipcMain.handle(IPC.PROCESS_START,      (_, p)           => processManager.start(p))
  ipcMain.handle(IPC.PROCESS_STOP,       (_, id)          => processManager.stop(id))
  ipcMain.handle(IPC.PROCESS_SEND_INPUT, (_, id, input)   => processManager.sendInput(id, input))
  ipcMain.handle(IPC.PROCESS_GET_STATES, ()               => processManager.getStates())

  // Utilities
  ipcMain.handle(IPC.PROCESS_GET_LOG,       ()          => processManager.getActivityLog())
  ipcMain.handle(IPC.PROCESS_CLEAR_LOG,     ()          => { processManager.clearActivityLog(); return true })
  ipcMain.handle(IPC.PROCESS_SCAN_ALL,      ()          => processManager.scanAllProcesses())
  ipcMain.handle(IPC.PROCESS_KILL_PID,      (_, pid)    => processManager.killPid(pid))
  ipcMain.handle(IPC.PROCESS_KILL_ALL_JAVA, ()          => processManager.killAllJava())

  // Settings
  ipcMain.handle(IPC.SETTINGS_GET,  () => getSettings())
  ipcMain.handle(IPC.SETTINGS_SAVE, (_, s) => { saveSettings(s); applyStartupSetting(s.launchOnStartup); return true })

  // File dialogs
  ipcMain.handle(IPC.DIALOG_PICK_JAR, async () => {
    const r = await dialog.showOpenDialog(mainWindow!, { title: 'Select JAR file', filters: [{ name: 'Java Archives', extensions: ['jar'] }], properties: ['openFile'] })
    return r.canceled ? null : r.filePaths[0]
  })
  ipcMain.handle(IPC.DIALOG_PICK_DIR, async () => {
    const r = await dialog.showOpenDialog(mainWindow!, { title: 'Select working directory', properties: ['openDirectory'] })
    return r.canceled ? null : r.filePaths[0]
  })
  ipcMain.handle(IPC.DIALOG_PICK_JAVA, async () => {
    const r = await dialog.showOpenDialog(mainWindow!, { title: 'Select Java executable', properties: ['openFile'] })
    return r.canceled ? null : r.filePaths[0]
  })

  // Window controls
  ipcMain.on(IPC.WINDOW_MINIMIZE, () => mainWindow?.minimize())
  ipcMain.on(IPC.WINDOW_CLOSE,    () => {
    if (getSettings().minimizeToTray) mainWindow?.hide()
    else { forceQuit = true; mainWindow?.close() }
  })
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  createTray()
  registerIpcHandlers()

  const profiles = getAllProfiles()
  for (const p of profiles) {
    if (p.autoStart && p.jarPath) processManager.start(p)
  }

  applyStartupSetting(getSettings().launchOnStartup)
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

// When forceQuit is false this fires only if minimizeToTray is false and the
// window is actually closed via the OS close button with no tray fallback.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Refresh tray menu every 5 s so running process names stay current
setInterval(updateTrayMenu, 5000)
