import { ConsoleLine } from '../../main/shared/types/Process.types'

const key = (id: string) => `jrc:console:${id}`

export function loadLogs(id: string, max: number): ConsoleLine[] {
  try {
    const raw = sessionStorage.getItem(key(id))
    return raw ? (JSON.parse(raw) as ConsoleLine[]).slice(-max) : []
  } catch {
    return []
  }
}

export function saveLogs(id: string, lines: ConsoleLine[]): void {
  try {
    sessionStorage.setItem(key(id), JSON.stringify(lines))
  } catch {
    /* quota */
  }
}

export function clearLogs(id: string): void {
  try {
    sessionStorage.removeItem(key(id))
  } catch {
    /* ignore */
  }
}
