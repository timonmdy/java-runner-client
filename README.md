# ☕ Java Runner Client

A fast, minimal Electron + React + TypeScript desktop app for running and managing Java processes on Windows (also works on Linux/macOS).

---

## Features

- **Profile system** — one profile per JAR; each has its own JVM args, system properties (`-D`), and program args
- **Console tab** — live stdout/stderr output, stdin commands, command history (↑/↓), Ctrl+L to clear
- **Configure tab** — per-profile JAR path, working dir, Java executable, all argument types
- **Settings** — launch on Windows startup, start minimised, minimize-to-tray, console font size, word wrap, buffer limits
- **System tray** — always available, shows running processes, double-click to restore
- **Auto-start** — mark a profile to automatically run its JAR when the app opens
- **Frameless window** — custom title bar, minimize and close with tray fallback

---

## Project Structure

```
java-runner-client/
├── resources/
│   ├── icon.ico          ← Windows tray + taskbar + installer icon
│   ├── icon.png          ← Linux / macOS (512×512 px recommended)
│   └── icon.icns         ← macOS app bundle icon
│
├── src/
│   ├── main/             ← Electron main process (Node.js)
│   │   ├── shared/
│   │   │   └── types.ts  ← Shared types + IPC channel names
│   │   ├── main.ts       ← App entry, window, tray, IPC registration
│   │   ├── preload.ts    ← Secure context bridge (window.api)
│   │   ├── processManager.ts  ← Spawns/kills Java processes, streams output
│   │   └── store.ts      ← electron-store persistence (profiles + settings)
│   │
│   └── renderer/         ← React UI (Vite)
│       ├── components/
│       │   ├── common/   ← Button, Input, Toggle, ArgList, PropList, TitleBar
│       │   ├── console/  ← ConsoleTab (main view)
│       │   ├── profiles/ ← ProfileSidebar, ConfigTab
│       │   └── settings/ ← SettingsTab
│       ├── store/
│       │   └── AppStore.tsx  ← React context + useReducer state
│       ├── types/
│       │   └── index.ts  ← Renderer types + window.api declaration
│       ├── styles/
│       │   └── globals.css
│       ├── App.tsx
│       ├── main.tsx
│       └── index.html
│
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json          ← Renderer TS config
├── tsconfig.main.json     ← Main process TS config
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Java** installed and on PATH (or specify the path per-profile)

### Install & Run (Development)

```bash
cd java-runner-client
npm install
npm run dev
```

This starts Vite on `http://localhost:5173` and launches Electron pointing at it.

### Build & Package (Windows)

```bash
npm run dist
```

Outputs an NSIS installer to `dist/` that installs the app to Program Files.

---

## 🖼️ Setting the Application Icon

This is the most common point of confusion in Electron apps.  
**You need three formats.** Here's the complete tutorial:

### 1. Create Your Icon

Start with a **1024×1024 px PNG** — high resolution, transparent background.  
Tools: Figma, Adobe Illustrator, GIMP, or any image editor.

Save it as `resources/icon-master.png` (this is your source file, not used directly by Electron).

### 2. Generate All Required Formats

#### Option A — Using `electron-icon-builder` (recommended)

```bash
npm install --save-dev electron-icon-builder
npx electron-icon-builder --input=resources/icon-master.png --output=resources/ --flatten
```

This generates:
- `resources/icon.ico`   ← Windows (multi-resolution: 16, 32, 48, 64, 128, 256 px)
- `resources/icon.icns`  ← macOS
- `resources/icon.png`   ← Linux (512×512)

#### Option B — Online converter

Use https://www.icoconverter.com/ for `.ico` and https://cloudconvert.com/ for `.icns`.

#### Option C — ImageMagick (CLI)

```bash
# ICO with multiple sizes embedded (Windows requirement)
magick convert icon-master.png -define icon:auto-resize=256,128,64,48,32,16 resources/icon.ico

# PNG for Linux
magick convert icon-master.png -resize 512x512 resources/icon.png
```

