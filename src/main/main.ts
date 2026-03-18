import { app, BrowserWindow, Tray, Menu, ipcMain, dialog, nativeImage, shell } from 'electron'
import path from 'path'
import fs   from 'fs'
import https from 'https'
import { IPC } from './shared/types'
import { getAllProfiles, saveProfile, deleteProfile, getSettings, saveSettings } from './store'
import { processManager } from './processManager'
import { restApiServer }  from './restApiServer'
import { latestReleaseUrl, templateListUrl, rawTemplateUrl } from './shared/config/GitHub.config'
import type { ProfileTemplate } from './shared/GitHub.types'

const IS_DEV    = !app.isPackaged
const RESOURCES = IS_DEV
  ? path.join(__dirname, '../../resources')
  : path.join(app.getAppPath(), 'resources')

function httpsGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'java-runner-client' } }
    const req = https.get(url, options, res => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(httpsGet(res.headers.location))
        return
      }
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { reject(new Error('JSON parse error')) }
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

// Tray icon: try .ico first (Windows), then .png
function getIconImage(): Electron.NativeImage {
  const candidates = process.platform === 'win32'
    ? ['icon.ico', 'icon.png']
    : ['icon.png', 'icon.ico']

  console.log(`[Tray] Looking for icon in: ${RESOURCES}`)
  for (const name of candidates) {
    const p = path.join(RESOURCES, name)
    console.log(`[Tray] Checking: ${p}`)
    if (fs.existsSync(p)) {
      console.log(`[Tray] Found icon: ${p}`)
      const img = nativeImage.createFromPath(p)
      if (!img.isEmpty()) return img
    }
  }
  console.log(`[Tray] No icon found, using fallback`)
  // 1x1 transparent fallback so tray never crashes
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  )
}

// Small 16x16 tray icon - resize after loading to avoid blurry icon
function getTrayIcon(): Electron.NativeImage {
  const full = getIconImage()
  return full.resize({ width: 16, height: 16, quality: 'better' })
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let forceQuit = false

function createWindow(): void {
  const settings = getSettings()
  const isHidden = process.argv.includes('--hidden')

  mainWindow = new BrowserWindow({
    width: 1200, height: 760, minWidth: 900, minHeight: 600,
    frame: false, backgroundColor: '#08090d',
    icon: getIconImage(),
    show: false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  })

  if (IS_DEV) mainWindow.loadURL('http://localhost:5173')
  else        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  mainWindow.once('ready-to-show', () => {
    if (isHidden || (settings.startMinimized && !IS_DEV)) mainWindow?.hide()
    else mainWindow?.show()
  })

  mainWindow.on('close', e => {
    if (forceQuit) return
    if (getSettings().minimizeToTray) { e.preventDefault(); mainWindow?.hide() }
  })

  processManager.setWindow(mainWindow)
}

function createTray(): void {
  tray = new Tray(getTrayIcon())
  tray.setToolTip('Java Runner Client')
  updateTrayMenu()
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus() })
}

