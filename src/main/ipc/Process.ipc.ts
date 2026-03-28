import { shell } from 'electron';
import type { RouteMap } from '../core/IPCController';
import { getAllProfiles } from '../core/Store';
import { processManager } from '../core/process/ProcessManager';
import { ConsoleLine, ProcessState } from '../shared/types/Process.types';
import { Profile } from '../shared/types/Profile.types';

export const ProcessIPC = {
  startProcess: {
    type: 'invoke',
    channel: 'process:start',
    handler: (_e: any, p: Profile) => processManager.start(p),
  },
  stopProcess: {
    type: 'invoke',
    channel: 'process:stop',
    handler: (_e: any, id: string) => processManager.stop(id),
  },
  forceStopProcess: {
    type: 'invoke',
    channel: 'process:forceStop',
    handler: (_e: any, id: string) => processManager.forceStop(id),
  },
  sendInput: {
    type: 'invoke',
    channel: 'process:sendInput',
    handler: (_e: any, id: string, inp: string) => processManager.sendInput(id, inp),
  },
  getStates: {
    type: 'invoke',
    channel: 'process:getStates',
    handler: () => processManager.getStates(),
  },
  getProcessLog: {
    type: 'invoke',
    channel: 'process:getLog',
    handler: () => processManager.getActivityLog(),
  },
  clearProcessLog: {
    type: 'invoke',
    channel: 'process:clearLog',
    handler: () => processManager.clearActivityLog(),
  },
  scanAllProcesses: {
    type: 'invoke',
    channel: 'process:scanAll',
    handler: () => processManager.scanAllProcesses(),
  },
  killPid: {
    type: 'invoke',
    channel: 'process:killPid',
    handler: (_e: any, pid: number) => processManager.killPid(pid),
  },
  killAllJava: {
    type: 'invoke',
    channel: 'process:killAllJava',
    handler: () => processManager.killAllJava(),
  },
  openWorkingDir: {
    type: 'invoke',
    channel: 'process:openWorkingDir',
    handler: (_e: any, profileId: string) => {
      const profile = getAllProfiles().find((p) => p.id === profileId);
      if (!profile) return { ok: false, error: 'Profile not found' };
      const dir =
        profile.workingDir || (profile.jarPath ? require('path').dirname(profile.jarPath) : '');
      if (!dir) return { ok: false, error: 'No working directory configured' };
      shell.openPath(dir);
      return { ok: true };
    },
  },

  // Push events (main -> renderer via webContents.send)
  consoleLine: {
    type: 'on',
    channel: 'console:line',
    args: {} as (profileId: string, line: ConsoleLine) => void,
  },
  consoleClear: { type: 'on', channel: 'console:clear', args: {} as (profileId: string) => void },
  statesUpdate: {
    type: 'on',
    channel: 'process:statesUpdate',
    args: {} as (states: ProcessState[]) => void,
  },
} satisfies RouteMap;
