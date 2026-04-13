import { BodyParams, BodySchemaFor, RouteDefinition } from '../types/API.types';
import type { Profile } from '../types/Profile.types';
import type { AppSettings } from './Settings.config';

export const REST_API_CONFIG = {
  defaultPort: 4444,
  host: '127.0.0.1',
} as const;

type ProfileServerKeys = 'id' | 'createdAt' | 'updatedAt' | 'order';

const PROFILE_BODY = {
  name: { type: 'string', placeholder: 'My Server' },
  jarPath: { type: 'string', placeholder: '/path/to/app.jar' },
  workingDir: {
    type: 'string',
    placeholder: '/path/to/workdir',
    hint: 'Defaults to JAR directory',
  },
  javaPath: { type: 'string', placeholder: 'java', hint: 'Leave empty to use system PATH' },
  jvmArgs: { type: 'json', hint: 'Array of { value, enabled }' },
  systemProperties: { type: 'json', hint: 'Array of { key, value, enabled }' },
  programArgs: { type: 'json', hint: 'Array of { value, enabled }' },
  envVars: { type: 'json', hint: 'Array of { key, value, enabled }' },
  autoStart: { type: 'boolean', hint: 'Start automatically on app launch' },
  autoRestart: { type: 'boolean', hint: 'Restart automatically on crash' },
  autoRestartInterval: {
    type: 'number',
    placeholder: '10',
    hint: 'Seconds to wait before restarting',
  },
  color: { type: 'string', placeholder: '#4ade80', hint: 'Profile accent color (hex)' },
  fileLogging: { type: 'boolean', hint: 'Save session logs to file' },
  jarResolution: { type: 'json', hint: 'Jar resolution config object' },
} as const satisfies BodySchemaFor<Profile, ProfileServerKeys>;

const SETTINGS_BODY = {
  launchOnStartup: { type: 'boolean', hint: 'Launch on Windows startup' },
  startMinimized: { type: 'boolean', hint: 'Start minimized to tray' },
  minimizeToTray: { type: 'boolean', hint: 'Minimize to tray on close' },
  consoleFontSize: { type: 'number', placeholder: '13', hint: 'Console font size in px' },
  consoleMaxLines: { type: 'number', placeholder: '5000', hint: 'Max lines in buffer' },
  consoleWordWrap: { type: 'boolean', hint: 'Wrap long lines' },
  consoleLineNumbers: { type: 'boolean', hint: 'Show line numbers' },
  consoleTimestamps: { type: 'boolean', hint: 'Show timestamps' },
  consoleHistorySize: { type: 'number', placeholder: '100', hint: 'Command history size' },
  themeId: { type: 'string', placeholder: 'dark-default', hint: 'Theme ID' },
  languageId: { type: 'string', placeholder: 'en', hint: 'Language ID (e.g. en, de)' },
  restApiEnabled: { type: 'boolean', hint: 'Enable REST API' },
  restApiPort: { type: 'number', placeholder: '4444', hint: 'REST API port (restart required)' },
  devModeEnabled: { type: 'boolean', hint: 'Enable developer mode' },
} as const satisfies BodySchemaFor<AppSettings>;

function bodyFrom<T extends BodyParams>(model: T, required?: (keyof T)[]): BodyParams {
  const requiredSet = new Set<string>(required as string[]);
  const out: BodyParams = {};
  for (const [k, def] of Object.entries(model)) {
    out[k] = { ...def, required: requiredSet.has(k) };
  }
  return out;
}

export const routeConfig = {
  status: {
    method: 'GET',
    path: '/api/status',
    description: 'App status + version',
  },

  profiles_list: {
    method: 'GET',
    path: '/api/profiles',
    description: 'List all profiles',
  },
  profiles_get: {
    method: 'GET',
    path: '/api/profiles/:id',
    description: 'Get profile by ID',
  },
  profiles_create: {
    method: 'POST',
    path: '/api/profiles',
    description: 'Create profile',
    bodyParams: bodyFrom(PROFILE_BODY, ['name']),
  },
  profiles_update: {
    method: 'PUT',
    path: '/api/profiles/:id',
    description: 'Update profile',
    bodyParams: bodyFrom(PROFILE_BODY),
  },
  profiles_delete: {
    method: 'DELETE',
    path: '/api/profiles/:id',
    description: 'Delete profile',
  },

  processes_list: {
    method: 'GET',
    path: '/api/processes',
    description: 'Running process states',
  },
  processes_log: {
    method: 'GET',
    path: '/api/processes/log',
    description: 'Activity log',
  },
  processes_start: {
    method: 'POST',
    path: '/api/processes/:id/start',
    description: 'Start process',
  },
  processes_stop: {
    method: 'POST',
    path: '/api/processes/:id/stop',
    description: 'Graceful stop process',
  },
  processes_force_stop: {
    method: 'POST',
    path: '/api/processes/:id/force-stop',
    description: 'Force kill process',
  },
  processes_clear: {
    method: 'POST',
    path: '/api/processes/:id/console/clear',
    description: 'Clear console',
  },

  logs_list: {
    method: 'GET',
    path: '/api/logs/:id',
    description: 'List log files for profile',
  },
  logs_read: {
    method: 'GET',
    path: '/api/logs/:id/:filename',
    description: 'Read a log file',
  },
  logs_delete: {
    method: 'DELETE',
    path: '/api/logs/:id/:filename',
    description: 'Delete a log file',
  },

  settings_get: {
    method: 'GET',
    path: '/api/settings',
    description: 'Get settings',
  },
  settings_update: {
    method: 'PUT',
    path: '/api/settings',
    description: 'Update settings',
    bodyParams: bodyFrom(SETTINGS_BODY),
  },
} as const satisfies Record<string, RouteDefinition>;

export type RouteKey = keyof typeof routeConfig;
