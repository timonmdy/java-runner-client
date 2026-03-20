# ☕ Java Runner Client

A fast, minimal Electron + React + TypeScript desktop app for running and managing Java processes on Windows (also works on Linux/macOS).

---

## Features

- **Manage running JARs** — get rid of .bat-Files to run yours JARs and manage all of them at a central place. 
- **Auto-start** — mark a profile to automatically run its JAR when the app opens. Automatically restart on crash
- **Profile system** — one profile per JAR; each has its own JVM args, system properties (`-D`), and program args. Profile Templates for easy setup.
- **Console tab** — live stdout/stderr output, stdin commands, command history (↑/↓), Ctrl+L to clear
- **Configure tab** — per-profile JAR path, working dir, Java executable, all argument types
- **Settings** — launch on Windows startup, start minimised, minimize-to-tray, console font size, word wrap, buffer limits
- **System tray** — always available, shows running processes, double-click to restore
- **Utilities** — Process Scanner to kill lost JARs running in the background, Activity Log to follow up on what has happened

---

## Getting Started - Users

To install the application:
1. Head to the latest [release](https://github.com/timonmdy/java-runner-client/releases/latest). 
2. Download the <code>Java Runner Client Setup.exe</code>
3. Run the installer from your downloads directory. <b>As of right now (March 2026) we did not aquire a Code Signing Certificate. You will have to click "Advanced -> Trust source" and install anyways.</b>
4. Optional: After installing, open the application and configure Auto-Start settings (Settings tab) if you want to automatically run JARs on your PC.

## Getting Started - Developers

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
