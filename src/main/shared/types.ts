export interface SystemProperty  { key: string; value: string; enabled: boolean }
export interface JvmArgument     { value: string; enabled: boolean }
export interface ProgramArgument { value: string; enabled: boolean }

export interface Profile {
  id: string; name: string; jarPath: string; workingDir: string;
  jvmArgs: JvmArgument[]; systemProperties: SystemProperty[];
  programArgs: ProgramArgument[]; javaPath: string;
  autoStart: boolean; color: string; createdAt: number; updatedAt: number;
  autoRestart:         boolean;
  autoRestartInterval: number;
}

export interface AppSettings {
  launchOnStartup:    boolean;
  startMinimized:     boolean;
  minimizeToTray:     boolean;
  consoleFontSize:    number;
  consoleMaxLines:    number;
  consoleWordWrap:    boolean;
  consoleLineNumbers: boolean;
  consoleHistorySize: number;
  theme:              'dark';
  restApiEnabled:     boolean;
  restApiPort:        number;
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

export interface ProcessLogEntry {
  id: string; profileId: string; profileName: string;
  jarPath: string; pid: number; startedAt: number;
  stoppedAt?: number; exitCode?: number; signal?: string;
}

export interface JavaProcessInfo {
  pid:        number;
  name:       string;
  command:    string;
  isJava:     boolean;
  managed:    boolean;
  memoryMB?:  number;
  startTime?: string;
  threads?:   number;
  jarName?:   string;
}

export const IPC = {
  PROFILES_GET_ALL:       'profiles:getAll',
  PROFILES_SAVE:          'profiles:save',
  PROFILES_DELETE:        'profiles:delete',
  PROCESS_START:          'process:start',
  PROCESS_STOP:           'process:stop',
  PROCESS_SEND_INPUT:     'process:sendInput',
  PROCESS_GET_STATES:     'process:getStates',
  PROCESS_GET_LOG:        'process:getLog',
  PROCESS_CLEAR_LOG:      'process:clearLog',
  PROCESS_SCAN_ALL:       'process:scanAll',
  PROCESS_KILL_PID:       'process:killPid',
  PROCESS_KILL_ALL_JAVA:  'process:killAllJava',
  CONSOLE_LINE:           'console:line',
  CONSOLE_CLEAR:          'console:clear',
  SETTINGS_GET:           'settings:get',
  SETTINGS_SAVE:          'settings:save',
  DIALOG_PICK_JAR:        'dialog:pickJar',
  DIALOG_PICK_DIR:        'dialog:pickDir',
  DIALOG_PICK_JAVA:       'dialog:pickJava',
  WINDOW_MINIMIZE:        'window:minimize',
  WINDOW_CLOSE:           'window:close',
  TRAY_SHOW:              'tray:show',
} as const
