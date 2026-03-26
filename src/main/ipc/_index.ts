import { EnvironmentIPC } from './Environment.ipc';

export { GitHubIPC } from './GitHub.ipc';
export { ProcessIPC } from './Process.ipc';
export { ProfileIPC } from './Profile.ipc';
export { SystemIPC, initSystemIPC } from './System.ipc';
export { WindowIPC, initWindowIPC } from './Window.ipc';
export { DevIPC, initDevIPC } from './Dev.ipc';
export { JarResolutionIPC } from './JarResolution.ipc';
export { LoggingIPC } from './Logging.ipc';
export { AssetIPC } from './Asset.ipc';

import { GitHubIPC } from './GitHub.ipc';
import { ProcessIPC } from './Process.ipc';
import { ProfileIPC } from './Profile.ipc';
import { SystemIPC } from './System.ipc';
import { WindowIPC } from './Window.ipc';
import { DevIPC } from './Dev.ipc';
import { JarResolutionIPC } from './JarResolution.ipc';
import { LoggingIPC } from './Logging.ipc';
import { AssetIPC } from './Asset.ipc';
import type { InferAPI } from '../IPCController';

export const allRoutes = [
  GitHubIPC,
  ProcessIPC,
  ProfileIPC,
  SystemIPC,
  WindowIPC,
  DevIPC,
  JarResolutionIPC,
  LoggingIPC,
  AssetIPC,
] as const;

export type API = InferAPI<
  typeof GitHubIPC &
    typeof ProcessIPC &
    typeof ProfileIPC &
    typeof SystemIPC &
    typeof WindowIPC &
    typeof DevIPC &
    typeof JarResolutionIPC &
    typeof LoggingIPC &
    typeof AssetIPC
>;

export type Environment = InferAPI<typeof EnvironmentIPC>;
