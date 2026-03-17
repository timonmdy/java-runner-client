// ── Shared type definitions ─────────────────────────────────────────────────
// Used by both the Electron main process and the React renderer.

export interface SystemProperty { key: string; value: string; enabled: boolean }
export interface JvmArgument    { value: string; enabled: boolean }
export interface ProgramArgument{ value: string; enabled: boolean }

export interface Profile {
  id: string; name: string; jarPath: string; workingDir: string;
  jvmArgs: JvmArgument[]; systemProperties: SystemProperty[];
  programArgs: ProgramArgument[]; javaPath: string;
  autoStart: boolean; color: string; createdAt: number; updatedAt: number;
  restartOnCrash?: boolean; restartIntervalMs?: number;
}

export interface AppSettings {
  launchOnStartup:    boolean;
  startMinimized:     boolean;
  minimizeToTray:     boolean;
  consoleFontSize:    number;
  consoleMaxLines:    number;
  consoleWordWrap:    boolean;
  consoleLineNumbers: boolean;  // NEW
  consoleHistorySize: number;
  theme: 'dark';
}

export interface ConsoleLine {
  id: number; text: string;
  type: 'stdout' | 'stderr' | 'input' | 'system';
  timestamp: number;
}

export interface ProcessState {
  profileId: string; running: boolean;
  pid?: number; startedAt?: number; exitCode?: number;
}

/** Entry in the process activity log — persists after process stops */
export interface ProcessLogEntry {
  id:          string;   // unique log entry id
  profileId:   string;
  profileName: string;
  jarPath:     string;
  pid:         number;
  startedAt:   number;
  stoppedAt?:  number;
  exitCode?:   number;
  signal?:     string;
}

/** Result of a system Java process scan */
export interface JavaProcessInfo {
  pid:     number;
  command: string;   // full command line snippet
  isJava:  boolean;  // true if name/cmd contains "java"
  managed: boolean;  // true if JRC is managing it
}

export const IPC = {
  PROFILES_GET_ALL:    'profiles:getAll',
  PROFILES_SAVE:       'profiles:save',
  PROFILES_DELETE:     'profiles:delete',
  PROCESS_START:       'process:start',
  PROCESS_STOP:        'process:stop',
  PROCESS_SEND_INPUT:  'process:sendInput',
  PROCESS_GET_STATES:  'process:getStates',
  PROCESS_GET_LOG:     'process:getLog',       // NEW
  PROCESS_CLEAR_LOG:   'process:clearLog',      // NEW
  PROCESS_SCAN_ALL:    'process:scanAll',        // scan all OS processes
  PROCESS_KILL_PID:    'process:killPid',       // NEW — kill arbitrary PID
  PROCESS_KILL_ALL_JAVA: 'process:killAllJava', // NEW
  CONSOLE_LINE:        'console:line',
  SETTINGS_GET:        'settings:get',
  SETTINGS_SAVE:       'settings:save',
  DIALOG_PICK_JAR:     'dialog:pickJar',
  DIALOG_PICK_DIR:     'dialog:pickDir',
  DIALOG_PICK_JAVA:    'dialog:pickJava',
  WINDOW_MINIMIZE:     'window:minimize',
  WINDOW_CLOSE:        'window:close',
  TRAY_SHOW:           'tray:show',
} as const