function updateTrayMenu(): void {
  if (!tray) return
  const states   = processManager.getStates()
  const profiles = getAllProfiles()
  const items = states.map(s => ({
    label:   `  ${profiles.find(p => p.id === s.profileId)?.name ?? s.profileId}  (PID ${s.pid ?? '?'})`,
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

  // ── GitHub IPC ─────────────────────────────────────────────────────────────

  ipcMain.handle('github:latestRelease', async () => {
    try { return { ok: true, data: await httpsGet(latestReleaseUrl()) } }
    catch (e) { return { ok: false, error: String(e) } }
  })

  ipcMain.handle('github:templates', async () => {
    try {
      const raw = await httpsGet(templateListUrl())
      // GitHub returns an array of file objects; guard against error objects
      if (!Array.isArray(raw)) return { ok: false, error: 'Templates folder not found or repo not configured' }
      const jsonFiles = (raw as Array<{ name: string }>).filter(f => f.name.endsWith('.json'))
      const templates: Array<{ filename: string; template: ProfileTemplate }> = []
      for (const f of jsonFiles) {
        try {
          const tpl = await httpsGet(rawTemplateUrl(f.name)) as ProfileTemplate
          templates.push({ filename: f.name, template: tpl })
        } catch { /* skip malformed template */ }
      }
      return { ok: true, data: templates }
    } catch (e) { return { ok: false, error: String(e) } }
  })

  ipcMain.handle('github:downloadAsset', async (_e, url: string, filename: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: filename,
      filters: [{ name: 'Installer', extensions: ['exe', 'dmg', 'AppImage', 'deb', '*'] }],
    })
    if (canceled || !filePath) return { ok: false }

    return new Promise<{ ok: boolean; error?: string }>(resolve => {
      const file = fs.createWriteStream(filePath)
      const options = { headers: { 'User-Agent': 'java-runner-client' } }
      https.get(url, options, res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          https.get(res.headers.location, options, r => r.pipe(file))
        } else {
          res.pipe(file)
        }
        file.on('finish', () => {
          file.close()
          shell.showItemInFolder(filePath)
          resolve({ ok: true })
        })
      }).on('error', e => {
        fs.unlink(filePath, () => {})
        resolve({ ok: false, error: e.message })
      })
    })
  })

  // ── Profile IPC ────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.PROFILES_GET_ALL, () => getAllProfiles())

  ipcMain.handle(IPC.PROFILES_SAVE, (_e, profile) => {
    saveProfile(profile)
    processManager.updateProfileSnapshot(profile)
    updateTrayMenu()
  })

  ipcMain.handle(IPC.PROFILES_DELETE, (_e, id) => {
    deleteProfile(id)
    updateTrayMenu()
  })

  // ── Process IPC ────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.PROCESS_START,        (_e, profile) => { const r = processManager.start(profile); updateTrayMenu(); return r })
  ipcMain.handle(IPC.PROCESS_STOP,         (_e, id)      => { const r = processManager.stop(id);        updateTrayMenu(); return r })
  ipcMain.handle(IPC.PROCESS_SEND_INPUT,   (_e, id, inp) => processManager.sendInput(id, inp))
  ipcMain.handle(IPC.PROCESS_GET_STATES,   ()            => processManager.getStates())
  ipcMain.handle(IPC.PROCESS_GET_LOG,      ()            => processManager.getActivityLog())
  ipcMain.handle(IPC.PROCESS_CLEAR_LOG,    ()            => processManager.clearActivityLog())
  ipcMain.handle(IPC.PROCESS_SCAN_ALL,     ()            => processManager.scanAllProcesses())
  ipcMain.handle(IPC.PROCESS_KILL_PID,     (_e, pid)     => processManager.killPid(pid))
  ipcMain.handle(IPC.PROCESS_KILL_ALL_JAVA,()            => processManager.killAllJava())

  // ── Settings IPC ───────────────────────────────────────────────────────────

  ipcMain.handle(IPC.SETTINGS_GET, () => getSettings())
  ipcMain.handle(IPC.SETTINGS_SAVE, (_e, s) => {
    const old = getSettings()
    saveSettings(s)
    // Toggle REST API if setting changed
    if (s.restApiEnabled && !old.restApiEnabled)       restApiServer.start(s.restApiPort)
    else if (!s.restApiEnabled && old.restApiEnabled)  restApiServer.stop()
    else if (s.restApiEnabled && s.restApiPort !== old.restApiPort) {
      restApiServer.stop()
      restApiServer.start(s.restApiPort)
    }
  })

  // ── Dialog IPC ─────────────────────────────────────────────────────────────

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

  // ── Other IPC ─────────────────────────────────────────────────────────────

  ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url))

  // ── Window IPC ─────────────────────────────────────────────────────────────

  ipcMain.on(IPC.WINDOW_MINIMIZE, () => mainWindow?.minimize())
  ipcMain.on(IPC.WINDOW_CLOSE,    () => {
    if (getSettings().minimizeToTray) mainWindow?.hide()
    else { forceQuit = true; app.quit() }
  })

  // ── Boot ───────────────────────────────────────────────────────────────────

  const settings = getSettings()
  if (settings.restApiEnabled) restApiServer.start(settings.restApiPort)

  for (const p of getAllProfiles()) {
    if (p.autoStart && p.jarPath) processManager.start(p)
  }

  // Keep tray in sync when process state changes
  mainWindow?.webContents.on('did-finish-load', updateTrayMenu)
})

app.on('window-all-closed', () => { /* keep alive in tray */ })
app.on('before-quit', () => { forceQuit = true })
app.on('activate', () => { mainWindow?.show() })