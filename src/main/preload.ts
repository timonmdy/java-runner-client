import { contextBridge } from 'electron';
import { buildPreloadAPI } from './core/IPCController';
import { allRoutes } from './ipc/_index';
import { EnvironmentIPC } from './ipc/Environment.ipc';

contextBridge.exposeInMainWorld('api', buildPreloadAPI([...allRoutes]));

contextBridge.exposeInMainWorld('env', buildPreloadAPI([EnvironmentIPC]));
