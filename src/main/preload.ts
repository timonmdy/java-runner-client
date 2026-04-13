import { contextBridge } from 'electron';
import { buildPreloadAPI } from './core/IPCController';
import { allRoutes } from './ipc/_index';
import { EnvironmentIPC } from './ipc/Environment.ipc';

const api = buildPreloadAPI([...allRoutes]);
const env = buildPreloadAPI([EnvironmentIPC]);

contextBridge.exposeInMainWorld('jrc', { api, env });
