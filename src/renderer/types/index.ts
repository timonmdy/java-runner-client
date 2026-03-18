export type {
  Profile, AppSettings, ConsoleLine, ProcessState, ProcessLogEntry, JavaProcessInfo,
} from '../../main/shared/types'

export type { GitHubRelease, GitHubAsset, ProfileTemplate } from '../../main/shared/GitHub.types'

declare global {
  interface Window {
    api: {
      getProfiles:        () => Promise<import('../../main/shared/types').Profile[]>
      saveProfile:        (p: import('../../main/shared/types').Profile) => Promise<void>
      deleteProfile:      (id: string) => Promise<void>
      startProcess:       (p: import('../../main/shared/types').Profile) => Promise<{ ok: boolean; error?: string }>
      stopProcess:        (id: string) => Promise<{ ok: boolean; error?: string }>
      sendInput:          (profileId: string, input: string) => Promise<void>
      getStates:          () => Promise<import('../../main/shared/types').ProcessState[]>
      getProcessLog:      () => Promise<import('../../main/shared/types').ProcessLogEntry[]>
      clearProcessLog:    () => Promise<void>
      scanAllProcesses:   () => Promise<import('../../main/shared/types').JavaProcessInfo[]>
      killPid:            (pid: number) => Promise<{ ok: boolean; error?: string }>
      killAllJava:        () => Promise<{ ok: boolean; killed: number }>
      fetchLatestRelease: () => Promise<{ ok: boolean; data?: import('../../main/shared/GitHub.types').GitHubRelease; error?: string }>
      fetchTemplates:     () => Promise<{ ok: boolean; data?: Array<{ filename: string; template: import('../../main/shared/GitHub.types').ProfileTemplate }>; error?: string }>
      downloadAsset:      (url: string, filename: string) => Promise<{ ok: boolean; error?: string }>
      onConsoleLine:      (cb: (profileId: string, line: import('../../main/shared/types').ConsoleLine) => void) => () => void
      onConsoleClear:     (cb: (profileId: string) => void) => () => void
      onStatesUpdate:     (cb: (states: import('../../main/shared/types').ProcessState[]) => void) => () => void
      getSettings:        () => Promise<import('../../main/shared/types').AppSettings>
      saveSettings:       (s: import('../../main/shared/types').AppSettings) => Promise<void>
      pickJar:            () => Promise<string | null>
      pickDir:            () => Promise<string | null>
      pickJava:           () => Promise<string | null>
      openExternal:       (url: string) => Promise<void>
      minimizeWindow:     () => void
      closeWindow:        () => void
    }
  }
}
