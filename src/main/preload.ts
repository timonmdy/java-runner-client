import { contextBridge } from 'electron'
import { allRoutes } from './ipc/_index'
import { EnvironmentIPC } from './ipc/Environment.ipc'
import { buildPreloadAPI } from './IPCController'

contextBridge.exposeInMainWorld('api', buildPreloadAPI([...allRoutes]))

contextBridge.exposeInMainWorld('env', buildPreloadAPI([EnvironmentIPC]))
