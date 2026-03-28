import { EnvironmentIPC } from './Environment.ipc';

export { DevIPC, initDevIPC } from './Dev.ipc';
export { GitHubIPC } from './GitHub.ipc';
export { JarResolutionIPC } from './JarResolution.ipc';
export { LoggingIPC } from './Logging.ipc';
export { ProcessIPC } from './Process.ipc';
export { ProfileIPC } from './Profile.ipc';
export { initSystemIPC, SystemIPC } from './System.ipc';
export { initWindowIPC, WindowIPC } from './Window.ipc';

import type { InferAPI } from '../core/IPCController';
import { DevIPC } from './Dev.ipc';
import { GitHubIPC } from './GitHub.ipc';
import { JarResolutionIPC } from './JarResolution.ipc';
import { LoggingIPC } from './Logging.ipc';
import { ProcessIPC } from './Process.ipc';
import { ProfileIPC } from './Profile.ipc';
import { SystemIPC } from './System.ipc';
import { WindowIPC } from './Window.ipc';

export const allRoutes = [
  GitHubIPC,
  ProcessIPC,
  ProfileIPC,
  SystemIPC,
  WindowIPC,
  DevIPC,
  JarResolutionIPC,
  LoggingIPC,
] as const;

export type API = InferAPI<
  typeof GitHubIPC &
    typeof ProcessIPC &
    typeof ProfileIPC &
    typeof SystemIPC &
    typeof WindowIPC &
    typeof DevIPC &
    typeof JarResolutionIPC &
    typeof LoggingIPC
>;

export type Environment = InferAPI<typeof EnvironmentIPC>;
