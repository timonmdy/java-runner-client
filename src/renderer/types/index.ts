export type {
  Profile,
  AppSettings,
  ConsoleLine,
  ProcessState,
  ProcessLogEntry,
  JavaProcessInfo,
} from '../../main/shared/types'

export type { GitHubRelease, GitHubAsset, ProfileTemplate } from '../../main/shared/GitHub.types'

// API type is fully inferred from the route definitions — never write this by hand again.
import type { API } from '../../main/ipc/_index'

declare global {
  interface Window {
    api: API
  }
}
