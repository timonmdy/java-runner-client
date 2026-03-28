import { ChildProcess, execSync } from 'child_process';

const GRACEFUL_TIMEOUT_MS = 5000;
const FORCE_TIMEOUT_MS = 3000;

/**
 * Gracefully stop a process (like IntelliJ IDEA):
 * 1. Send SIGINT (Ctrl+C equivalent) to let the process shut down cleanly
 * 2. Wait up to GRACEFUL_TIMEOUT_MS
 * 3. If still alive, send SIGTERM
 * 4. Wait up to FORCE_TIMEOUT_MS
 * 5. If still alive, force kill (SIGKILL / taskkill /F)
 */
export function gracefulStop(
  proc: ChildProcess,
  profileId: string,
  onPhase: (phase: 'sigint' | 'sigterm' | 'sigkill') => void,
  onDone: () => void
): void {
  const pid = proc.pid;
  if (!pid) {
    onDone();
    return;
  }

  let resolved = false;
  const finish = () => {
    if (resolved) return;
    resolved = true;
    onDone();
  };

  // If the process exits on its own at any point, we're done
  proc.once('exit', finish);

  // Phase 1: SIGINT (Ctrl+C)
  onPhase('sigint');
  if (process.platform === 'win32') {
    // Windows: Generate a Ctrl+C event via stdin or use taskkill without /F
    try {
      // taskkill without /F sends WM_CLOSE which is the closest to SIGINT on Windows
      execSync(`taskkill /PID ${pid} /T`, { timeout: 2000, stdio: 'ignore' });
    } catch {
      // Process might not accept WM_CLOSE — that's fine, we'll escalate
    }
  } else {
    try {
      proc.kill('SIGINT');
    } catch {
      // Already exited
    }
  }

  // Phase 2: SIGTERM after graceful timeout
  const termTimer = setTimeout(() => {
    if (resolved) return;
    onPhase('sigterm');

    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { timeout: 3000, stdio: 'ignore' });
      } catch {
        /* ignore */
      }
    } else {
      try {
        proc.kill('SIGTERM');
      } catch {
        /* ignore */
      }
    }

    // Phase 3: SIGKILL as last resort
    const killTimer = setTimeout(() => {
      if (resolved) return;
      onPhase('sigkill');
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /PID ${pid} /T /F`, { timeout: 3000, stdio: 'ignore' });
        } else {
          proc.kill('SIGKILL');
        }
      } catch {
        /* ignore */
      }
      finish();
    }, FORCE_TIMEOUT_MS);

    proc.once('exit', () => clearTimeout(killTimer));
  }, GRACEFUL_TIMEOUT_MS);

  proc.once('exit', () => clearTimeout(termTimer));
}
