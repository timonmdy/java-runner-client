import { spawn, execSync, ChildProcess } from 'child_process'
import { BrowserWindow } from 'electron'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { Profile, ProcessState, ConsoleLine, ProcessLogEntry, JavaProcessInfo } from './shared/types'
import { IPC } from './shared/types'

interface ManagedProcess {
  process:     ChildProcess
  profileId:   string
  profileName: string
  jarPath:     string
  startedAt:   number
  lineCounter: number
}

class ProcessManager {
  private processes   = new Map<string, ManagedProcess>()
  private activityLog: ProcessLogEntry[] = []
  private window: BrowserWindow | null = null

  setWindow(win: BrowserWindow): void { this.window = win }

  // ── Build args ──────────────────────────────────────────────────────────────

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

  // ── Start ───────────────────────────────────────────────────────────────────

  start(profile: Profile): { ok: boolean; error?: string } {
    if (this.processes.has(profile.id))
      return { ok: false, error: 'Process already running' }
    if (!profile.jarPath)
      return { ok: false, error: 'No JAR file specified' }

    const { cmd, args } = this.buildArgs(profile)
    const cwd = profile.workingDir || path.dirname(profile.jarPath)

    this.pushSystem(profile.id, `Starting: ${cmd} ${args.join(' ')}`)
    this.pushSystem(profile.id, `Working dir: ${cwd}`)

    let proc: ChildProcess
    try {
      proc = spawn(cmd, args, {
        cwd, env: process.env,
        shell: false, detached: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      this.pushSystem(profile.id, `Failed to start: ${msg}`)
      return { ok: false, error: msg }
    }

    const managed: ManagedProcess = {
      process: proc, profileId: profile.id, profileName: profile.name,
      jarPath: profile.jarPath, startedAt: Date.now(), lineCounter: 0,
    }
    this.processes.set(profile.id, managed)

    const pid = proc.pid ?? 0
    this.pushSystem(profile.id, `PID: ${pid}`)

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
    proc.on('error', (err) => this.pushSystem(profile.id, `Error: ${err.message}`))
    proc.on('exit', (code, signal) => {
      this.processes.delete(profile.id)
      const reason = signal ? `signal ${signal}` : `exit code ${code ?? '?'}`
      this.pushSystem(profile.id, `Process stopped (${reason})`)
      const entry = this.activityLog.find(e => e.profileId === profile.id && !e.stoppedAt)
      if (entry) { entry.stoppedAt = Date.now(); entry.exitCode = code ?? undefined; entry.signal = signal ?? undefined }
      this.broadcastStates()
    })

    this.broadcastStates()
    return { ok: true }
  }

  // ── Stop ────────────────────────────────────────────────────────────────────

  stop(profileId: string): { ok: boolean; error?: string } {
    const m = this.processes.get(profileId)
    if (!m) return { ok: false, error: 'Not running' }
    this.pushSystem(profileId, 'Stopping process...')
    const pid = m.process.pid
    if (process.platform === 'win32' && pid) {
      try { execSync(`taskkill /PID ${pid} /T /F`, { timeout: 5000 }) } catch {
        try { m.process.kill('SIGTERM') } catch { /* ignore */ }
      }
    } else {
      try { m.process.kill('SIGTERM') } catch { /* ignore */ }
      setTimeout(() => {
        if (this.processes.has(profileId)) {
          try { m.process.kill('SIGKILL') } catch { /* ignore */ }
        }
      }, 5000)
    }
    return { ok: true }
  }

  sendInput(profileId: string, input: string): { ok: boolean; error?: string } {
    const m = this.processes.get(profileId)
    if (!m) return { ok: false, error: 'Not running' }
    m.process.stdin?.write(input.endsWith('\n') ? input : `${input}\n`)
    this.pushLine(profileId, input, 'input', ++m.lineCounter)
    return { ok: true }
  }

  getStates(): ProcessState[] {
    return Array.from(this.processes.entries()).map(([id, m]) => ({
      profileId: id, running: true, pid: m.process.pid, startedAt: m.startedAt,
    }))
  }

  getActivityLog():  ProcessLogEntry[] { return this.activityLog }
  clearActivityLog(): void             { this.activityLog = [] }

  // ── Process Scanner — ALL processes, java ones highlighted ─────────────────
  //
  // We scan every process on the machine. isJava=true when the process name or
  // command line contains "java" (case-insensitive). managed=true when JRC
  // started it. This is far more reliable than filtering beforehand because
  // the Java(TM) Platform SE binary can appear under many names.

  scanAllProcesses(): JavaProcessInfo[] {
    const managedPids = new Set(
      Array.from(this.processes.values())
        .map(m => m.process.pid)
        .filter((p): p is number => p != null)
    )
    if (process.platform === 'win32') return this.scanAllWindows(managedPids)
    return this.scanAllUnix(managedPids)
  }

  private scanAllWindows(managedPids: Set<number>): JavaProcessInfo[] {
    // Use -EncodedCommand to pass Base64-encoded UTF-16LE script — avoids ALL
    // newline/quoting issues that break PowerShell when passed via -Command "..."
    //
    // Script: join Win32_Process (for CommandLine) with Get-Process (for all PIDs)
    // via a hashtable lookup so we get command lines for every process, not just java.
    const psScript = [
      '$procs = @{}',
      'Get-WmiObject Win32_Process | ForEach-Object { $procs[$_.ProcessId] = $_.CommandLine }',
      'Get-Process | ForEach-Object {',
      '  $cmd = if ($procs[$_.Id]) { $procs[$_.Id] } else { $_.ProcessName }',
      '  [PSCustomObject]@{ Id = $_.Id; Name = $_.ProcessName; Cmd = $cmd }',
      '} | ConvertTo-Json -Compress -Depth 2',
    ].join('; ')

    // Encode as UTF-16LE Base64 (what PowerShell -EncodedCommand expects)
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64')

    try {
      const raw_out = execSync(
        // -OutputFormat Text suppresses the XML progress/verbose serialization
        // that PowerShell emits when loading modules for the first time.
        `powershell -NoProfile -NonInteractive -OutputFormat Text -EncodedCommand ${encoded}`,
        { encoding: 'utf8', timeout: 20000 }
      )

      // Strip any non-JSON prefix lines (e.g. progress XML <Objs ...> noise)
      // The JSON output is always a single line starting with '[' or '{'
      const jsonLine = raw_out.split('\n').find(l => {
        const t = l.trim()
        return t.startsWith('[') || t.startsWith('{')
      })
      if (!jsonLine) return this.scanAllWindowsTasklist(managedPids)

      const raw   = JSON.parse(jsonLine.trim())
      const procs = Array.isArray(raw) ? raw : [raw]
      return procs
        .map((p: Record<string, unknown>) => {
          const pid  = Number(p.Id)
          const name = String(p.Name ?? '')
          const cmd  = String(p.Cmd  ?? name)
          if (isNaN(pid) || pid <= 0) return null
          const isJava = /java/i.test(name) || /java/i.test(cmd)
          return { pid, command: (cmd.length > 2 ? cmd : name).slice(0, 300), isJava, managed: managedPids.has(pid) } as JavaProcessInfo
        })
        .filter((x): x is JavaProcessInfo => x !== null)
        .sort((a, b) => (b.isJava ? 1 : 0) - (a.isJava ? 1 : 0))
    } catch {
      return this.scanAllWindowsTasklist(managedPids)
    }
  }

  /**
   * Fallback scanner using `tasklist /fo csv` — always available on Windows,
   * no PowerShell required. Does not give command lines but gives PID + name.
   */
  private scanAllWindowsTasklist(managedPids: Set<number>): JavaProcessInfo[] {
    try {
      // tasklist /fo csv output: "Image Name","PID","Session Name","Session#","Mem Usage"
      const out = execSync('tasklist /fo csv /nh', { encoding: 'utf8', timeout: 8000 })
      const results: JavaProcessInfo[] = []
      for (const line of out.split('\n')) {
        const t = line.trim()
        if (!t) continue
        // Remove surrounding quotes and split on ","
        const parts = t.replace(/"/g, '').split(',')
        if (parts.length < 2) continue
        const name = parts[0].trim()
        const pid  = parseInt(parts[1].trim(), 10)
        if (isNaN(pid) || pid <= 0) continue
        const isJava = /java/i.test(name)
        results.push({ pid, command: name, isJava, managed: managedPids.has(pid) })
      }
      return results.sort((a, b) => (b.isJava ? 1 : 0) - (a.isJava ? 1 : 0))
    } catch { return [] }
  }

  private scanAllUnix(managedPids: Set<number>): JavaProcessInfo[] {
    try {
      const out = execSync('ps -eo pid,comm,args', { encoding: 'utf8', timeout: 5000 })
      return out.split('\n')
        .slice(1)
        .filter(Boolean)
        .map(line => {
          const parts = line.trim().split(/\s+/)
          const pid   = parseInt(parts[0], 10)
          const name  = parts[1] ?? ''
          const cmd   = parts.slice(2).join(' ').slice(0, 300)
          if (isNaN(pid)) return null
          const isJava = /java/i.test(name) || /java/i.test(cmd)
          return { pid, command: cmd || name, isJava, managed: managedPids.has(pid) } as JavaProcessInfo
        })
        .filter((x): x is JavaProcessInfo => x !== null)
        .sort((a, b) => (b.isJava ? 1 : 0) - (a.isJava ? 1 : 0))
    } catch { return [] }
  }

  killPid(pid: number): { ok: boolean; error?: string } {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${pid} /T /F`, { timeout: 5000 })
      } else {
        process.kill(pid, 'SIGKILL')
      }
      for (const [id, m] of this.processes.entries()) {
        if (m.process.pid === pid) { this.processes.delete(id); break }
      }
      this.broadcastStates()
      return { ok: true }
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  killAllJava(): { ok: boolean; killed: number } {
    const procs = this.scanAllProcesses().filter(p => p.isJava)
    let killed  = 0
    for (const p of procs) if (this.killPid(p.pid).ok) killed++
    return { ok: true, killed }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private pushOutput(pid: string, chunk: string, type: 'stdout' | 'stderr', m: ManagedProcess) {
    const lines = chunk.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      if (i === lines.length - 1 && lines[i] === '') continue
      this.pushLine(pid, lines[i], type, ++m.lineCounter)
    }
  }

  private pushLine(profileId: string, text: string, type: ConsoleLine['type'], id: number) {
    this.window?.webContents.send(IPC.CONSOLE_LINE, profileId, { id, text, type, timestamp: Date.now() })
  }

  private pushSystem(profileId: string, text: string) {
    this.pushLine(profileId, text, 'system', Date.now())
  }

  private broadcastStates() {
    this.window?.webContents.send('process:statesUpdate', this.getStates())
  }
}

export const processManager = new ProcessManager()
