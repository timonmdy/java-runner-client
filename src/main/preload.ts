import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getProfiles:         () => ipcRenderer.invoke('profiles:getAll'),
  saveProfile:         (p: unknown) => ipcRenderer.invoke('profiles:save', p),
  deleteProfile:       (id: string) => ipcRenderer.invoke('profiles:delete', id),
  startProcess:        (p: unknown) => ipcRenderer.invoke('process:start', p),
  stopProcess:         (id: string) => ipcRenderer.invoke('process:stop', id),
  sendInput:           (profileId: string, input: string) => ipcRenderer.invoke('process:sendInput', profileId, input),
  getStates:           () => ipcRenderer.invoke('process:getStates'),
  getProcessLog:       () => ipcRenderer.invoke('process:getLog'),
  clearProcessLog:     () => ipcRenderer.invoke('process:clearLog'),
  scanAllProcesses:    () => ipcRenderer.invoke('process:scanAll'),
  killPid:             (pid: number) => ipcRenderer.invoke('process:killPid', pid),
  killAllJava:         () => ipcRenderer.invoke('process:killAllJava'),
  fetchLatestRelease:  () => ipcRenderer.invoke('github:latestRelease'),
  fetchTemplates:      () => ipcRenderer.invoke('github:templates'),
  downloadAsset:       (url: string, filename: string) => ipcRenderer.invoke('github:downloadAsset', url, filename),
  onConsoleLine: (cb: (profileId: string, line: unknown) => void) => {
    const h = (_: Electron.IpcRendererEvent, pid: string, line: unknown) => cb(pid, line)
    ipcRenderer.on('console:line', h)
    return () => ipcRenderer.off('console:line', h)
  },
  onConsoleClear: (cb: (profileId: string) => void) => {
    const h = (_: Electron.IpcRendererEvent, id: string) => cb(id)
    ipcRenderer.on('console:clear', h)
    return () => ipcRenderer.off('console:clear', h)
  },
  onStatesUpdate: (cb: (states: unknown[]) => void) => {
    const h = (_: Electron.IpcRendererEvent, s: unknown[]) => cb(s)
    ipcRenderer.on('process:statesUpdate', h)
    return () => ipcRenderer.off('process:statesUpdate', h)
  },
  getSettings:     () => ipcRenderer.invoke('settings:get'),
  saveSettings:    (s: unknown) => ipcRenderer.invoke('settings:save', s),
  pickJar:         () => ipcRenderer.invoke('dialog:pickJar'),
  pickDir:         () => ipcRenderer.invoke('dialog:pickDir'),
  pickJava:        () => ipcRenderer.invoke('dialog:pickJava'),
  openExternal:    (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  minimizeWindow:  () => ipcRenderer.send('window:minimize'),
  closeWindow:     () => ipcRenderer.send('window:close'),
})
