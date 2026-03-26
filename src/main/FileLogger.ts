import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const LOG_DIR_NAME = 'logs';

function getLogDir(profileId: string): string {
  const base = path.join(app.getPath('userData'), LOG_DIR_NAME, profileId);
  fs.mkdirSync(base, { recursive: true });
  return base;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

function formatLineTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().replace('T', ' ').slice(0, 23);
}

export interface LogSession {
  profileId: string;
  startedAt: number;
  filePath: string;
  stream: fs.WriteStream;
}

const activeSessions = new Map<string, LogSession>();

export function startLogSession(profileId: string): LogSession {
  stopLogSession(profileId);

  const startedAt = Date.now();
  const dir = getLogDir(profileId);
  const startStr = formatTimestamp(startedAt);
  // Final filename will have stop timestamp appended on close
  const tempName = `session_${startStr}.log`;
  const filePath = path.join(dir, tempName);

  const stream = fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf8' });
  stream.write(`=== Session started at ${new Date(startedAt).toISOString()} ===\n`);

  const session: LogSession = { profileId, startedAt, filePath, stream };
  activeSessions.set(profileId, session);
  return session;
}

export function writeLogLine(
  profileId: string,
  text: string,
  type: string,
  timestamp: number
): void {
  const session = activeSessions.get(profileId);
  if (!session) return;

  const prefix = `[${formatLineTimestamp(timestamp)}] [${type.toUpperCase().padEnd(6)}]`;
  session.stream.write(`${prefix} ${text}\n`);
}

export function stopLogSession(profileId: string): void {
  const session = activeSessions.get(profileId);
  if (!session) return;

  const stoppedAt = Date.now();
  session.stream.write(`=== Session stopped at ${new Date(stoppedAt).toISOString()} ===\n`);
  session.stream.end();

  // Rename file to include stop timestamp
  const dir = path.dirname(session.filePath);
  const startStr = formatTimestamp(session.startedAt);
  const stopStr = formatTimestamp(stoppedAt);
  const finalName = `session_${startStr}_to_${stopStr}.log`;
  const finalPath = path.join(dir, finalName);

  try {
    fs.renameSync(session.filePath, finalPath);
  } catch {
    // File might be locked — leave as-is
  }

  activeSessions.delete(profileId);
}

export function isLogging(profileId: string): boolean {
  return activeSessions.has(profileId);
}

export interface LogFileInfo {
  filename: string;
  filePath: string;
  size: number;
  startedAt: string;
  stoppedAt?: string;
}

export function getLogFiles(profileId: string): LogFileInfo[] {
  const dir = path.join(app.getPath('userData'), LOG_DIR_NAME, profileId);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.log'))
    .map((filename) => {
      const filePath = path.join(dir, filename);
      const stat = fs.statSync(filePath);
      // Parse timestamps from filename: session_YYYY-MM-DD_HH-MM-SS_to_YYYY-MM-DD_HH-MM-SS.log
      const match = filename.match(
        /session_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})(?:_to_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}))?/
      );
      return {
        filename,
        filePath,
        size: stat.size,
        startedAt: match?.[1]?.replace(/_/g, ' ').replace(/-/g, ':').replace(/^(\d{4}):/, '$1-').replace(/:(\d{2}):/, '-$1 ') ?? '',
        stoppedAt: match?.[2]?.replace(/_/g, ' ').replace(/-/g, ':').replace(/^(\d{4}):/, '$1-').replace(/:(\d{2}):/, '-$1 ') ?? undefined,
      };
    })
    .sort((a, b) => b.filename.localeCompare(a.filename));
}

export function readLogFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

export function deleteLogFile(filePath: string): boolean {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getLogsDirectory(profileId: string): string {
  return path.join(app.getPath('userData'), LOG_DIR_NAME, profileId);
}
