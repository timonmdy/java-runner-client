import { shell } from 'electron';
import type { RouteMap } from '../core/IPCController';
import {
  deleteLogFile,
  getLogFiles,
  getLogsDirectory,
  LogFileInfo,
  readLogFile,
} from '../core/process/FileLogger';

export const LoggingIPC = {
  getLogFiles: {
    type: 'invoke',
    channel: 'logging:getFiles',
    handler: (_e: any, profileId: string): LogFileInfo[] => getLogFiles(profileId),
  },
  readLogFile: {
    type: 'invoke',
    channel: 'logging:readFile',
    handler: (_e: any, filePath: string): string => readLogFile(filePath),
  },
  deleteLogFile: {
    type: 'invoke',
    channel: 'logging:deleteFile',
    handler: (_e: any, filePath: string): boolean => deleteLogFile(filePath),
  },
  openLogsDirectory: {
    type: 'invoke',
    channel: 'logging:openDir',
    handler: (_e: any, profileId: string): void => {
      const dir = getLogsDirectory(profileId);
      shell.openPath(dir);
    },
  },
} satisfies RouteMap;
