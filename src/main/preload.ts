import { contextBridge, ipcRenderer } from 'electron'

/**
 * window.api — typed IPC bridge. IPC strings are inlined (no cross-file
 * CommonJS imports allowed in the sandboxed preload context).
 */
contextBridge.exposeInMainWorld('api', {
  // Profiles
  getProfiles:   () => ipcRenderer.invoke('profiles:getAll'),
  saveProfile:   (p: unknown) => ipcRenderer.invoke('profiles:save', p),
  deleteProfile: (id: string) => ipcRenderer.invoke('profiles:delete', id),

  // Process control
  startProcess:  (p: unknown)  => ipcRenderer.invoke('process:start', p),
  stopProcess:   (id: string)  => ipcRenderer.invoke('process:stop', id),
  sendInput:     (profileId: string, input: string) => ipcRenderer.invoke('process:sendInput', profileId, input),
  getStates:     () => ipcRenderer.invoke('process:getStates'),

  // Activity log + utilities
  getProcessLog:    ()           => ipcRenderer.invoke('process:getLog'),
  clearProcessLog:  ()           => ipcRenderer.invoke('process:clearLog'),
  scanAllProcesses: ()           => ipcRenderer.invoke('process:scanAll'),
  killPid:          (pid: number)=> ipcRenderer.invoke('process:killPid', pid),
  killAllJava:      ()           => ipcRenderer.invoke('process:killAllJava'),

  // Console push
  onConsoleLine: (cb: (profileId: string, line: unknown) => void) => {
    const h = (_: Electron.IpcRendererEvent, pid: string, line: unknown) => cb(pid, line)
    ipcRenderer.on('console:line', h)
    return () => ipcRenderer.off('console:line', h)
  },
  onStatesUpdate: (cb: (states: unknown[]) => void) => {
    const h = (_: Electron.IpcRendererEvent, s: unknown[]) => cb(s)
    ipcRenderer.on('process:statesUpdate', h)
    return () => ipcRenderer.off('process:statesUpdate', h)
  },

  // Settings
  getSettings:  () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s: unknown) => ipcRenderer.invoke('settings:save', s),

  // Dialogs
  pickJar:  () => ipcRenderer.invoke('dialog:pickJar'),
  pickDir:  () => ipcRenderer.invoke('dialog:pickDir'),
  pickJava: () => ipcRenderer.invoke('dialog:pickJava'),

  // Window
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow:    () => ipcRenderer.send('window:close'),
})
