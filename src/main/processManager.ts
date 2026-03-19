import { spawn, execSync, ChildProcess } from 'child_process'
import { BrowserWindow } from 'electron'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { Profile, ProcessState, ConsoleLine, ProcessLogEntry, JavaProcessInfo } from './shared/types'
import { IPC } from './shared/types'
import { PROTECTED_PROCESS_NAMES } from './shared/config/Scanner.config'

const SELF_PROCESS_NAME = 'Java Client Runner'

type SystemMessageType = 'start' | 'stopping' | 'stopped' | 'restart' | 'error-starting' | 'error-runtime' | 'info-pid' | 'info-workdir' | 'info-restart'

interface ManagedProcess {
  process:     ChildProcess
  profileId:   string
  profileName: string
  jarPath:     string
  startedAt:   number
  intentionallyStopped: boolean
}

class ProcessManager {
  private processes    = new Map<string, ManagedProcess>()
  private activityLog: ProcessLogEntry[] = []
  private window:      BrowserWindow | null = null
  private restartTimers    = new Map<string, ReturnType<typeof setTimeout>>()
  private profileSnapshots = new Map<string, Profile>()
  private lineCounters     = new Map<string, number>()
  private seenLineIds      = new Map<string, Set<string | number>>()

  setWindow(win: BrowserWindow): void { this.window = win }

  private buildArgs(profile: Profile): { cmd: string; args: string[] } {
    const cmd  = profile.javaPath || 'java'
    const args: string[] = []
    for (const a of profile.jvmArgs)
      if (a.enabled && a.value.trim()) args.push(a.value.trim())
    for (const p of profile.systemProperties)
      if (p.enabled && p.key.trim())
        args.push(p.value.trim() ? `-D${p.key.trim()}=${p.value.trim()}` : `-D${p.key.trim()}`)
    args.push('-jar', profile.jarPath)
    for (const a of profile.programArgs)
      if (a.enabled && a.value.trim()) args.push(a.value.trim())
    return { cmd, args }
  }

  start(profile: Profile): { ok: boolean; error?: string } {
    if (this.processes.has(profile.id)) return { ok: false, error: 'Process already running' }
    if (!profile.jarPath)              return { ok: false, error: 'No JAR file specified' }

    this.cancelRestartTimer(profile.id)
    this.profileSnapshots.set(profile.id, profile)

    const { cmd, args } = this.buildArgs(profile)
    const cwd = profile.workingDir || path.dirname(profile.jarPath)

    this.pushSystem('start', profile.id, 'pending', `Starting: ${cmd} ${args.join(' ')}`)
    this.pushSystem('info-workdir', profile.id, 'pending', `Working dir: ${cwd}`)

    let proc: ChildProcess
    try {
      proc = spawn(cmd, args, { cwd, env: process.env, shell: false, detached: false, stdio: ['pipe', 'pipe', 'pipe'] })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      this.pushSystem('error-starting', profile.id, 'pending', `Failed to start: ${msg}`)
      return { ok: false, error: msg }
    }

    const managed: ManagedProcess = {
      process: proc, profileId: profile.id, profileName: profile.name,
      jarPath: profile.jarPath, startedAt: Date.now(),
      intentionallyStopped: false,
    }
    this.processes.set(profile.id, managed)

    if (!this.lineCounters.has(profile.id)) {
      this.lineCounters.set(profile.id, 0)
      this.seenLineIds.set(profile.id, new Set())
    }

    const pid = proc.pid ?? 0
    this.pushSystem('info-pid', profile.id, String(pid), `PID: ${pid}`)

    const logEntry: ProcessLogEntry = {
      id: uuidv4(), profileId: profile.id, profileName: profile.name,
      jarPath: profile.jarPath, pid, startedAt: managed.startedAt,
    }
    this.activityLog.unshift(logEntry)
    if (this.activityLog.length > 500) this.activityLog.pop()

    proc.stdout?.setEncoding('utf8')
    proc.stdout?.on('data', (chunk: string) => this.pushOutput(profile.id, chunk, 'stdout', managed))
    proc.stderr?.setEncoding('utf8')
    proc.stderr?.on('data', (chunk: string) => this.pushOutput(profile.id, chunk, 'stderr', managed))
    proc.on('error', (err) => this.pushSystem('error-runtime', profile.id, String(pid), `Error: ${err.message}`))
    proc.on('exit', (code, signal) => {
      this.processes.delete(profile.id)
      this.pushSystem('stopped', profile.id, String(pid), `Process stopped (${signal ? `signal ${signal}` : `exit code ${code ?? '?'}`})`)
      const entry = this.activityLog.find(e => e.profileId === profile.id && !e.stoppedAt)
      if (entry) { entry.stoppedAt = Date.now(); entry.exitCode = code ?? undefined; entry.signal = signal ?? undefined }
      this.broadcastStates()

      if (!managed.intentionallyStopped && code !== 0) {
        const snapshot = this.profileSnapshots.get(profile.id)
        if (snapshot?.autoRestart) {
          const delaySec = Math.max(1, snapshot.autoRestartInterval ?? 10)
          this.pushSystem('info-restart', profile.id, String(pid), `Auto-restart in ${delaySec}s...`)
          const timer = setTimeout(() => {
            this.restartTimers.delete(profile.id)
            const latest = this.profileSnapshots.get(profile.id) ?? snapshot
            this.start(latest)
          }, delaySec * 1000)
          this.restartTimers.set(profile.id, timer)
        }
      }
    })

    this.broadcastStates()
    return { ok: true }
  }

