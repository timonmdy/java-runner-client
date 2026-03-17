import { app, BrowserWindow, Tray, Menu, ipcMain, dialog, nativeImage } from 'electron'
import path from 'path'
import fs   from 'fs'
import { IPC } from './shared/types'
import { getAllProfiles, saveProfile, deleteProfile, getSettings, saveSettings } from './store'
import { processManager } from './processManager'

const IS_DEV    = !app.isPackaged
const RESOURCES = IS_DEV ? path.join(__dirname, '../../resources') : path.join(process.resourcesPath, 'resources')

function getIconImage(): Electron.NativeImage {
  for (const name of ['icon.ico', 'icon.png']) {
    const p = path.join(RESOURCES, name)
    if (fs.existsSync(p)) { const img = nativeImage.createFromPath(p); if (!img.isEmpty()) return img }
  }
  return nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let forceQuit = false

function createWindow(): void {
  const settings = getSettings()
  const isHidden = process.argv.includes('--hidden')

  mainWindow = new BrowserWindow({
    width: 1200, height: 760, minWidth: 900, minHeight: 600,
    frame: false, backgroundColor: '#08090d', icon: getIconImage(),
    show: IS_DEV ? true : false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false },
  })

  if (IS_DEV) mainWindow.loadURL('http://localhost:5173')
  else        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  mainWindow.once('ready-to-show', () => {
    if (isHidden || (settings.startMinimized && !IS_DEV)) mainWindow?.hide()
    else mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    if (forceQuit) return
    if (getSettings().minimizeToTray) { e.preventDefault(); mainWindow?.hide() }
  })

  processManager.setWindow(mainWindow)
}

function createTray(): void {
  tray = new Tray(getIconImage().resize({ width: 16, height: 16 }))
  tray.setToolTip('Java Runner Client')
  updateTrayMenu()
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus() })
}

function updateTrayMenu(): void {
  if (!tray) return
  const states   = processManager.getStates()
  const profiles = getAllProfiles()
  const items = states.map(s => ({
    label: `  ${profiles.find(p => p.id === s.profileId)?.name ?? s.profileId}  (PID ${s.pid ?? '?'})`,
    enabled: false,
  }))
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Java Runner Client', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { type: 'separator' },
    ...(items.length > 0
      ? [...items, { type: 'separator' as const }]
      : [{ label: 'No processes running', enabled: false }, { type: 'separator' as const }]),
    { label: 'Quit', click: () => { forceQuit = true; app.quit() } },
  ]))
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  // ── IPC handlers ────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.PROFILES_GET_ALL, () => getAllProfiles())

  ipcMain.handle(IPC.PROFILES_SAVE, (_e, profile) => {
    saveProfile(profile)
    // Keep processManager snapshot in sync so auto-restart uses latest config
    processManager.updateProfileSnapshot(profile)
  })

  ipcMain.handle(IPC.PROFILES_DELETE,      (_e, id)      => deleteProfile(id))
  ipcMain.handle(IPC.PROCESS_START,        (_e, profile) => processManager.start(profile))
  ipcMain.handle(IPC.PROCESS_STOP,         (_e, id)      => processManager.stop(id))
  ipcMain.handle(IPC.PROCESS_SEND_INPUT,   (_e, id, inp) => processManager.sendInput(id, inp))
  ipcMain.handle(IPC.PROCESS_GET_STATES,   ()            => processManager.getStates())
  ipcMain.handle(IPC.PROCESS_GET_LOG,      ()            => processManager.getActivityLog())
  ipcMain.handle(IPC.PROCESS_CLEAR_LOG,    ()            => processManager.clearActivityLog())
  ipcMain.handle(IPC.PROCESS_SCAN_ALL,     ()            => processManager.scanAllProcesses())
  ipcMain.handle(IPC.PROCESS_KILL_PID,     (_e, pid)     => processManager.killPid(pid))
  ipcMain.handle(IPC.PROCESS_KILL_ALL_JAVA,()            => processManager.killAllJava())
  ipcMain.handle(IPC.SETTINGS_GET,         ()            => getSettings())
  ipcMain.handle(IPC.SETTINGS_SAVE,        (_e, s)       => saveSettings(s))

  ipcMain.handle(IPC.DIALOG_PICK_JAR, async () => {
    const r = await dialog.showOpenDialog(mainWindow!, { filters: [{ name: 'JAR', extensions: ['jar'] }], properties: ['openFile'] })
    return r.canceled ? null : r.filePaths[0]
  })
  ipcMain.handle(IPC.DIALOG_PICK_DIR, async () => {
    const r = await dialog.showOpenDialog(mainWindow!, { properties: ['openDirectory'] })
    return r.canceled ? null : r.filePaths[0]
  })
  ipcMain.handle(IPC.DIALOG_PICK_JAVA, async () => {
    const r = await dialog.showOpenDialog(mainWindow!, { filters: [{ name: 'Executable', extensions: ['exe', '*'] }], properties: ['openFile'] })
    return r.canceled ? null : r.filePaths[0]
  })

  ipcMain.on(IPC.WINDOW_MINIMIZE, () => mainWindow?.minimize())
  ipcMain.on(IPC.WINDOW_CLOSE,    () => { if (getSettings().minimizeToTray) mainWindow?.hide(); else { forceQuit = true; app.quit() } })

  // Auto-start profiles
  const profiles = getAllProfiles()
  for (const p of profiles) {
    if (p.autoStart && p.jarPath) processManager.start(p)
  }

  // Keep tray menu in sync with process state changes
  mainWindow?.webContents.on('did-finish-load', updateTrayMenu)
})

app.on('window-all-closed', () => { /* keep alive in tray */ })
app.on('before-quit', () => { forceQuit = true })
app.on('activate', () => { mainWindow?.show() })
