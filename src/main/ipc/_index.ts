import { EnvironmentIPC } from './Environment.ipc'
/**
 * Central IPC registry.
 *
 * To add a new route:
 *   1. Add it to the appropriate *.ipc.ts file (or create a new one)
 *   2. If it's a new file, add it to `allRoutes` below
 *   3. That's it — main, preload, and types all update automatically
 */

export { GitHubIPC } from './GitHub.ipc'
export { ProcessIPC } from './Process.ipc'
export { ProfileIPC } from './Profile.ipc'
export { SystemIPC, initSystemIPC } from './System.ipc'
export { WindowIPC, initWindowIPC } from './Window.ipc'
export { DevIPC, initDevIPC } from './Dev.ipc'

import { GitHubIPC } from './GitHub.ipc'
import { ProcessIPC } from './Process.ipc'
import { ProfileIPC } from './Profile.ipc'
import { SystemIPC } from './System.ipc'
import { WindowIPC } from './Window.ipc'
import { DevIPC } from './Dev.ipc'
import type { InferAPI } from '../shared/IPCController'

export const allRoutes = [GitHubIPC, ProcessIPC, ProfileIPC, SystemIPC, WindowIPC, DevIPC] as const

export type API = InferAPI<
  typeof GitHubIPC &
    typeof ProcessIPC &
    typeof ProfileIPC &
    typeof SystemIPC &
    typeof WindowIPC &
    typeof DevIPC
>

export type Environment = InferAPI<typeof EnvironmentIPC>