  stop(profileId: string): { ok: boolean; error?: string } {
    const m = this.processes.get(profileId)
    if (!m) return { ok: false, error: 'Not running' }

    m.intentionallyStopped = true
    this.cancelRestartTimer(profileId)

    this.pushSystem('stopping', profileId, String(m.process.pid ?? 0), 'Stopping process...')
    const pid = m.process.pid
    if (process.platform === 'win32' && pid) {
      try { execSync(`taskkill /PID ${pid} /T /F`, { timeout: 5000 }) } catch {
        try { m.process.kill('SIGTERM') } catch { /* ignore */ }
      }
    } else {
      try { m.process.kill('SIGTERM') } catch { /* ignore */ }
      setTimeout(() => {
        if (this.processes.has(profileId)) try { m.process.kill('SIGKILL') } catch { /* ignore */ }
      }, 5000)
    }
    return { ok: true }
  }

  updateProfileSnapshot(profile: Profile): void {
    if (this.profileSnapshots.has(profile.id)) {
      this.profileSnapshots.set(profile.id, profile)
    }
  }

  clearConsoleForProfile(profileId: string): void {
    this.window?.webContents.send(IPC.CONSOLE_CLEAR, profileId)
  }

  private cancelRestartTimer(profileId: string): void {
    const t = this.restartTimers.get(profileId)
    if (t) { clearTimeout(t); this.restartTimers.delete(profileId) }
  }

  sendInput(profileId: string, input: string): { ok: boolean; error?: string } {
    const m = this.processes.get(profileId)
    if (!m) return { ok: false, error: 'Not running' }
    m.process.stdin?.write(input.endsWith('\n') ? input : `${input}\n`)
    const counter = (this.lineCounters.get(profileId) ?? 0) + 1
    this.lineCounters.set(profileId, counter)
    this.pushLine(profileId, input, 'input', counter)
    return { ok: true }
  }

  getStates(): ProcessState[] {
    return Array.from(this.processes.entries()).map(([id, m]) => ({
      profileId: id, running: true, pid: m.process.pid, startedAt: m.startedAt,
    }))
  }

  getActivityLog():   ProcessLogEntry[] { return this.activityLog }
  clearActivityLog(): void              { this.activityLog = [] }

  // ── Process Scanner ──────────────────────────────────────────────────────────

