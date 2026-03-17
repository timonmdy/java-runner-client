# Java Runner Client: Process Management Technical Details

## Overview

Java Runner Client (JRC) spawns and manages single Java processes via Node.js `child_process.spawn()`. Each profile corresponds to one independent Java process. The term "managed process" refers to JRC's internal wrapper tracking that process, not a separate secondary process.

## Process Launch Architecture

### Single Java Process Spawning

When you start a Java process, JRC:

1. **Builds Arguments** (`buildArgs()` method):
   - Collects all enabled JVM arguments from the profile (e.g., `-Xmx2048m`, `-Xms512m`)
   - Adds system properties via `-D` flags (e.g., `-Dapp.name=value`)
   - Appends `-jar` with the JAR path
   - Adds program arguments passed to the Java application
   - Example output: `java -Xmx2048m -Dkey=value -jar /path/to/app.jar arg1 arg2`

2. **Spawns Direct Process**:
   ```typescript
   proc = spawn(cmd, args, { 
     cwd, env: process.env, 
     shell: false,              // Direct execution, no shell overhead
     detached: false, 
     stdio: ['pipe', 'pipe', 'pipe']  // Captures stdin, stdout, stderr
   })
   ```
   - Uses `shell: false` for efficiency (direct JVM launch, no shell wrapper)
   - Inherits environment variables from the Electron app
   - Pipes all I/O streams so ProcessManager can capture real-time output

### The "Managed Process" Wrapper

The `ManagedProcess` interface is **not a second process** — it's a lightweight wrapper object tracking the spawned process:

```typescript
interface ManagedProcess {
  process:     ChildProcess           // Node.js child process handle
  profileId:   string                 // Profile identifier
  profileName: string                 // Human-readable name
  jarPath:     string                 // JAR file path
  startedAt:   number                 // Start timestamp
  intentionallyStopped: boolean        // User explicitly stopped it?
}
```

Managed processes are stored in a `Map<string, ManagedProcess>` (keyed by profile ID) to:
- Track which profiles have active processes
- Store execution metadata
- Enable lifecycle management (stop, restart, monitor)

## Real-Time I/O Capturing

ProcessManager captures stdout and stderr in real-time:

```typescript
proc.stdout?.on('data', (chunk: string) => this.pushOutput(profile.id, chunk, 'stdout', managed))
proc.stderr?.on('data', (chunk: string) => this.pushOutput(profile.id, chunk, 'stderr', managed))
```

Key features:
- Each output line receives a **persistent, incrementing counter ID** (survives process restarts)
- IDs are sequential numbers (1, 2, 3...) rather than composite strings
- Duplicate detection throws an error if ID collision occurs
- Line IDs are tracked in a Set per-profile for O(1) lookup
- UI receives output via Electron IPC (`CONSOLE_LINE` message)

### Deduplication & Tracking

The ProcessManager maintains persistent state per-profile:
- **`lineCounters`** Map: Incrementing counter that doesn't reset on restart
- **`seenLineIds`** Map: Set of all seen IDs to detect collisions
- Auto-cleanup triggers at 10k entries to prevent unbounded memory growth
- Each line gets unique sequential ID, ensuring no duplicates across 5000+ entries

## Process Lifecycle Management

### Real-Time Monitoring

```typescript
proc.on('exit', (code, signal) => { /* handling */ })
proc.on('error', (err) => { /* handling */ })
```

- Detects natural termination or crashes
- Records exit code and signal information
- Stores metadata in activity log (max 500 entries, UUID-based)
- Broadcasts state update to UI

### Graceful Shutdown

**Windows** (primary method):
```
taskkill /PID {pid} /T /F
```
- `/T`: Kill process tree (includes child processes)
- `/F`: Force termination if graceful fails

**Unix** (tiered approach):
1. Send `SIGTERM` (graceful shutdown)
2. Wait 5 seconds
3. Send `SIGKILL` if still running (force termination)

### Auto-Restart Logic

If process exits with non-zero code AND `autoRestart` is enabled:
1. Waits `autoRestartInterval` seconds (default: 10s)
2. Uses stored profile snapshot (captures config state at start)
3. Automatically restarts with identical settings
4. Profile snapshots update whenever user saves configuration

## Process Discovery & Scanning

JRC can enumerate all Java processes system-wide (not just managed ones):

**Windows**: PowerShell WMI query
- Retrieves command line for all processes
- Extracts memory usage, thread count, start time
- Identifies Java processes by `java.exe` presence
- Fallback to `tasklist /fo csv` if WMI unavailable

**Unix**: `ps -eo pid,comm,args`
- Parses system process list
- Identifies JAR files via `-jar` flag regex
- Extracts memory and thread info from procfs

Each discovered process is marked as `managed: boolean` (whether JRC started it).

## Technical Efficiency

### Direct Execution
- `shell: false` avoids shell wrapper overhead
- Significant performance improvement for frequent restarts
- Direct JVM launch with minimal context overhead

### Persistent State
- Line counters survive process restarts (not tied to ManagedProcess lifecycle)
- Activity log maintains historical execution data
- Profile snapshots capture exact configuration at start time

### Memory Management
- Activity log auto-pops entries beyond 500
- Line ID tracking Set auto-clears at 10k entries
- Map-based storage with O(1) lookups for process state

### Environment Isolation
- Each process can inherit custom working directories
- System properties configurable via `-D` flags
- Separate stdout/stderr streams prevent log mixing

## IPC Communication Flow

```
┌─────────────────────────┐
│  Java Process           │ (stdout/stderr output)
└────────────┬────────────┘
             │ [piped to Node.js]
             ↓
┌─────────────────────────┐
│ ProcessManager          │ (captures, formats with line ID)
└────────────┬────────────┘
             │
             ↓ Electron IPC: CONSOLE_LINE
┌─────────────────────────┐
│ Renderer (React)        │ (console component)
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────┐
│ User UI                 │ (displays real-time output)
└─────────────────────────┘
```

## Single vs. Multiple Processes

JRC's single-process-per-profile design means:
- Each profile spawns exactly one Java process
- Multiple profiles = multiple independent processes
- No inter-process communication overhead
- Each process gets isolated I/O, environment, and lifecycle management
- Simplifies troubleshooting (one PID per configuration)

## Data Structures

| Map | Purpose | Key | Value | Lifecycle |
|-----|---------|-----|-------|-----------|
| `processes` | Active managed processes | Profile ID | ManagedProcess | Per-process |
| `lineCounters` | Persistent line numbering | Profile ID | Counter number | Per-profile (survives restarts) |
| `seenLineIds` | Duplicate detection | Profile ID | Set of IDs | Per-profile (auto-cleans at 10k) |
| `restartTimers` | Pending auto-restart timers | Profile ID | Timeout handle | Until restart or stop |
| `profileSnapshots` | Saved configurations | Profile ID | Profile object | While process running |
| `activityLog` | Execution history | — | ProcessLogEntry[] | Global (max 500) |
