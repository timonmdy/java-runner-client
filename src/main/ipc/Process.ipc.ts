import type { RouteMap } from '../shared/IPCController'
import { processManager } from '../ProcessManager'
import type { Profile, ProcessState, ConsoleLine } from '../shared/types'

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

  // Push events (main → renderer via webContents.send)
  // The _types field is a phantom used only for TypeScript inference — never called at runtime.
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
} satisfies RouteMap