  private isProtected(name: string, cmd: string): boolean {
    return PROTECTED_PROCESS_NAMES.some(
      n => name.toLowerCase().includes(n.toLowerCase()) || cmd.toLowerCase().includes(n.toLowerCase())
    )
  }

  private isSelf(name: string, cmd: string): boolean {
    return cmd.includes(SELF_PROCESS_NAME) || name.includes(SELF_PROCESS_NAME)
  }

  private parseJarName(cmd: string): string | undefined {
    const m = cmd.match(/-jar\s+([^\s]+)/i)
    if (!m) return undefined
    return m[1].split(/[/\\]/).pop()
  }

  scanAllProcesses(): JavaProcessInfo[] {
    const managedPids = new Set(
      Array.from(this.processes.values()).map(m => m.process.pid).filter((p): p is number => p != null)
    )
    if (process.platform === 'win32') return this.scanAllWindows(managedPids)
    return this.scanAllUnix(managedPids)
  }

  private scanAllWindows(managedPids: Set<number>): JavaProcessInfo[] {
    const psScript = [
      '$wmi = @{}',
      'Get-WmiObject Win32_Process | ForEach-Object { $wmi[$_.ProcessId] = $_.CommandLine }',
      'Get-Process | ForEach-Object {',
      '  $cmd = if ($wmi[$_.Id]) { $wmi[$_.Id] } else { $_.ProcessName }',
      '  $mem = [math]::Round($_.WorkingSet64 / 1MB, 1)',
      '  $thr = $_.Threads.Count',
      '  $st  = if ($_.StartTime) { $_.StartTime.ToString("yyyy-MM-dd HH:mm:ss") } else { "" }',
      '  [PSCustomObject]@{ Id=$_.Id; Name=$_.ProcessName; Cmd=$cmd; MemMB=$mem; Threads=$thr; Start=$st }',
      '} | ConvertTo-Json -Compress -Depth 2',
    ].join('; ')

    const encoded = Buffer.from(psScript, 'utf16le').toString('base64')
    try {
      const raw_out = execSync(
        `powershell -NoProfile -NonInteractive -OutputFormat Text -EncodedCommand ${encoded}`,
        { encoding: 'utf8', timeout: 20000 }
      )
      const jsonLine = raw_out.split('\n').find(l => { const t = l.trim(); return t.startsWith('[') || t.startsWith('{') })
      if (!jsonLine) return this.scanAllWindowsTasklist(managedPids)

      const raw   = JSON.parse(jsonLine.trim())
      const procs = Array.isArray(raw) ? raw : [raw]
      return procs
        .map((p: Record<string, unknown>) => {
          const pid  = Number(p.Id)
          const name = String(p.Name ?? '')
          const cmd  = String(p.Cmd  ?? name)
          if (isNaN(pid) || pid <= 0) return null
          if (this.isSelf(name, cmd)) return null
          const isJava = /java/i.test(name) || /java/i.test(cmd)
          return {
            pid, name, command: (cmd.length > 2 ? cmd : name).slice(0, 400),
            isJava, managed: managedPids.has(pid),
            protected: this.isProtected(name, cmd),
            memoryMB:  typeof p.MemMB  === 'number' ? p.MemMB : undefined,
            threads:   typeof p.Threads === 'number' ? p.Threads : undefined,
            startTime: p.Start ? String(p.Start) : undefined,
            jarName:   this.parseJarName(cmd),
          } as JavaProcessInfo
        })
        .filter((x): x is JavaProcessInfo => x !== null)
        .sort((a, b) => (b.isJava ? 1 : 0) - (a.isJava ? 1 : 0))
    } catch {
      return this.scanAllWindowsTasklist(managedPids)
    }
  }

