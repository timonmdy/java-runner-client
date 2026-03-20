import { contextBridge } from 'electron'
import { buildPreloadAPI } from './shared/IPCController'
import { allRoutes } from './ipc/_index'

contextBridge.exposeInMainWorld('api', buildPreloadAPI([...allRoutes]))
