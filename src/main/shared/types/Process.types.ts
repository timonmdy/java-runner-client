export interface ProcessState {
  profileId: string
  running: boolean
  pid?: number
  startedAt?: number
  exitCode?: number
}

export interface ProcessLogEntry {
  id: string
  profileId: string
  profileName: string
  jarPath: string
  pid: number
  startedAt: number
  stoppedAt?: number
  exitCode?: number
  signal?: string
}

export interface JavaProcessInfo {
  pid: number
  name: string
  command: string
  isJava: boolean
  managed: boolean
  protected: boolean
  memoryMB?: number
  startTime?: string
  threads?: number
  jarName?: string
}

export interface ConsoleLine {
  id: number
  text: string
  type: 'stdout' | 'stderr' | 'input' | 'system'
  timestamp: number
}