### 3. Where Each Icon Is Used

| File                  | Used for                                      |
|-----------------------|-----------------------------------------------|
| `resources/icon.ico`  | Windows taskbar, window top-left, tray, NSIS installer |
| `resources/icon.png`  | Linux taskbar + tray; fallback in Electron    |
| `resources/icon.icns` | macOS Dock, Finder, App Switcher              |

### 4. How the Code Wires Them Up

In `src/main/main.ts`:

```typescript
// Resolves the correct icon path in both dev and production
const ICON_PATH = path.join(
  IS_DEV ? path.join(__dirname, '../../resources') : path.join(process.resourcesPath, 'resources'),
  process.platform === 'win32' ? 'icon.ico' : 'icon.png'
)

// Window icon (top-left corner)
mainWindow = new BrowserWindow({
  icon: ICON_PATH,
  ...
})

// Tray icon (system tray / notification area)
const icon = nativeImage.createFromPath(ICON_PATH)
tray = new Tray(icon.resize({ width: 16, height: 16 }))
```

In `package.json` (electron-builder):

```json
"build": {
  "icon": "resources/icon",    ← builder auto-selects .ico/.icns/.png
  "win": { "icon": "resources/icon.ico" }
}
```

### 5. Verify Your Icon Appears Correctly

After `npm run dev`:
- ✅ Window top-left corner — small icon in the title bar
- ✅ Windows taskbar — when the window is open
- ✅ System tray — in the notification area (bottom-right)

After `npm run dist`:
- ✅ Desktop shortcut
- ✅ Start Menu entry
- ✅ NSIS installer header image (uses the `.ico`)

### Common Icon Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Tray icon is blank/white | Path is wrong | Check `ICON_PATH` with `console.log` in main.ts |
| Window icon doesn't update | Electron caches | Delete `dist/` and rebuild |
| Blurry tray icon | Source PNG too small | Use 512×512 minimum source |
| `.ico` only shows one size | Not multi-resolution | Use `electron-icon-builder` or ImageMagick |

---

## IPC Architecture

All communication between the Electron main process and the React renderer goes through a **typed, whitelisted bridge** (`preload.ts → window.api`).

```
Renderer (React)
     │
     │  window.api.startProcess(profile)   ← invoke (request/response)
     ▼
  preload.ts  (contextBridge — security boundary)
     │
     │  ipcRenderer.invoke('process:start', profile)
     ▼
  main.ts  →  processManager.ts
     │
     │  win.webContents.send('console:line', profileId, line)
     ▼
  preload.ts  →  window.api.onConsoleLine(cb)
     │
     ▼
  Renderer (AppStore.tsx → dispatch APPEND_LOG)
```

The `IPC` constant object in `src/main/shared/types.ts` is the single source of truth for all channel names — no magic strings scattered through the codebase.

---

## Adding a New Profile Type / Template

1. In `AppStore.tsx`, update `createProfile()` to accept a template parameter
2. Add template buttons in `ProfileSidebar.tsx` (e.g. "New Minecraft Server", "New Spring App")
3. Each template pre-fills sensible defaults (e.g. Minecraft: `-Xmx4g`, `--nogui`)

---

## Configuration File Location

electron-store saves to:
- **Windows:** `%APPDATA%\java-runner-client\java-runner-config.json`
- **Linux:**   `~/.config/java-runner-client/java-runner-config.json`
- **macOS:**   `~/Library/Application Support/java-runner-client/java-runner-config.json`

You can edit this JSON directly — changes take effect on next app start.

---

## Tech Stack

| Layer      | Tech                                      |
|------------|-------------------------------------------|
| Runtime    | Electron 28                               |
| UI         | React 18 + TypeScript                     |
| Bundler    | Vite 5                                    |
| Styling    | Tailwind CSS 3                            |
| State      | React Context + useReducer (no Zustand)   |
| Persistence| electron-store 8                          |
| Packaging  | electron-builder 24                       |
| Fonts      | JetBrains Mono + DM Sans (Google Fonts)   |