  private scanAllWindowsTasklist(managedPids: Set<number>): JavaProcessInfo[] {
    try {
      const out = execSync('tasklist /fo csv /nh', { encoding: 'utf8', timeout: 8000 })
      const results: JavaProcessInfo[] = []
      for (const line of out.split('\n')) {
        const t = line.trim()
        if (!t) continue
        const parts = t.replace(/"/g, '').split(',')
        if (parts.length < 2) continue
        const name = parts[0].trim()
        const pid  = parseInt(parts[1].trim(), 10)
        if (isNaN(pid) || pid <= 0) continue
        if (this.isSelf(name, name)) continue
        const isJava = /java/i.test(name)
        results.push({ pid, name, command: name, isJava, managed: managedPids.has(pid), protected: this.isProtected(name, name) })
      }
      return results.sort((a, b) => (b.isJava ? 1 : 0) - (a.isJava ? 1 : 0))
    } catch { return [] }
  }

  private scanAllUnix(managedPids: Set<number>): JavaProcessInfo[] {
    try {
      const out = execSync('ps -eo pid,comm,args', { encoding: 'utf8', timeout: 5000 })
      return out.split('\n').slice(1).filter(Boolean)
        .map(line => {
          const parts = line.trim().split(/\s+/)
          const pid   = parseInt(parts[0], 10)
          const name  = parts[1] ?? ''
          const cmd   = parts.slice(2).join(' ').slice(0, 400)
          if (isNaN(pid)) return null
          if (this.isSelf(name, cmd)) return null
          const isJava = /java/i.test(name) || /java/i.test(cmd)
          return { pid, name, command: cmd || name, isJava, managed: managedPids.has(pid), protected: this.isProtected(name, cmd), jarName: this.parseJarName(cmd) } as JavaProcessInfo
        })
        .filter((x): x is JavaProcessInfo => x !== null)
        .sort((a, b) => (b.isJava ? 1 : 0) - (a.isJava ? 1 : 0))
    } catch { return [] }
  }

  killPid(pid: number): { ok: boolean; error?: string } {
    try {
      if (process.platform === 'win32') execSync(`taskkill /PID ${pid} /T /F`, { timeout: 5000 })
      else process.kill(pid, 'SIGKILL')
      for (const [id, m] of this.processes.entries()) {
        if (m.process.pid === pid) { this.processes.delete(id); break }
      }
      this.broadcastStates()
      return { ok: true }
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  // Only kills non-protected java processes
  killAllJava(): { ok: boolean; killed: number } {
    const procs = this.scanAllProcesses().filter(p => p.isJava && !p.protected)
    let killed  = 0
    for (const p of procs) if (this.killPid(p.pid).ok) killed++
    return { ok: true, killed }
  }

  private pushOutput(profileId: string, chunk: string, type: 'stdout' | 'stderr', m: ManagedProcess) {
    for (const [i, text] of chunk.split(/\r?\n/).entries()) {
      if (i === chunk.split(/\r?\n/).length - 1 && text === '') continue
      const counter = (this.lineCounters.get(profileId) ?? 0) + 1
      this.lineCounters.set(profileId, counter)
      this.pushLine(profileId, text, type, counter)
    }
  }

  private pushLine(profileId: string, text: string, type: ConsoleLine['type'], id: number | string) {
    const seenIds = this.seenLineIds.get(profileId)
    if (seenIds?.has(id)) {
      throw new Error(`Duplicate line ID detected for profile ${profileId}: ${id}`)
    }
    if (seenIds) {
      seenIds.add(id)
      if (seenIds.size > 10000) {
        this.seenLineIds.set(profileId, new Set([id]))
      }
    }
    this.window?.webContents.send(IPC.CONSOLE_LINE, profileId, { id, text, type, timestamp: Date.now() })
  }

  private pushSystem(_type: SystemMessageType, profileId: string, _pid: string, text: string) {
    const counter = (this.lineCounters.get(profileId) ?? 0) + 1
    this.lineCounters.set(profileId, counter)
    this.pushLine(profileId, text, 'system', counter)
  }

  private broadcastStates() {
    this.window?.webContents.send('process:statesUpdate', this.getStates())
  }
}

export const processManager = new ProcessManager()
